"""
Topological Resistance Theory — infrastructure as conductive vs resistive topology.

Models the attack surface as an electrical circuit where:
  - Each edge has traversal resistance (cost to cross)
  - Trust relationships are conductive pathways (low resistance)
  - EDR/defense systems produce detection friction (high resistance)
  - Segmentation creates resistive barriers
  - Privilege relationships have high permeability

Edge Resistance Model:
    R(e) = DetectionFriction(e) / TraversalProbability(e)

    R(e):  resistance of edge e
    DetectionFriction(e): expected detection cost (0=stealthy, 1=very noisy)
    TraversalProbability(e): likelihood of successful traversal

Path Resistance:
    R(path) = Σ R(e) for all edges in path

Low-resistance paths = stealth-optimal attack flow
High-resistance paths = high-risk, high-detectability

Applications:
  - Resistance-aware shortest path (stealth-weighted Dijkstra)
  - Low-resistance attack flow identification
  - Segmentation conductivity analysis
  - EDR suppression effect modeling
  - Operational resistance estimation for mission planning
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("lattice9-graph-engine")

# Base resistance values for relationship types
# Lower = easier to traverse stealthily
BASE_RESISTANCE = {
    "TRUSTS": 0.1,                # Trust relationships are low resistance
    "MEMBER_OF": 0.1,             # Group membership is low resistance
    "AUTHENTICATES_TO": 0.2,      # Authentication is relatively low resistance
    "PRIVILEGE_ESCALATION": 0.15, # Privilege escalation is low-medium
    "HAS_FINDING": 0.6,           # Findings represent known issues
    "NETWORK_REACH": 0.3,         # Network reach is medium-low
    "HOSTS": 0.4,                 # Hosting is medium
    "RESOLVES_TO": 0.5,           # DNS resolution is medium
    "DEPENDS_ON": 0.35,           # Dependencies are medium-low
    "DATA_FLOW": 0.45,            # Data flow is medium
    "EXPLOITS": 0.25,             # Exploit relationships are low-medium
    "OWNS": 0.05,                 # Ownership is very low resistance
}

# Detection friction by infrastructure type (EDR, logging, monitoring)
# Higher = more likely to be detected
DETECTION_FRICTION = {
    "host": {"windows": 0.7, "linux": 0.5, "unknown": 0.6},
    "service": {"http": 0.4, "smb": 0.6, "ssh": 0.3,
                "rdp": 0.5, "database": 0.5, "unknown": 0.4},
    "endpoint": {"workstation": 0.7, "server": 0.5, "unknown": 0.6},
    "network": {"internal": 0.3, "dmz": 0.5, "external": 0.2, "unknown": 0.4},
}

# Privilege permeability — how much privilege bleeds through this edge
PRIVILEGE_PERMEABILITY = {
    "TRUSTS": 0.6,
    "MEMBER_OF": 0.8,
    "AUTHENTICATES_TO": 0.5,
    "PRIVILEGE_ESCALATION": 0.9,
    "OWNS": 1.0,
    "HOSTS": 0.4,
    "DEPENDS_ON": 0.3,
    "NETWORK_REACH": 0.2,
    "DATA_FLOW": 0.35,
    "RESOLVES_TO": 0.1,
    "EXPLOITS": 0.7,
    "HAS_FINDING": 0.3,
}

# EDR suppression effect model
# How much does each EDR type reduce traversal probability?
EDR_SUPPRESSION = {
    "edr_endpoint": 0.6,      # Endpoint EDR reduces probability by 60%
    "edr_network": 0.4,       # Network monitoring reduces by 40%
    "edr_email": 0.3,         # Email security reduces by 30%
    "edr_identity": 0.5,      # Identity protection reduces by 50%
    "edr_cloud": 0.35,        # Cloud security reduces by 35%
    "siem": 0.55,             # SIEM correlation reduces by 55%
    "ngfw": 0.45,             # NGFW reduces by 45%
    "waf": 0.4,               # WAF reduces by 40%
    "casb": 0.3,              # CASB reduces by 30%
    "dlp": 0.25,              # DLP reduces by 25%
}


async def compute_edge_resistance(driver, engagement_id: str,
                                   source_id: str, target_id: str,
                                   rel_type: str) -> Dict:
    """
    Compute the full resistance profile of a single edge.

    R(e) = DetectionFriction(e) / TraversalProbability(e)

    Returns resistance value and all component factors.
    """
    # Base traversal probability
    base_resistance = BASE_RESISTANCE.get(rel_type, 0.5)

    # Detection friction based on source/target entity types
    friction = 0.5  # Default
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (a:L9 {id: $source_id}), (b:L9 {id: $target_id})
               RETURN a.entity_type AS source_type,
                      coalesce(a.attributes, '{}') AS source_attrs,
                      b.entity_type AS target_type,
                      coalesce(b.attributes, '{}') AS target_attrs
            """,
            source_id=source_id,
            target_id=target_id,
        )
        row = await result.single()
        if row:
            source_type = row["source_type"]
            target_type = row["target_type"]

            # Apply detection friction by entity type
            for et in (source_type, target_type):
                friction_by_et = DETECTION_FRICTION.get(et, {})
                friction = min(friction, friction_by_et.get("unknown", 0.5))

    # Apply EDR suppression if any EDR nodes exist in the graph
    edr_suppression = 1.0
    async with driver.session(database="neo4j") as session:
        edr_result = await session.run(
            """MATCH (e:L9 {engagement_id: $engagement_id})
               WHERE e.entity_type IN ['edr', 'defense', 'control']
               RETURN count(e) AS edr_count, collect(e.display_name) AS edr_names
            """,
            engagement_id=engagement_id,
        )
        edr_row = await edr_result.single()
        if edr_row:
            edr_count = edr_row["edr_count"] or 0
            if edr_count > 0:
                edr_suppression = max(0.1, 1.0 - (edr_count * 0.05))

    # Traversal probability = (1 - base_resistance) × EDR_suppression
    traversal_probability = (1.0 - base_resistance) * edr_suppression
    traversal_probability = max(0.01, min(0.99, traversal_probability))

    # Resistance = friction / probability
    resistance = friction / traversal_probability

    return {
        "edge": f"{source_id} → {target_id} [{rel_type}]",
        "base_resistance": round(base_resistance, 4),
        "detection_friction": round(friction, 4),
        "edr_suppression_factor": round(edr_suppression, 4),
        "traversal_probability": round(traversal_probability, 4),
        "resistance": round(resistance, 4),
        "conductivity": round(1.0 / resistance if resistance > 0 else float('inf'), 4),
        "privilege_permeability": PRIVILEGE_PERMEABILITY.get(rel_type, 0.3),
    }


