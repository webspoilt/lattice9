"""
Temporal Intelligence — Graph state versioning, diff computation, drift detection.

Systems:
- Infrastructure snapshots (point-in-time graph state)
- Temporal diffing (compute delta between snapshots)
- Drift scoring (quantify exposure evolution)
- Exposure evolution analysis
- Infrastructure mutation tracking
"""

import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("lattice9-graph-engine")


async def create_snapshot(driver, pg_pool, engagement_id: str,
                           snapshot_type: str = "auto") -> str:
    """
    Capture a point-in-time snapshot of the graph state.
    Records entity/relationship state and stores metadata.
    """
    snapshot_id = str(uuid.uuid4())
    graph_version = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    captured_at = datetime.utcnow()

    # Count current graph state
    async with driver.session(database="neo4j") as session:
        entity_result = await session.run(
            "MATCH (n:L9 {engagement_id: $engagement_id}) RETURN count(n) AS count",
            engagement_id=engagement_id,
        )
        rel_result = await session.run(
            """
            MATCH ()-[r]->() WHERE EXISTS(r.confidence)
            RETURN count(r) AS count
            """,
        )
        entity_count = (await entity_result.single())["count"]
        rel_count = (await rel_result.single())["count"]

        # Get all node states for diffing
        nodes_result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            RETURN n.id AS node_id,
                   n.display_name AS display_name,
                   n.entity_type AS entity_type,
                   n.confidence AS confidence
            """,
        )
        node_states = []
        async for record in nodes_result:
            node_states.append({
                "id": record["node_id"],
                "name": record["display_name"],
                "type": record["entity_type"],
                "confidence": record["confidence"],
            })

        # Get all relationship states for full topology replay
        rels_detail_result = await session.run(
            """
            MATCH (src:L9 {engagement_id: $engagement_id})-[r]->(dst:L9 {engagement_id: $engagement_id})
            RETURN src.id AS src_id, dst.id AS dst_id, type(r) AS rel_type, coalesce(toFloat(r.weight), 0.5) AS weight
            """,
            engagement_id=engagement_id,
        )
        rel_states = []
        async for record in rels_detail_result:
            rel_states.append({
                "src_id": record["src_id"],
                "dst_id": record["dst_id"],
                "type": record["rel_type"],
                "weight": record["weight"]
            })

    # Record snapshot in PostgreSQL
    async with pg_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO graph_snapshots
                (id, engagement_id, graph_version, snapshot_type, captured_at,
                 entity_count, relationship_count, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            snapshot_id, engagement_id, graph_version, snapshot_type,
            captured_at, int(entity_count), int(rel_count),
            json.dumps({"nodes": node_states, "relationships": rel_states}),
        )

    logger.info(f"Snapshot {snapshot_id} captured: {entity_count} entities, {rel_count} relationships")
    return snapshot_id


async def compute_temporal_diff(driver, pg_pool, engagement_id: str,
                                 from_snapshot_id: str,
                                 to_snapshot_id: str) -> dict:
    """
    Compute the temporal diff between two graph snapshots.
    Returns added/modified/removed nodes and relationships, and overall drift score.
    """
    async with pg_pool.acquire() as conn:
        from_row = await conn.fetchrow(
            "SELECT metadata, captured_at FROM graph_snapshots WHERE id = $1",
            from_snapshot_id,
        )
        to_row = await conn.fetchrow(
            "SELECT metadata, captured_at FROM graph_snapshots WHERE id = $1",
            to_snapshot_id,
        )

        if not from_row or not to_row:
            raise ValueError("Snapshot not found")

        metadata_from = json.loads(from_row["metadata"])
        metadata_to = json.loads(to_row["metadata"])

        from_nodes = metadata_from.get("nodes", [])
        to_nodes = metadata_to.get("nodes", [])
        from_ids = {n["id"] for n in from_nodes}
        to_ids = {n["id"] for n in to_nodes}

        from_rels = metadata_from.get("relationships", [])
        to_rels = metadata_to.get("relationships", [])

    # 1. Compute node diffs
    added = [n for n in to_nodes if n["id"] not in from_ids]
    removed = [n for n in from_nodes if n["id"] not in to_ids]
    from_map = {n["id"]: n for n in from_nodes}
    to_map = {n["id"]: n for n in to_nodes}

    modified = []
    for nid in from_ids & to_ids:
        fn = from_map[nid]
        tn = to_map[nid]
        if abs(float(fn.get("confidence", 0)) - float(tn.get("confidence", 0))) > 0.05:
            modified.append({
                "id": nid,
                "from_name": fn.get("name"),
                "to_name": tn.get("name"),
                "from_confidence": fn.get("confidence"),
                "to_confidence": tn.get("confidence"),
                "type": tn.get("type"),
            })

    # 2. Compute relationship diffs (Topology shifts)
    from_rels_map = {(r["src_id"], r["dst_id"], r["type"]): r["weight"] for r in from_rels}
    to_rels_map = {(r["src_id"], r["dst_id"], r["type"]): r["weight"] for r in to_rels}

    added_rels = []
    removed_rels = []
    modified_rels = []

    for r_key, weight in to_rels_map.items():
        if r_key not in from_rels_map:
            added_rels.append({
                "src_id": r_key[0],
                "dst_id": r_key[1],
                "type": r_key[2],
                "weight": weight
            })
        elif abs(float(weight) - float(from_rels_map[r_key])) > 0.05:
            modified_rels.append({
                "src_id": r_key[0],
                "dst_id": r_key[1],
                "type": r_key[2],
                "from_weight": from_rels_map[r_key],
                "to_weight": weight
            })

    for r_key in from_rels_map:
        if r_key not in to_rels_map:
            removed_rels.append({
                "src_id": r_key[0],
                "dst_id": r_key[1],
                "type": r_key[2],
                "weight": from_rels_map[r_key]
            })

    # Compute drift score: weighted combination of changes
    added_score = len(added) * 0.3
    removed_score = len(removed) * 0.2
    modified_score = len(modified) * 0.2
    added_rel_score = len(added_rels) * 0.4
    removed_rel_score = len(removed_rels) * 0.2
    modified_rel_score = len(modified_rels) * 0.2

    drift_score = min(1.0, added_score + removed_score + modified_score + added_rel_score + removed_rel_score + modified_rel_score)

    return {
        "from_snapshot": from_snapshot_id,
        "to_snapshot": to_snapshot_id,
        "added": added,
        "removed": removed,
        "modified": modified,
        "added_relationships": added_rels,
        "removed_relationships": removed_rels,
        "modified_relationships": modified_rels,
        "drift_score": round(drift_score, 4),
        "from_time": from_row["captured_at"].isoformat(),
        "to_time": to_row["captured_at"].isoformat(),
    }


async def record_diffs(driver, pg_pool, engagement_id: str, diffs: List[Dict]):
    """
    Persist temporal diffs to PostgreSQL for historical tracking.
    """
    async with pg_pool.acquire() as conn:
        for diff in diffs:
            await conn.execute(
                """
                INSERT INTO temporal_diffs
                    (id, engagement_id, from_snapshot_id, to_snapshot_id,
                     diff_type, affected_entity_id, drift_score, explanation, evidence_ids)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                str(uuid.uuid4()),
                engagement_id,
                diff.get("from_snapshot_id"),
                diff.get("to_snapshot_id"),
                diff.get("diff_type", "graph_change"),
                diff.get("entity_id"),
                str(diff.get("drift_score", 0)),
                diff.get("explanation", ""),
                diff.get("evidence_ids", []),
            )


