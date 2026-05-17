"""
Lattice9 Graph Intelligence Engine — FastAPI Application

Endpoints:
  POST /analyze/{engagement_id}    — Full intelligence pipeline
  GET  /health                     — Health check
  POST /events/{engagement_id}     — Event-driven re-analysis
  GET  /snapshots/{engagement_id}  — Temporal snapshots
  GET  /algorithms/{engagement_id} — Graph algorithm results
"""

import asyncio
import json
import logging
import uuid
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, BackgroundTasks, Query
from neo4j import AsyncGraphDatabase
import redis.asyncio as aioredis

from config import (
    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD,
    REDIS_URL, LATTICE9_ENGINE_KEY, ENGINE_VERSION, logger,
)
from db import get_pg_pool, close_pg_pool
from models import AnalysisRequest
from graph.schema import ensure_constraints
from graph.engine import (
    merge_entity_node, merge_finding_node, merge_evidence_node,
    link_finding_to_entity, create_relationship, delete_engagement_graph,
    get_graph_summary,
)
from graph.algorithms import (
    shortest_attack_paths, bfs_traversal, influence_propagation_fallback,
    blast_radius_analysis, centrality_analysis, privilege_chain_synthesis,
    exposure_diffusion,
)
from graph.temporal import (
    create_snapshot, compute_temporal_diff, record_diffs,
    get_exposure_evolution, detect_infrastructure_mutations,
)
from graph.confidence import (
    propagate_confidence_to_graph, recalculate_finding_confidence,
    temporal_decay, bayesian_update,
)
from reasoning.attack_paths import generate_attack_paths
from reasoning.exploit_chains import synthesize_exploit_chains, compute_exploit_feasibility
from reasoning.prioritization import prioritize_findings, prioritize_attack_paths
from evidence.lineage import (
    create_evidence_chain, get_evidence_provenance,
    get_finding_evidence_chain, get_engagement_evidence_lineage,
)


