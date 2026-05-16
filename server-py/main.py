import asyncio
import json
import os
import uuid
import hashlib
import logging
from typing import List, Optional, Dict, Any, Tuple
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from neo4j import GraphDatabase, AsyncGraphDatabase
from neo4j.exceptions import ServiceUnavailable
import asyncpg
import redis.asyncio as aioredis

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
REDIS_URL = os.getenv("REDIS_URL")
LATTICE9_ENGINE_KEY = os.getenv("LATTICE9_ENGINE_KEY")

REQUIRED_ENV = {
    "DATABASE_URL": DATABASE_URL,
    "NEO4J_URI": NEO4J_URI,
    "NEO4J_USER": NEO4J_USER,
    "NEO4J_PASSWORD": NEO4J_PASSWORD,
    "LATTICE9_ENGINE_KEY": LATTICE9_ENGINE_KEY,
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("lattice9-graph-engine")

missing = [k for k, v in REQUIRED_ENV.items() if not v]
if missing:
    logger.warning(f"Missing required environment variables: {', '.join(missing)}")

app = FastAPI(title="Lattice9 Graph Engine", version="5.0.0")

ENTITY_TYPES = {
    "host": "Host",
    "service": "Service",
    "endpoint": "Endpoint",
    "identity": "Identity",
    "credential": "Credential",
    "vulnerability": "Vulnerability",
    "finding": "Finding",
    "evidence": "Evidence",
    "trust_zone": "TrustZone",
    "objective": "Objective",
}

async def get_pg_pool():
    return await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=4)

