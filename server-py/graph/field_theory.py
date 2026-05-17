"""
Graph Field Theory — infrastructure topology as dynamic field system.

Models the attack surface as a physics-inspired field where:
  - Trust relationships exert gravitational influence on attack flow
  - Exposure propagates through the graph like radiation
  - Privilege concentrations form energy density wells
  - Attack paths follow force vectors along field gradients
  - Segmentation barriers act as resistive membranes
  - EDR/defense systems produce damping fields

Field Equation:
    Φ(v) = Σ Risk(u) × Trust(u,v) / Distance(u,v)^α

    Φ(v):  attack pressure field at node v
    Risk(u): composite risk score of node u (confidence × severity)
    Trust(u,v): trust conductivity between u and v
    Distance(u,v): topological distance (shortest path length)
    α: distance decay exponent (default 2.0 — inverse square)

Applications:
  - Identify attack gravity wells (high-pressure convergence zones)
  - Rank nodes by field density for operational targeting
  - Compute field gradients to find attack flow direction
  - Detect field discontinuities (segmentation boundaries)
  - Model post-mutation field recomputation
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("lattice9-graph-engine")

# Default field parameters
FIELD_ALPHA = 2.0          # Distance decay exponent
FIELD_BETA = 1.5           # Trust amplification factor
FIELD_GAMMA = 0.8          # Privilege energy density weight
FIELD_DAMPING = 0.3        # Defensive damping coefficient
FIELD_PRESSURE_THRESHOLD = 0.6  # High-pressure zone threshold

# Relationship type → trust conductivity
TRUST_CONDUCTIVITY = {
    "HAS_FINDING": 0.3,
    "EXPLOITS": 0.5,
    "AUTHENTICATES_TO": 0.7,
    "TRUSTS": 0.8,
    "HOSTS": 0.6,
    "RESOLVES_TO": 0.4,
    "DEPENDS_ON": 0.7,
    "NETWORK_REACH": 0.5,
    "PRIVILEGE_ESCALATION": 0.9,
    "DATA_FLOW": 0.6,
    "ATTACK_PATH": 0.85,
    "OWNS": 1.0,
    "MEMBER_OF": 0.75,
}


async def compute_field_density(driver, engagement_id: str) -> Dict:
    """
    Compute attack pressure field Φ(v) for all nodes in the graph.

    Field density = sum of influence from all other nodes,
    weighted by trust conductivity and distance decay.

    Returns:
    - field_densities: per-node field pressure scores
    - gravity_wells: nodes exceeding pressure threshold (attack convergence zones)
    - field_statistics: min/max/mean/std of field across graph
    """
    # Fetch all nodes with their risk scores
    async with driver.session(database="neo4j") as session:
        nodes_result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence,
                      coalesce(toFloat(n.severity_score), 0.5) AS severity_score
            """,
            engagement_id=engagement_id,
        )
        nodes = []
        async for record in nodes_result:
            nodes.append({
                "id": record["id"],
                "name": record["name"],
                "entity_type": record["entity_type"],
                "confidence": record["confidence"],
                "severity_score": record["severity_score"],
            })

        # Fetch all relationships with trust conductivity
        rels_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type,
                      coalesce(toFloat(r.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        relationships = {}
        async for record in rels_result:
            src = record["source"]
            tgt = record["target"]
            rel_type = record["rel_type"]
            rel_conf = record["confidence"]
            relationships.setdefault(src, {})[tgt] = {
                "rel_type": rel_type,
                "confidence": rel_conf,
            }

        # Build adjacency list for distance computation
        adj = {}
        for src, targets in relationships.items():
            for tgt in targets:
                adj.setdefault(src, set()).add(tgt)
                adj.setdefault(tgt, set()).add(src)

    if not nodes:
        return {
            "field_densities": [],
            "gravity_wells": [],
            "field_statistics": {"min": 0, "max": 0, "mean": 0, "std": 0},
        }

    node_map = {n["id"]: n for n in nodes}

    # Compute pairwise distances using BFS (expensive but accurate)
    # For large graphs, approximate with k-hop sampling
    field_densities = []
    for node in nodes:
        node_id = node["id"]
        risk_score = node["confidence"] * node["severity_score"]

        # BFS from this node to compute distances
        distances = _bfs_distances(adj, node_id)

        # Compute field pressure contribution from all other nodes
        pressure = 0.0
        for other_id, dist in distances.items():
            if other_id == node_id or other_id not in node_map:
                continue
            other = node_map[other_id]
            other_risk = other["confidence"] * other["severity_score"]

            # Trust conductivity along path
            trust_conductivity = _compute_path_trust(relationships, node_id, other_id)

            # Damping factor (defensive systems reduce field pressure)
            damping = 1.0
            entity_type = node.get("entity_type", "")
            if entity_type in ("host", "service", "endpoint"):
                damping = 1.0 - FIELD_DAMPING

            # Φ(v) = Σ Risk(u) × Trust(u,v) / Distance(u,v)^α
            if dist > 0:
                contribution = (
                    other_risk
                    * (trust_conductivity ** FIELD_BETA)
                    / (dist ** FIELD_ALPHA)
                    * damping
                )
                pressure += contribution

        # Add self-risk as base pressure
        base_pressure = risk_score * 0.1
        total_pressure = base_pressure + pressure

        field_densities.append({
            "node_id": node_id,
            "name": node["name"],
            "entity_type": node["entity_type"],
            "risk_score": round(risk_score, 4),
            "field_pressure": round(total_pressure, 6),
            "base_pressure": round(base_pressure, 4),
            "propagated_pressure": round(pressure, 6),
        })

    # Identify gravity wells (high-pressure convergence zones)
    pressures = [d["field_pressure"] for d in field_densities]
    max_pressure = max(pressures) if pressures else 1.0
    threshold = max_pressure * FIELD_PRESSURE_THRESHOLD

    gravity_wells = sorted(
        [d for d in field_densities if d["field_pressure"] >= threshold],
        key=lambda x: x["field_pressure"],
        reverse=True,
    )

    # Normalize field densities to [0, 1]
    for d in field_densities:
        d["field_pressure_normalized"] = round(
            d["field_pressure"] / max_pressure if max_pressure > 0 else 0, 6
        )

    # Statistics
    mean_p = sum(pressures) / len(pressures) if pressures else 0
    variance = sum((p - mean_p) ** 2 for p in pressures) / len(pressures) if pressures else 0

    return {
        "field_densities": sorted(
            field_densities, key=lambda x: x["field_pressure"], reverse=True
        ),
        "gravity_wells": gravity_wells,
        "gravity_well_count": len(gravity_wells),
        "field_statistics": {
            "min": round(min(pressures), 6),
            "max": round(max_pressure, 6),
            "mean": round(mean_p, 6),
            "std": round(math.sqrt(variance), 6),
        },
        "parameters": {
            "alpha": FIELD_ALPHA,
            "beta": FIELD_BETA,
            "damping": FIELD_DAMPING,
            "pressure_threshold": FIELD_PRESSURE_THRESHOLD,
        },
    }


async def compute_field_gradients(driver, engagement_id: str, node_id: str) -> Dict:
    """
    Compute the attack field gradient at a specific node.

    The gradient ∇Φ(v) gives the direction and magnitude of
    maximum increase in attack pressure. Attack paths naturally
    follow these gradients.

    Returns:
    - gradient_vector: list of (neighbor, gradient_component) pairs
    - attack_flow_direction: highest-gradient neighbor (natural attack flow)
    - gradient_magnitude: ∥∇Φ(v)∥
    """
    async with driver.session(database="neo4j") as session:
        # Get node
        node_result = await session.run(
            """MATCH (n:L9 {id: $node_id, engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            node_id=node_id,
            engagement_id=engagement_id,
        )
        node = await node_result.single()
        if not node:
            return {"error": "Node not found"}

        # Get neighbors with relationship info
        neighbors_result = await session.run(
            """MATCH (a:L9 {id: $node_id})-[r]-(b:L9 {engagement_id: $engagement_id})
               RETURN b.id AS neighbor_id, b.display_name AS name,
                      b.entity_type AS entity_type,
                      coalesce(toFloat(b.confidence), 0.5) AS confidence,
                      type(r) AS rel_type,
                      coalesce(toFloat(r.confidence), 0.5) AS rel_confidence
            """,
            node_id=node_id,
            engagement_id=engagement_id,
        )
        neighbors = []
        async for record in neighbors_result:
            neighbors.append({
                "id": record["neighbor_id"],
                "name": record["name"],
                "entity_type": record["entity_type"],
                "confidence": record["confidence"],
                "rel_type": record["rel_type"],
                "rel_confidence": record["rel_confidence"],
            })

    # Compute field pressure at this node
    field = await compute_field_density(driver, engagement_id)
    node_pressure = None
    for d in field["field_densities"]:
        if d["node_id"] == node_id:
            node_pressure = d["field_pressure"]
            break

    if node_pressure is None:
        return {"error": "Could not compute field pressure at node"}

    # Compute gradient components: ∂Φ/∂(u,v) for each neighbor
    # Gradient along edge = (Φ(neighbor) - Φ(node)) × trust_conductivity
    gradient_components = []
    for nb in neighbors:
        nb_pressure = None
        for d in field["field_densities"]:
            if d["node_id"] == nb["id"]:
                nb_pressure = d["field_pressure"]
                break

        if nb_pressure is not None:
            conductivity = TRUST_CONDUCTIVITY.get(nb["rel_type"], 0.4)
            gradient = (nb_pressure - node_pressure) * conductivity
            gradient_components.append({
                "neighbor_id": nb["id"],
                "neighbor_name": nb["name"],
                "relationship": nb["rel_type"],
                "neighbor_pressure": round(nb_pressure, 6),
                "gradient_component": round(gradient, 6),
                "attraction": gradient > 0,  # Positive = flow toward neighbor
            })

    # Sort by gradient magnitude descending
    gradient_components.sort(key=lambda x: abs(x["gradient_component"]), reverse=True)

    # Attack flow direction = highest positive gradient
    attack_flow = None
    for g in gradient_components:
        if g["attraction"]:
            attack_flow = g
            break

    # Gradient magnitude
    grad_magnitude = math.sqrt(
        sum(g["gradient_component"] ** 2 for g in gradient_components)
    )

    return {
        "node_id": node_id,
        "node_pressure": round(node_pressure, 6),
        "gradient_magnitude": round(grad_magnitude, 6),
        "attack_flow_direction": attack_flow,
        "gradient_components": gradient_components,
        "neighbor_count": len(neighbors),
    }


async def compute_privilege_diffusion(driver, engagement_id: str) -> Dict:
    """
    Model privilege as energy density diffusing through the graph.

    Privilege diffuses along trust relationships, concentrated
    in high-privilege nodes (domain admins, service accounts).

    Returns:
    - privilege_density: per-node privilege concentration
    - privilege_wells: nodes with highest privilege density
    - diffusion_gradient: direction of privilege spread
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               OPTIONAL MATCH (n)-[:TRUSTS|AUTHENTICATES_TO|MEMBER_OF|PRIVILEGE_ESCALATION*1..3]->(m:L9)
               WITH n, count(DISTINCT m) AS privilege_reach,
                    collect(DISTINCT m.id) AS reachable_ids
               RETURN n.id AS node_id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence,
                      privilege_reach
               ORDER BY privilege_reach DESC
            """,
            engagement_id=engagement_id,
        )

        densities = []
        async for record in result:
            entity_type = record["entity_type"]
            # Base privilege weight by entity type
            base_privilege = {
                "identity": 0.3, "credential": 0.8, "service": 0.5,
                "host": 0.4, "endpoint": 0.2, "domain": 1.0,
                "user": 0.3, "group": 0.6, "privilege": 0.9,
            }.get(entity_type, 0.1)

            privilege_reach = record["privilege_reach"]
            confidence = record["confidence"]

            # Privilege density = base_privilege × reach × confidence
            density = base_privilege * (1 + privilege_reach * 0.1) * confidence
            densities.append({
                "node_id": record["node_id"],
                "name": record["name"],
                "entity_type": entity_type,
                "base_privilege": base_privilege,
                "privilege_reach": privilege_reach,
                "privilege_density": round(density, 6),
            })

    max_density = max((d["privilege_density"] for d in densities), default=1.0)
    threshold = max_density * 0.7

    for d in densities:
        d["privilege_density_normalized"] = round(
            d["privilege_density"] / max_density if max_density > 0 else 0, 6
        )

    privilege_wells = sorted(
        [d for d in densities if d["privilege_density_normalized"] >= 0.7],
        key=lambda x: x["privilege_density"],
        reverse=True,
    )

    return {
        "privilege_densities": sorted(
            densities, key=lambda x: x["privilege_density"], reverse=True
        ),
        "privilege_wells": privilege_wells,
        "privilege_well_count": len(privilege_wells),
        "max_privilege_density": round(max_density, 6),
    }


async def recompute_field_after_mutation(driver, engagement_id: str,
                                          mutated_node_id: str) -> Dict:
    """
    Dynamically recompute pressure field after a graph mutation
    (node added, confidence changed, relationship altered).

    Compares pre-mutation field (from last snapshot) with
    post-mutation field to detect pressure shifts.
    """
    field = await compute_field_density(driver, engagement_id)

    # Identify nodes whose pressure shifted most
    # (without a prior snapshot, we report current field
    # and delta-mutation hotspots)

    # Find the mutated node's field position
    mutated = None
    for d in field["field_densities"]:
        if d["node_id"] == mutated_node_id:
            mutated = d
            break

    # Calculate pressure divergence from mean
    mean_p = field["field_statistics"]["mean"]
    divergence = {}
    for d in field["field_densities"][:20]:  # Top 20 by pressure
        divergence[d["node_id"]] = round(
            d["field_pressure"] - mean_p, 6
        )

    return {
        "post_mutation_field": {
            "gravity_wells": field["gravity_well_count"],
            "max_pressure": field["field_statistics"]["max"],
            "mean_pressure": field["field_statistics"]["mean"],
            "pressure_std": field["field_statistics"]["std"],
        },
        "mutated_node": mutated,
        "top_pressure_divergences": list(divergence.items())[:10],
        "field_shift_detected": abs(
            (mutated["field_pressure"] if mutated else 0) - mean_p
        ) / max(abs(mean_p), 0.001) > 0.5 if mutated else False,
    }


def _bfs_distances(adj: Dict[str, set], start: str) -> Dict[str, int]:
    """Compute shortest-path distances from start node to all reachable nodes."""
    distances = {start: 0}
    queue = [start]
    visited = {start}
    while queue:
        current = queue.pop(0)
        for neighbor in adj.get(current, set()):
            if neighbor not in visited:
                visited.add(neighbor)
                distances[neighbor] = distances[current] + 1
                queue.append(neighbor)
    return distances


def _compute_path_trust(
    relationships: Dict[str, Dict[str, Dict]],
    source: str, target: str
) -> float:
    """
    Compute effective trust conductivity along any path.
    Uses direct trust if available, otherwise decays.
    """
    # Direct trust
    if source in relationships and target in relationships[source]:
        rel = relationships[source][target]
        return TRUST_CONDUCTIVITY.get(rel["rel_type"], 0.4) * rel["confidence"]
    if target in relationships and source in relationships[target]:
        rel = relationships[target][source]
        return TRUST_CONDUCTIVITY.get(rel["rel_type"], 0.4) * rel["confidence"]
    # No direct relationship — use minimum trust
    return 0.1