async def get_exposure_evolution(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Analyze how the attack surface has evolved over time.
    Returns timeline of exposure changes.
    """
    async with driver.session(database="neo4j") as session:
        # Current exposure level
        result = await session.run(
            """
            MATCH (f:L9:Finding {engagement_id: $engagement_id})
            WHERE f.severity IN ['critical', 'high']
            RETURN f.severity AS severity, count(f) AS count
            """,
            engagement_id=engagement_id,
        )
        current_exposure = {}
        async for record in result:
            current_exposure[record["severity"]] = record["count"]

    # Historical exposure from snapshots
    async with pg_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, graph_version, captured_at, entity_count, relationship_count, metadata
            FROM graph_snapshots
            WHERE engagement_id = $1
            ORDER BY captured_at ASC
            """,
            engagement_id,
        )

        timeline = []
        for row in rows:
            timeline.append({
                "snapshot_id": row["id"],
                "version": row["graph_version"],
                "captured_at": row["captured_at"].isoformat(),
                "entity_count": row["entity_count"],
                "relationship_count": row["relationship_count"],
            })

        return {
            "current": current_exposure,
            "timeline": timeline,
            "total_snapshots": len(timeline),
        }


async def detect_infrastructure_mutations(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Detect significant infrastructure changes between the two most recent snapshots.
    Identifies new trust relationships, credential spreading, and blast radius mutations.
    """
    async with pg_pool.acquire() as conn:
        snapshots = await conn.fetch(
            """
            SELECT id FROM graph_snapshots
            WHERE engagement_id = $1
            ORDER BY captured_at DESC
            LIMIT 2
            """,
            engagement_id,
        )

    if len(snapshots) < 2:
        return []

    diff = await compute_temporal_diff(
        driver, pg_pool, engagement_id,
        str(snapshots[1]["id"]),
        str(snapshots[0]["id"]),
    )

    mutations = []

    # Get a map of node IDs to names/types from the 'to' snapshot for description enrichment
    to_nodes = diff.get("added", []) + diff.get("modified", [])
    node_map = {n["id"]: n for n in to_nodes}

    # 1. New findings appearing
    for added in diff.get("added", []):
        if added.get("type") == "finding":
            mutations.append({
                "type": "new_finding",
                "entity_id": added["id"],
                "label": added.get("name", "Unknown"),
                "drift_contribution": 0.3,
                "description": f"New finding detected: {added.get('name', 'Unknown')}",
            })

    # 2. Confidence changes on existing nodes
    for modified in diff.get("modified", []):
        mutations.append({
            "type": "confidence_shift",
            "entity_id": modified["id"],
            "label": modified.get("from_name", "Unknown"),
            "drift_contribution": round(
                abs(float(modified.get("to_confidence", 0)) - float(modified.get("from_confidence", 0))), 4
            ),
            "description": (
                f"Confidence shift on {modified.get('from_name')}: {modified.get('from_confidence')} → {modified.get('to_confidence')}"
            ),
        })

    # 3. Trust mutations and credential spreads from added relationships
    for added_rel in diff.get("added_relationships", []):
        src_id = added_rel["src_id"]
        dst_id = added_rel["dst_id"]
        rel_type = added_rel["type"]

        if rel_type == "TRUSTS":
            mutations.append({
                "type": "trust_mutation",
                "entity_id": src_id,
                "drift_contribution": 0.5,
                "description": f"New trust relationship established: {src_id} trusts {dst_id}",
            })
        elif rel_type == "AUTHENTICATES_TO":
            mutations.append({
                "type": "credential_spread",
                "entity_id": src_id,
                "drift_contribution": 0.4,
                "description": f"Credential {src_id} spread detected: newly authenticates to target {dst_id}",
            })
        elif rel_type == "PRIVILEGE_ESCALATION":
            mutations.append({
                "type": "blast_radius_expansion",
                "entity_id": src_id,
                "drift_contribution": 0.6,
                "description": f"Blast radius expansion: new privilege escalation path from {src_id} to {dst_id}",
            })

    return mutations