class IntelligenceEngine:
    def __init__(self):
        self.driver = None
        self.redis_client = None
        try:
            if NEO4J_URI and NEO4J_USER and NEO4J_PASSWORD:
                self.driver = AsyncGraphDatabase.driver(
                    NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)
                )
                logger.info("Neo4j async driver created.")
        except Exception as e:
            logger.error(f"Failed to create Neo4j driver: {e}")

        try:
            if REDIS_URL:
                self.redis_client = aioredis.from_url(REDIS_URL)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")

    async def close(self):
        if self.driver:
            await self.driver.close()
        if self.redis_client:
            await self.redis_client.close()

    async def _ensure_constraints(self):
        if not self.driver:
            return
        async with self.driver.session(database="neo4j") as session:
            constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS FOR (e:L9Entity) REQUIRE (e.engagement_id, e.entity_type, e.canonical_key) IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (e:L9Entity) REQUIRE e.id IS UNIQUE",
                "CREATE INDEX IF NOT EXISTS FOR (e:L9Entity) ON (e.engagement_id)",
                "CREATE INDEX IF NOT EXISTS FOR (e:L9Entity) ON (e.entity_type)",
            ]
            for cypher in constraints:
                try:
                    await session.run(cypher)
                except Exception as e:
                    logger.warning(f"Constraint/index creation skipped: {e}")

    async def correlate_entities(self, engagement_id: str):
        """
        Pull entities from PostgreSQL, merge into Neo4j graph,
        and infer typed relationships.
        """
        logger.info(f"Running correlation pass for engagement {engagement_id}")
        if not self.driver:
            logger.error("Neo4j driver not available, skipping correlation")
            return

        await self._ensure_constraints()

        pg_pool = await get_pg_pool()
        try:
            async with pg_pool.acquire() as conn:
                # 1. Fetch entities for this engagement
                rows = await conn.fetch(
                    "SELECT id, entity_type, canonical_key, display_name, "
                    "confidence::text, first_seen_at, last_seen_at, valid_from, "
                    "valid_to, attributes::text "
                    "FROM entities WHERE engagement_id = $1",
                    engagement_id
                )

                if not rows:
                    logger.info(f"No entities found for engagement {engagement_id}")
                    return

                # 2. Fetch findings (they become Finding nodes)
                finding_rows = await conn.fetch(
                    "SELECT f.id, f.title, f.severity, f.confidence::text, "
                    "f.validation_state, f.cwe, f.affected_entity_id, "
                    "f.first_seen_at, f.last_seen_at, "
                    "COALESCE(e.display_name, 'unknown') as entity_name, "
                    "COALESCE(e.canonical_key, 'unknown') as entity_key "
                    "FROM findings f "
                    "LEFT JOIN entities e ON f.affected_entity_id = e.id "
                    "WHERE f.engagement_id = $1",
                    engagement_id
                )

                # 3. Fetch evidence items
                evidence_rows = await conn.fetch(
                    "SELECT id, source_type, artifact_uri, sha256, "
                    "captured_at, metadata::text "
                    "FROM evidence_items WHERE engagement_id = $1",
                    engagement_id
                )

                logger.info(
                    f"Fetched {len(rows)} entities, {len(finding_rows)} findings, "
                    f"{len(evidence_rows)} evidence items"
                )

            # 4. Merge all entity nodes into Neo4j
            async with self.driver.session(database="neo4j") as session:
                for row in rows:
                    attrs = json.loads(row["attributes"]) if row["attributes"] else {}
                    await session.run(
                        """
                        MERGE (e:L9Entity {
                            engagement_id: $engagement_id,
                            entity_type: $entity_type,
                            canonical_key: $canonical_key
                        })
                        SET e.id = $id,
                            e.display_name = $display_name,
                            e.confidence = $confidence,
                            e.first_seen_at = $first_seen_at,
                            e.last_seen_at = $last_seen_at,
                            e.valid_from = $valid_from,
                            e.valid_to = $valid_to,
                            e.attributes = $attributes
                        """,
                        engagement_id=engagement_id,
                        entity_type=row["entity_type"],
                        canonical_key=row["canonical_key"],
                        id=str(row["id"]),
                        display_name=row["display_name"],
                        confidence=float(row["confidence"]),
                        first_seen_at=row["first_seen_at"].isoformat(),
                        last_seen_at=row["last_seen_at"].isoformat(),
                        valid_from=row["valid_from"].isoformat(),
                        valid_to=row["valid_to"].isoformat() if row["valid_to"] else None,
                        attributes=json.dumps(attrs),
                    )

                # 5. Merge finding nodes + link to affected entity
                for f in finding_rows:
                    await session.run(
                        """
                        MERGE (n:L9Entity {
                            engagement_id: $engagement_id,
                            entity_type: 'finding',
                            canonical_key: $id
                        })
                        SET n.id = $id,
                            n.display_name = $title,
                            n.severity = $severity,
                            n.confidence = $confidence,
                            n.validation_state = $validation_state,
                            n.cwe = $cwe,
                            n.first_seen_at = $first_seen_at,
                            n.last_seen_at = $last_seen_at
                        """,
                        engagement_id=engagement_id,
                        id=str(f["id"]),
                        title=f["title"],
                        severity=f["severity"],
                        confidence=float(f["confidence"]) if f["confidence"] else 0.5,
                        validation_state=f["validation_state"],
                        cwe=f["cwe"] or "",
                        first_seen_at=f["first_seen_at"].isoformat(),
                        last_seen_at=f["last_seen_at"].isoformat(),
                    )

                    # Link finding -> affected entity via HAS_FINDING relationship
                    if f["affected_entity_id"]:
                        await session.run(
                            """
                            MATCH (finding:L9Entity {id: $finding_id})
                            MATCH (entity:L9Entity {id: $entity_id})
                            MERGE (entity)-[r:HAS_FINDING]->(finding)
                            SET r.last_seen_at = $last_seen_at,
                                r.confidence = $confidence
                            """,
                            finding_id=str(f["id"]),
                            entity_id=str(f["affected_entity_id"]),
                            last_seen_at=f["last_seen_at"].isoformat(),
                            confidence=float(f["confidence"]) if f["confidence"] else 0.5,
                        )

                # 6. Merge evidence nodes + link them
                for ev in evidence_rows:
                    await session.run(
                        """
                        MERGE (n:L9Entity {
                            engagement_id: $engagement_id,
                            entity_type: 'evidence',
                            canonical_key: $sha256
                        })
                        SET n.id = $id,
                            n.display_name = $source_type,
                            n.artifact_uri = $artifact_uri,
                            n.captured_at = $captured_at
                        """,
                        engagement_id=engagement_id,
                        sha256=ev["sha256"],
                        id=str(ev["id"]),
                        source_type=ev["source_type"],
                        artifact_uri=ev["artifact_uri"],
                        captured_at=ev["captured_at"].isoformat(),
                    )

                # 7. Infer relationships between entities based on type patterns
                await self._infer_relationships(session, engagement_id, rows)

                logger.info(f"Correlation complete for engagement {engagement_id}")

        except Exception as e:
            logger.error(f"Correlation failed: {e}", exc_info=True)
        finally:
            await pg_pool.close()

    async def _infer_relationships(self, session, engagement_id, rows):
        """
        Infer typed relationships between entities based on naming conventions
        and type-pairing rules.
        """
        # Map entities by type for relationship inference
        by_type: Dict[str, List[Dict]] = {}
        for row in rows:
            et = row["entity_type"]
            if et not in by_type:
                by_type[et] = []
            by_type[et].append(row)

        # RESOLVES_TO: host entities named as IPs -> host entities named as FQDNs
        hosts = by_type.get("host", [])
        for host in hosts:
            ck = host["canonical_key"]
            # If this looks like a domain, check for IP-patterned hosts
            if not ck.replace(".", "").isdigit():
                for other in hosts:
                    ock = other["canonical_key"]
                    if ock.replace(".", "").isdigit():
                        await session.run(
                            """
                            MATCH (a:L9Entity {id: $source_id})
                            MATCH (b:L9Entity {id: $target_id})
                            MERGE (a)-[r:RESOLVES_TO]->(b)
                            SET r.confidence = 0.7,
                                r.first_seen_at = $now
                            """,
                            source_id=str(host["id"]),
                            target_id=str(other["id"]),
                            now=host["first_seen_at"].isoformat(),
                        )

        # HOSTS: service entities -> host entities (by canonical_key prefix matching)
        services = by_type.get("service", [])
        for svc in services:
            svc_key = svc["canonical_key"]
            for host in hosts:
                host_key = host["canonical_key"]
                if host_key in svc_key or svc_key.endswith(host_key):
                    await session.run(
                        """
                        MATCH (a:L9Entity {id: $svc_id})
                        MATCH (b:L9Entity {id: $host_id})
                        MERGE (b)-[r:HOSTS]->(a)
                        SET r.confidence = 0.8,
                            r.first_seen_at = $now
                        """,
                        svc_id=str(svc["id"]),
                        host_id=str(host["id"]),
                        now=svc["first_seen_at"].isoformat(),
                    )

        logger.info(f"Inferred relationships for engagement {engagement_id}")

    async def generate_attack_paths(self, engagement_id: str):
        """
        Use weighted Neo4j graph traversal (Cypher) to find ranked attack paths
        from entry nodes (services exposed to internet) to objectives.
        Results are written back to PostgreSQL and a drift score is published to Redis.
        """
        logger.info(f"Generating attack paths for engagement {engagement_id}")
        if not self.driver:
            logger.error("Neo4j driver not available, skipping attack path generation")
            return

        try:
            async with self.driver.session(database="neo4j") as session:
                # Find exposure-level nodes — entities with high connectivity
                # or explicitly marked as entry points
                result = await session.run(
                    """
                    // Find paths from high-exposure nodes to findings/critical entities
                    MATCH path = (entry:L9Entity {engagement_id: $engagement_id})
                        -[:HAS_FINDING|HOSTS|RESOLVES_TO*1..5]->(terminal:L9Entity)
                    WHERE entry.entity_type IN ['service', 'host', 'endpoint']
                      AND terminal.entity_type IN ['finding', 'vulnerability', 'objective']
                    RETURN
                        [n in nodes(path) | n.display_name] AS node_names,
                        [n in nodes(path) | n.entity_type] AS node_types,
                        [n in nodes(path) | n.id] AS node_ids,
                        length(path) AS depth,
                        reduce(conf = 1.0, n in nodes(path) |
                            conf * coalesce(toFloat(n.confidence), 0.5)
                        ) AS path_confidence
                    ORDER BY path_confidence DESC
                    LIMIT 20
                    """,
                    engagement_id=engagement_id
                )

                paths = []
                async for record in result:
                    paths.append({
                        "node_names": record["node_names"],
                        "node_types": record["node_types"],
                        "node_ids": record["node_ids"],
                        "depth": record["depth"],
                        "path_confidence": record["path_confidence"],
                    })

                # Fallback: if no paths found via traversal, attempt brute force
                if not paths:
                    result = await session.run(
                        """
                        MATCH (a:L9Entity {engagement_id: $engagement_id})
                        MATCH (b:L9Entity {engagement_id: $engagement_id})
                        WHERE a <> b
                          AND a.entity_type IN ['service', 'host', 'endpoint']
                          AND b.entity_type IN ['finding', 'vulnerability', 'objective']
                        WITH a, b
                        OPTIONAL MATCH p = shortestPath(
                            (a)-[*..6]-(b)
                        )
                        WHERE p IS NOT NULL
                        RETURN
                            [n in nodes(p) | n.display_name] AS node_names,
                            [n in nodes(p) | n.entity_type] AS node_types,
                            [n in nodes(p) | n.id] AS node_ids,
                            length(p) AS depth,
                            0.5 AS path_confidence
                        ORDER BY depth ASC
                        LIMIT 20
                        """,
                        engagement_id=engagement_id
                    )
                    async for record in result:
                        paths.append({
                            "node_names": record["node_names"],
                            "node_types": record["node_types"],
                            "node_ids": record["node_ids"],
                            "depth": record["depth"],
                            "path_confidence": record["path_confidence"],
                        })

                logger.info(
                    f"Generated {len(paths)} attack paths for engagement {engagement_id}"
                )

                # Persist attack paths to PostgreSQL
                pg_pool = await get_pg_pool()
                try:
                    async with pg_pool.acquire() as conn:
                        for path in paths:
                            entry_id = path["node_ids"][0] if path["node_ids"] else None
                            obj_id = path["node_ids"][-1] if path["node_ids"] else None

                            await conn.execute(
                                """
                                INSERT INTO attack_paths
                                    (id, engagement_id, entry_entity_id, objective_entity_id,
                                     title, confidence, feasibility, impact, priority,
                                     state, reasoning_trace, created_at)
                                VALUES
                                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'candidate', $10, NOW())
                                ON CONFLICT (id) DO NOTHING
                                """,
                                str(uuid.uuid4()),
                                engagement_id,
                                entry_id,
                                obj_id,
                                f"Path: {' -> '.join(path['node_names'])}",
                                str(path["path_confidence"]),
                                str(path["path_confidence"] * 0.8),
                                "0.7",
                                str(path["path_confidence"] * 0.7),
                                json.dumps({
                                    "node_names": path["node_names"],
                                    "node_types": path["node_types"],
                                    "node_ids": path["node_ids"],
                                    "depth": path["depth"],
                                }),
                            )
                finally:
                    await pg_pool.close()

                # Publish drift event to Redis
                if self.redis_client:
                    await self.redis_client.publish(
                        "drift.detected",
                        json.dumps({
                            "engagement_id": engagement_id,
                            "path_count": len(paths),
                            "timestamp": str(uuid.uuid1()),
                        })
                    )

        except Exception as e:
            logger.error(f"Attack path generation failed: {e}", exc_info=True)

engine = IntelligenceEngine()

class AnalysisRequest(BaseModel):
    run_id: str
    profile: str = "full_offensive"

@app.post("/analyze/{engagement_id}")
async def analyze_engagement(
    engagement_id: str,
    request: AnalysisRequest,
    tasks: BackgroundTasks,
    x_lattice9_key: Optional[str] = Header(None)
):
    if x_lattice9_key != LATTICE9_ENGINE_KEY:
        logger.warning(f"Unauthorized analysis attempt for {engagement_id}")
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid LATTICE9_ENGINE_KEY")

    logger.info(f"Received analysis request for {engagement_id} (Run: {request.run_id})")

    tasks.add_task(engine.correlate_entities, engagement_id)
    tasks.add_task(engine.generate_attack_paths, engagement_id)

    return {
        "status": "analysis_queued",
        "engagement_id": engagement_id,
        "run_id": request.run_id
    }

@app.get("/health")
async def health():
    return {
        "status": "operational",
        "engine": "Lattice9-OS-V5",
        "schema_version": "5.0.0"
    }

@app.on_event("shutdown")
async def shutdown():
    await engine.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
