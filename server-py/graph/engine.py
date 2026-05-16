"""
Graph Engine — Core node/edge operations against Neo4j.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from graph.schema import get_labels, RELATIONSHIP_TYPES

logger = logging.getLogger("lattice9-graph-engine")


async def merge_entity_node(session, row: dict, engagement_id: str):
    """Merge a PostgreSQL entity row into Neo4j as a typed node."""
    labels = get_labels(row["entity_type"])
    label_str = ":".join(labels)
    attrs = json.loads(row["attributes"]) if row.get("attributes") else {}

    cypher = f"""
    MERGE (n:{label_str} {{
        engagement_id: $engagement_id,
        entity_type: $entity_type,
        canonical_key: $canonical_key
    }})
    SET n.id = $id,
        n.display_name = $display_name,
        n.confidence = $confidence,
        n.first_seen_at = $first_seen_at,
        n.last_seen_at = $last_seen_at,
        n.valid_from = $valid_from,
        n.valid_to = $valid_to,
        n.attributes = $attributes
    """
    await session.run(
        cypher,
        engagement_id=engagement_id,
        entity_type=row["entity_type"],
        canonical_key=row["canonical_key"],
        id=str(row["id"]),
        display_name=row["display_name"],
        confidence=float(row["confidence"]),
        first_seen_at=_iso(row["first_seen_at"]),
        last_seen_at=_iso(row["last_seen_at"]),
        valid_from=_iso(row["valid_from"]),
        valid_to=_iso(row["valid_to"]) if row.get("valid_to") else None,
        attributes=json.dumps(attrs),
    )


async def merge_finding_node(session, f: dict, engagement_id: str):
    """Merge a finding as a typed L9:Finding node."""
    cypher = """
    MERGE (n:L9:Finding {
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
    """
    await session.run(
        cypher,
        engagement_id=engagement_id,
        id=str(f["id"]),
        title=f["title"] or "",
        severity=f["severity"] or "info",
        confidence=float(f["confidence"]) if f.get("confidence") else 0.5,
        validation_state=f["validation_state"] or "unvalidated",
        cwe=f.get("cwe") or "",
        first_seen_at=_iso(f["first_seen_at"]),
        last_seen_at=_iso(f["last_seen_at"]),
    )


async def link_finding_to_entity(session, finding_id: str, entity_id: str, confidence: float, last_seen):
    """Create HAS_FINDING edge from entity to finding."""
    await session.run(
        """
        MATCH (entity:L9 {id: $entity_id})
        MATCH (finding:L9:Finding {id: $finding_id})
        MERGE (entity)-[r:HAS_FINDING]->(finding)
        SET r.last_seen_at = $last_seen_at,
            r.confidence = $confidence,
            r.weight = $weight
        """,
        entity_id=entity_id,
        finding_id=finding_id,
        last_seen_at=_iso(last_seen),
        confidence=float(confidence),
        weight=float(confidence) * RELATIONSHIP_TYPES["HAS_FINDING"]["default_weight"],
    )


async def merge_evidence_node(session, ev: dict, engagement_id: str):
    """Merge evidence as typed L9:Evidence node."""
    cypher = """
    MERGE (n:L9:Evidence {
        engagement_id: $engagement_id,
        entity_type: 'evidence',
        canonical_key: $sha256
    })
    SET n.id = $id,
        n.display_name = $source_type,
        n.artifact_uri = $artifact_uri,
        n.captured_at = $captured_at
    """
    await session.run(
        cypher,
        engagement_id=engagement_id,
        sha256=ev["sha256"],
        id=str(ev["id"]),
        source_type=ev.get("source_type") or "unknown",
        artifact_uri=ev.get("artifact_uri") or "",
        captured_at=_iso(ev["captured_at"]),
    )


async def create_relationship(session, source_id: str, target_id: str,
                               rel_type: str, confidence: float, metadata: Optional[dict] = None):
    """Create or merge a typed relationship between two nodes."""
    now = "datetime()"
    weight = RELATIONSHIP_TYPES.get(rel_type, {}).get("default_weight", 0.5) * confidence
    cypher = f"""
    MATCH (a:L9 {{id: $source_id}})
    MATCH (b:L9 {{id: $target_id}})
    MERGE (a)-[r:{rel_type}]->(b)
    SET r.confidence = $confidence,
        r.weight = $weight,
        r.last_seen_at = {now}
    """
    params = {
        "source_id": source_id,
        "target_id": target_id,
        "confidence": float(confidence),
        "weight": float(weight),
    }
    if metadata:
        cypher = cypher.replace("SET", "SET r.metadata = $metadata,")
        params["metadata"] = json.dumps(metadata)
    await session.run(cypher, **params)


async def bulk_create_relationships(session, edges: List[Dict]):
    """Batch create relationships from edge descriptors."""
    for edge in edges:
        await create_relationship(
            session,
            source_id=edge["source_id"],
            target_id=edge["target_id"],
            rel_type=edge["type"],
            confidence=edge.get("confidence", 0.5),
            metadata=edge.get("metadata"),
        )


async def delete_engagement_graph(driver, engagement_id: str):
    """Delete all graph data for an engagement."""
    async with driver.session(database="neo4j") as session:
        await session.run(
            "MATCH (n:L9 {engagement_id: $engagement_id}) DETACH DELETE n",
            engagement_id=engagement_id,
        )


async def get_graph_summary(driver, engagement_id: str) -> dict:
    """Get node/edge counts for an engagement."""
    async with driver.session(database="neo4j") as session:
        node_count = await session.run(
            "MATCH (n:L9 {engagement_id: $engagement_id}) RETURN count(n) AS count",
            engagement_id=engagement_id,
        )
        edge_count = await session.run(
            "MATCH ()-[r]->() WHERE r.confidence IS NOT NULL RETURN count(r) AS count",
        )
        node_result = await node_count.single()
        edge_result = await edge_count.single()
        return {
            "nodes": node_result["count"] if node_result else 0,
            "edges": edge_result["count"] if edge_result else 0,
        }


def _iso(val) -> str:
    """Convert timestamp to ISO string."""
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)