class IntelligenceEngine:
    """Orchestrates all graph intelligence operations."""

    def __init__(self):
        self.driver = None
        self.redis = None
        self._init_driver()
        self._init_redis()

    def _init_driver(self):
        if all([NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD]):
            try:
                self.driver = AsyncGraphDatabase.driver(
                    NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD),
                    max_connection_pool_size=10,
                    connection_acquisition_timeout=30,
                )
                logger.info("Neo4j driver initialized (pool: 10)")
            except Exception as e:
                logger.error(f"Neo4j init failed: {e}")

    def _init_redis(self):
        if REDIS_URL:
            try:
                self.redis = aioredis.from_url(REDIS_URL, max_connections=10)
                logger.info("Redis client initialized")
            except Exception as e:
                logger.error(f"Redis init failed: {e}")

    async def close(self):
        if self.driver:
            await self.driver.close()
        if self.redis:
            await self.redis.close()
        await close_pg_pool()

    async def run_full_analysis(self, engagement_id: str, run_id: str = None):
        """
        Full intelligence pipeline:
        1. Schema constraints
        2. Entity/evidence correlation → Neo4j
        3. Relationship inference
        4. Confidence propagation
        5. Attack path generation
        6. Temporal snapshot
        7. Prioritization
        8. Drift detection + Redis publish
        """
        logger.info(f"=== Full analysis pipeline start: {engagement_id} (run={run_id}) ===")

        if not self.driver:
            logger.error("Neo4j unavailable, aborting")
            return

        await ensure_constraints(self.driver)
        pg_pool = await get_pg_pool()
        if not pg_pool:
            logger.error("PostgreSQL unavailable, aborting")
            return

        try:
            # Step 1-3: Correlate entities and infer relationships
            await self._correlate_all(engagement_id, pg_pool)

            # Step 4: Propagate confidence through the graph
            await propagate_confidence_to_graph(self.driver, engagement_id)

            # Step 5: Generate attack paths
            paths = await generate_attack_paths(self.driver, pg_pool, engagement_id)

            # Step 6: Capture temporal snapshot
            try:
                snapshot_id = await create_snapshot(self.driver, pg_pool, engagement_id)
                logger.info(f"Snapshot captured: {snapshot_id}")
            except Exception as e:
                logger.warning(f"Snapshot capture failed (non-fatal): {e}")
                snapshot_id = None

            # Step 7: Prioritize findings
            try:
                prioritized = await prioritize_findings(self.driver, pg_pool, engagement_id)
                logger.info(f"Prioritized {len(prioritized)} findings")
            except Exception as e:
                logger.warning(f"Prioritization failed (non-fatal): {e}")

            # Step 8: Drift detection + Redis notification
            if self.redis:
                await self.redis.publish(
                    "drift.detected",
                    json.dumps({
                        "engagement_id": engagement_id,
                        "run_id": run_id,
                        "path_count": len(paths),
                        "snapshot_id": snapshot_id,
                        "timestamp": str(uuid.uuid1()),
                    })
                )

            summary = await get_graph_summary(self.driver, engagement_id)
            logger.info(f"=== Analysis complete: {engagement_id} === {summary}")

        except Exception as e:
            logger.error(f"Analysis pipeline failed: {e}", exc_info=True)
        finally:
            await pg_pool.close()

    async def _correlate_all(self, engagement_id: str, pg_pool):
        """Fetch all data from PostgreSQL and merge into Neo4j graph."""
        async with pg_pool.acquire() as conn:
            # Fetch entities
            entity_rows = await conn.fetch(
                """SELECT id, entity_type, canonical_key, display_name,
                          confidence::text, first_seen_at, last_seen_at,
                          valid_from, valid_to, attributes::text
                   FROM entities WHERE engagement_id = $1""",
                engagement_id,
            )

            # Fetch findings
            finding_rows = await conn.fetch(
                """SELECT f.id, f.title, f.severity, f.confidence::text,
                          f.validation_state, f.cwe, f.affected_entity_id,
                          f.first_seen_at, f.last_seen_at,
                          COALESCE(e.display_name, 'unknown') AS entity_name,
                          COALESCE(e.canonical_key, 'unknown') AS entity_key
                   FROM findings f
                   LEFT JOIN entities e ON f.affected_entity_id = e.id
                   WHERE f.engagement_id = $1""",
                engagement_id,
            )

            # Fetch evidence
            evidence_rows = await conn.fetch(
                """SELECT id, source_type, artifact_uri, sha256,
                          captured_at, metadata::text
                   FROM evidence_items WHERE engagement_id = $1""",
                engagement_id,
            )

        logger.info(
            f"Fetched {len(entity_rows)} entities, {len(finding_rows)} findings, "
            f"{len(evidence_rows)} evidence items"
        )

        if not entity_rows and not finding_rows:
            logger.info(f"No data for engagement {engagement_id}")
            return

        async with self.driver.session(database="neo4j") as session:
            # Merge entities
            for row in entity_rows:
                await merge_entity_node(session, dict(row), engagement_id)

            # Merge findings + link to affected entities
            for f in finding_rows:
                await merge_finding_node(session, dict(f), engagement_id)
                if f["affected_entity_id"]:
                    await link_finding_to_entity(
                        session,
                        str(f["id"]),
                        str(f["affected_entity_id"]),
                        float(f["confidence"]) if f["confidence"] else 0.5,
                        f["last_seen_at"],
                    )

            # Merge evidence
            for ev in evidence_rows:
                await merge_evidence_node(session, dict(ev), engagement_id)

            # Infer typed relationships
            await self._infer_relationships(session, entity_rows, engagement_id)

    async def _infer_relationships(self, session, entity_rows, engagement_id):
        """Infer typed relationships between entities."""
        by_type = {}
        for row in entity_rows:
            et = row["entity_type"]
            by_type.setdefault(et, []).append(row)

        # RESOLVES_TO: FQDN hosts → IP hosts
        hosts = by_type.get("host", [])
        for host in hosts:
            ck = host["canonical_key"]
            if not ck.replace(".", "").isdigit():
                for other in hosts:
                    ock = other["canonical_key"]
                    if ock.replace(".", "").isdigit():
                        await create_relationship(
                            session, str(host["id"]), str(other["id"]),
                            "RESOLVES_TO", 0.7,
                            {"inference_rule": "dns_resolution"},
                        )

        # HOSTS: services → hosts
        services = by_type.get("service", [])
        for svc in services:
            svc_key = svc["canonical_key"]
            for host in hosts:
                host_key = host["canonical_key"]
                if host_key in svc_key or svc_key.endswith(host_key):
                    await create_relationship(
                        session, str(host["id"]), str(svc["id"]),
                        "HOSTS", 0.8,
                        {"inference_rule": "key_containment"},
                    )

        # AUTHENTICATES_TO: credentials → services (by naming patterns)
        creds = by_type.get("credential", [])
        for cred in creds:
            cred_key = cred["canonical_key"].lower()
            for svc in services:
                svc_key = svc["canonical_key"].lower()
                if any(part in cred_key for part in svc_key.split(".")):
                    await create_relationship(
                        session, str(cred["id"]), str(svc["id"]),
                        "AUTHENTICATES_TO", 0.6,
                        {"inference_rule": "key_pattern_match"},
                    )

        logger.info(f"Inferred relationships for engagement {engagement_id}")