async def compute_resistance_map(driver, engagement_id: str) -> Dict:
    """
    Compute resistance profile for all edges in the engagement graph.

    Produces a complete resistance map identifying:
    - Low-resistance corridors (stealth attack paths)
    - High-resistance barriers (segmentation, EDR)
    - Average network resistance
    - Resistance distribution
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source_id, a.display_name AS source_name,
                      a.entity_type AS source_type,
                      b.id AS target_id, b.display_name AS target_name,
                      b.entity_type AS target_type,
                      type(r) AS rel_type,
                      coalesce(toFloat(r.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )

        edges = []
        async for record in result:
            rel_type = record["rel_type"]
            source_type = record["source_type"]
            target_type = record["target_type"]

            base_resistance = BASE_RESISTANCE.get(rel_type, 0.5)

            friction = DETECTION_FRICTION.get(
                source_type, DETECTION_FRICTION.get(target_type, {"unknown": 0.5})
            ).get("unknown", 0.5)

            traversal_probability = (1.0 - base_resistance) * record["confidence"]
            traversal_probability = max(0.01, min(0.99, traversal_probability))

            resistance = friction / traversal_probability

            edges.append({
                "source": record["source_name"],
                "source_id": record["source_id"],
                "source_type": source_type,
                "target": record["target_name"],
                "target_id": record["target_id"],
                "target_type": target_type,
                "rel_type": rel_type,
                "resistance": round(resistance, 4),
                "conductivity": round(1.0 / resistance if resistance > 0 else 999.0, 4),
                "traversal_probability": round(traversal_probability, 4),
            })

    if not edges:
        return {"edges": [], "statistics": {}, "low_resistance_corridors": [], "high_resistance_barriers": []}

    resistances = [e["resistance"] for e in edges]
    mean_r = sum(resistances) / len(resistances)
    max_r = max(resistances)
    min_r = min(resistances)

    low_resistance_corridors = sorted(
        [e for e in edges if e["resistance"] <= mean_r * 0.5],
        key=lambda x: x["resistance"],
    )
    high_resistance_barriers = sorted(
        [e for e in edges if e["resistance"] >= mean_r * 1.5],
        key=lambda x: x["resistance"],
        reverse=True,
    )

    return {
        "edges": edges,
        "statistics": {
            "mean_resistance": round(mean_r, 4),
            "min_resistance": round(min_r, 4),
            "max_resistance": round(max_r, 4),
            "median_resistance": round(
                sorted(resistances)[len(resistances) // 2], 4
            ),
            "total_edges": len(edges),
        },
        "low_resistance_corridors": low_resistance_corridors[:20],
        "high_resistance_barriers": high_resistance_barriers[:20],
    }


async def resistance_weighted_paths(driver, engagement_id: str,
                                     source_id: str, target_id: str,
                                     max_paths: int = 5) -> List[Dict]:
    """
    Find lowest-resistance attack paths between two nodes.

    Uses Dijkstra with edge resistance as the cost function.
    Paths with lowest total resistance are stealth-optimal.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH path = (source:L9 {id: $source_id})-[:TRUSTS|AUTHENTICATES_TO|PRIVILEGE_ESCALATION|NETWORK_REACH|HOSTS|DEPENDS_ON|DATA_FLOW|EXPLOITS|HAS_FINDING|MEMBER_OF*1..6]->(target:L9 {id: $target_id})
               WHERE source.engagement_id = $engagement_id
                 AND target.engagement_id = $engagement_id
               RETURN path,
                      [n IN nodes(path) | n.id] AS node_ids,
                      [n IN nodes(path) | n.display_name] AS node_names,
                      [r IN relationships(path) | type(r)] AS rel_types,
                      length(path) AS path_length,
                      reduce(
                          cost = 0.0,
                          r IN relationships(path) |
                          cost + (coalesce(toFloat(r.confidence), 0.5) / 0.3)
                      ) AS raw_cost
               ORDER BY raw_cost ASC
               LIMIT $max_paths
            """,
            source_id=source_id,
            target_id=target_id,
            engagement_id=engagement_id,
            max_paths=max_paths,
        )

        paths = []
        async for record in result:
            node_ids = record["node_ids"]
            rel_types = record["rel_types"]

            # Compute resistance-weighted cost for this path
            total_resistance = 0.0
            step_details = []
            for i in range(len(rel_types)):
                rel = rel_types[i]
                base = BASE_RESISTANCE.get(rel, 0.5)
                friction = 0.5
                traversal_prob = (1.0 - base) * 0.7
                traversal_prob = max(0.01, min(0.99, traversal_prob))
                resistance = friction / traversal_prob
                total_resistance += resistance
                step_details.append({
                    "step": i,
                    "from": node_ids[i],
                    "to": node_ids[i + 1],
                    "rel_type": rel,
                    "step_resistance": round(resistance, 4),
                })

            paths.append({
                "node_ids": node_ids,
                "node_names": record["node_names"],
                "rel_types": rel_types,
                "path_length": record["path_length"],
                "total_resistance": round(total_resistance, 4),
                "stealth_score": round(1.0 / total_resistance if total_resistance > 0 else 0, 4),
                "steps": step_details,
            })

        return sorted(paths, key=lambda p: p["total_resistance"])


async def compute_segmentation_conductivity(driver, engagement_id: str) -> Dict:
    """
    Analyze segmentation effectiveness by measuring conductivity
    between different network zones/segments.

    High conductivity between segments = weak segmentation
    Low conductivity = effective isolation
    """
    async with driver.session(database="neo4j") as session:
        # Find nodes by trust zone or network segment
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['host', 'service', 'network']
               RETURN n.id AS node_id, n.display_name AS name,
                      coalesce(n.attributes, '{}') AS attrs
            """,
            engagement_id=engagement_id,
        )

        segments = {}
        async for record in result:
            attrs = record["attrs"]
            if isinstance(attrs, str):
                try:
                    attrs = __import__("json").loads(attrs)
                except Exception:
                    attrs = {}
            segment = attrs.get("segment", attrs.get("zone", attrs.get("network", "default")))
            segments.setdefault(segment, []).append({
                "id": record["node_id"],
                "name": record["name"],
            })

    if len(segments) < 2:
        return {
            "segments": {k: len(v) for k, v in segments.items()},
            "conductivity": {},
            "message": "Single segment detected — no segmentation analysis possible",
        }

    # Compute inter-segment conductivity
    conductivity = {}
    async with driver.session(database="neo4j") as session:
        for seg_a in segments:
            for seg_b in segments:
                if seg_a >= seg_b:
                    continue
                # Count relationships crossing segments
                cross = await session.run(
                    """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
                       WHERE a.id IN $ids_a AND b.id IN $ids_b
                       RETURN count(r) AS cross_count,
                              collect(type(r)) AS rel_types
                    """,
                    engagement_id=engagement_id,
                    ids_a=[n["id"] for n in segments[seg_a]],
                    ids_b=[n["id"] for n in segments[seg_b]],
                )
                row = await cross.single()
                count = row["cross_count"] if row else 0
                rel_types = row["rel_types"] if row else []

                # Conductivity = cross_edges / min(|segA|, |segB|)
                min_size = min(len(segments[seg_a]), len(segments[seg_b]))
                cond = count / max(min_size, 1)
                conductivity[f"{seg_a} ↔ {seg_b}"] = {
                    "cross_edges": count,
                    "relationship_types": rel_types,
                    "conductivity": round(cond, 4),
                    "effective_isolation": cond < 0.5,
                }

    return {
        "segments": {k: len(v) for k, v in segments.items()},
        "segment_count": len(segments),
        "conductivity": conductivity,
    }