# Module-level singleton
engine = IntelligenceEngine()


# === FastAPI Application ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Lattice9 Engine v{ENGINE_VERSION} starting")
    yield
    logger.info("Engine shutting down")
    await engine.close()


app = FastAPI(
    title="Lattice9 Graph Intelligence Engine",
    version=ENGINE_VERSION,
    lifespan=lifespan,
)


def verify_engine_key(x_lattice9_key: Optional[str] = Header(None)):
    if x_lattice9_key != LATTICE9_ENGINE_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# === API Endpoints ===

@app.post("/analyze/{engagement_id}")
async def analyze_engagement(
    engagement_id: str,
    request: AnalysisRequest,
    tasks: BackgroundTasks,
    x_lattice9_key: Optional[str] = Header(None),
):
    verify_engine_key(x_lattice9_key)
    logger.info(f"Analysis request: {engagement_id} (run={request.run_id})")
    tasks.add_task(engine.run_full_analysis, engagement_id, request.run_id)
    return {"status": "analysis_queued", "engagement_id": engagement_id, "run_id": request.run_id}


@app.post("/events/{engagement_id}")
async def event_driven_analysis(
    engagement_id: str,
    event_type: str = Query(..., description="Event type: evidence_added, finding_updated"),
    entity_id: str = Query(None, description="Affected entity ID"),
    tasks: BackgroundTasks = BackgroundTasks(),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Event-driven re-analysis for specific graph operations."""
    verify_engine_key(x_lattice9_key)

    if event_type == "evidence_added":
        tasks.add_task(engine.run_full_analysis, engagement_id, f"event_{event_type}")
    elif event_type == "finding_updated" and entity_id:
        pg_pool = await get_pg_pool()
        if pg_pool:
            await recalculate_finding_confidence(engine.driver, pg_pool, entity_id)
            await pg_pool.close()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown event: {event_type}")

    return {"status": "event_queued", "event_type": event_type}


@app.get("/snapshots/{engagement_id}")
async def list_snapshots(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        evolution = await get_exposure_evolution(engine.driver, pg_pool, engagement_id)
        return evolution
    finally:
        await pg_pool.close()


@app.get("/snapshots/{engagement_id}/drift")
async def get_drift_analysis(
    engagement_id: str,
    from_snapshot_id: str = Query(..., description="Source Snapshot UUID"),
    to_snapshot_id: str = Query(..., description="Target Snapshot UUID"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Compute structural graph drift and topology mutations between two snapshots."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        diff_data = await compute_temporal_diff(
            engine.driver, pg_pool, engagement_id, from_snapshot_id, to_snapshot_id
        )
        mutations = await detect_infrastructure_mutations(engine.driver, pg_pool, engagement_id)
        return {"diff": diff_data, "mutations": mutations}
    except Exception as e:
        logger.error(f"Error computing snapshot drift: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/snapshots/{engagement_id}/replay/{path_id}")
async def replay_attack_path(
    engagement_id: str,
    path_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Perform a step-by-step playback simulation of an attack path with dynamic prerequisite audits."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        async with pg_pool.acquire() as conn:
            path_row = await conn.fetchrow(
                "SELECT * FROM attack_paths WHERE id = $1 AND engagement_id = $2",
                path_id, engagement_id
            )
            if not path_row:
                raise HTTPException(status_code=404, detail="Attack path not found")
            
            trace = json.loads(path_row["reasoning_trace"])
            step_validations = trace.get("step_validations", [])
            total_economic_cost = trace.get("total_economic_cost", 0.0)
            total_detection_risk = trace.get("total_detection_risk", 0.0)
            
            return {
                "path_id": path_id,
                "title": path_row["title"],
                "confidence": float(path_row["confidence"]),
                "feasibility": float(path_row["feasibility"]),
                "attacker_roi": float(path_row.get("attacker_roi") or 0.0),
                "steps_timeline": step_validations,
                "aggregated_cost": total_economic_cost,
                "aggregated_detection_risk": total_detection_risk,
                "status": "simulation_ready"
            }
    except Exception as e:
        logger.error(f"Error replaying attack path {path_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/algorithms/{engagement_id}")
async def get_algorithm_results(
    engagement_id: str,
    algorithm: str = Query("centrality", description="Algorithm: centrality, influence, blast, privilege, exposure"),
    node_id: str = Query(None, description="Node ID for blast radius analysis"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Run and return graph algorithm results."""
    verify_engine_key(x_lattice9_key)

    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    if algorithm == "centrality":
        result = await centrality_analysis(engine.driver, engagement_id)
    elif algorithm == "influence":
        result = await influence_propagation_fallback(engine.driver, engagement_id)
    elif algorithm == "blast" and node_id:
        result = await blast_radius_analysis(engine.driver, engagement_id, node_id)
    elif algorithm == "privilege":
        result = await privilege_chain_synthesis(engine.driver, engagement_id)
    elif algorithm == "exposure":
        result = await exposure_diffusion(engine.driver, engagement_id)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown algorithm or missing node_id")

    return {"engagement_id": engagement_id, "algorithm": algorithm, "result": result}


@app.get("/algorithms/{engagement_id}/paths")
async def get_attack_paths(
    engagement_id: str,
    max_depth: int = Query(6, description="Max path depth"),
    x_lattice9_key: Optional[str] = Header(None),
):
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    paths = await shortest_attack_paths(engine.driver, engagement_id, max_depth=max_depth)
    return {"engagement_id": engagement_id, "paths": paths, "total": len(paths)}


@app.get("/algorithms/{engagement_id}/exploit-chains")
async def get_exploit_chains(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    chains = await synthesize_exploit_chains(engine.driver, engagement_id)
    return {"engagement_id": engagement_id, "exploit_chains": chains, "total": len(chains)}


@app.get("/evidence/{engagement_id}/lineage")
async def get_lineage(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        lineage = await get_engagement_evidence_lineage(pg_pool, engagement_id)
        return lineage
    finally:
        await pg_pool.close()


@app.get("/evidence/{evidence_id}/provenance")
async def get_provenance(evidence_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        provenance = await get_evidence_provenance(pg_pool, evidence_id)
        return provenance
    finally:
        await pg_pool.close()


@app.get("/evidence/{finding_id}/pedigree")
async def get_evidence_pedigree(finding_id: str, x_lattice9_key: Optional[str] = Header(None)):
    """Retrieve derived pedigree recursion lineage representing ancestor nodes leading to the confidence state."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        # Retrieve supporting and contradicting ancestors recursively
        chain_data = await get_finding_evidence_chain(pg_pool, finding_id)
        
        # Traverse for each supporting evidence's pedigree trace
        detailed_pedigrees = []
        for evidence in chain_data.get("supporting_evidence", []):
            prov = await get_evidence_provenance(pg_pool, evidence["id"])
            if "pedigree_ancestry" in prov:
                detailed_pedigrees.extend(prov["pedigree_ancestry"])
                
        return {
            "finding_id": finding_id,
            "evidence_chain": chain_data,
            "pedigree_genealogy": detailed_pedigrees,
            "net_genealogy_count": len(detailed_pedigrees)
        }
    except Exception as e:
        logger.error(f"Error fetching pedigree genealogy for {finding_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/health")
async def health():
    status = "operational"
    if engine.driver:
        try:
            async with engine.driver.session(database="neo4j") as session:
                await session.run("RETURN 1")
        except Exception:
            status = "degraded"

    return {
        "status": status,
        "engine": f"Lattice9-OS-{ENGINE_VERSION}",
        "schema_version": ENGINE_VERSION,
        "neo4j": engine.driver is not None,
        "redis": engine.redis is not None,
    }
