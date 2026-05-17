"""
Attack Attractor Theory — chaos-theory-inspired compromise modeling.

Infrastructure compromise follows attractor dynamics:
  - Certain nodes naturally concentrate attack flow (compromise attractors)
  - Graph states exhibit instability near privilege boundaries
  - Compromise inevitability emerges from topology structure
  - Trust-collapse patterns reveal systemic weaknesses

Mathematical Model:
  Attractor strength at node v:
    A(v) = trust_inflow(v) × privilege_density(v) × centrality(v)

  Instability score:
    I(G, v) = |∇Φ(v)| — gradient magnitude of field pressure
              — high gradient = high instability = imminent compromise

Applications:
  - Identify nodes where compromise naturally converges
  - Detect unstable infrastructure configurations
  - Predict inevitability of privilege escalation
  - Find trust-collapse patterns (cascading failure points)
"""

import logging
import math
from typing import List, Dict, Set, Any, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger("lattice9-graph-engine")

ATTRACTOR_ALPHA = 0.4      # Trust inflow weight
ATTRACTOR_BETA = 0.35      # Privilege density weight
ATTRACTOR_GAMMA = 0.25     # Centrality weight

INSTABILITY_THRESHOLD = 0.6  # Above this = unstable graph state
INEVITABILITY_THRESHOLD = 0.7  # Above this = compromise inevitable


async def compute_compromise_attractors(driver, engagement_id: str) -> Dict:
    """
    Identify compromise attractors — nodes where attack flow converges.

    Attractor strength = f(trust_inflow, privilege_density, centrality)

    High-attractor nodes are:
    - Natural targets for lateral movement
    - Points where multiple attack paths converge
    - High-value, high-reach infrastructure nodes
    """
    async with driver.session(database="neo4j") as session:
        # Get all nodes
        nodes_result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        nodes = {}
        async for record in nodes_result:
            nodes[record["id"]] = {
                "name": record["name"],
                "type": record["entity_type"],
                "confidence": record["confidence"],
            }

        # Get in-degree (trust inflow)
        inflow_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN b.id AS target, count(r) AS in_degree,
                      collect(DISTINCT type(r)) AS rel_types
            """,
            engagement_id=engagement_id,
        )
        inflow = {}
        async for record in inflow_result:
            inflow[record["target"]] = {
                "degree": record["in_degree"],
                "rel_types": record["rel_types"],
            }

        # Get out-degree (for centrality)
        out_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, count(r) AS out_degree
            """,
            engagement_id=engagement_id,
        )
        outflow = {}
        async for record in out_result:
            outflow[record["source"]] = record["out_degree"]

        # Get edges for path computation
        edges_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target
            """,
            engagement_id=engagement_id,
        )
        adj = defaultdict(set)
        async for record in edges_result:
            adj[record["source"]].add(record["target"])

    # Compute attractor strength for each node
    attractors = []
    max_degree = max((inf["degree"] for inf in inflow.values()), default=1)
    max_out = max(outflow.values(), default=1)

    for nid, node_info in nodes.items():
        trust_inflow = inflow.get(nid, {}).get("degree", 0) / max_degree if max_degree > 0 else 0

        # Privilege density by entity type
        priv_density = {
            "credential": 0.9, "privilege": 0.85, "identity": 0.7,
            "domain": 1.0, "service": 0.5, "host": 0.4,
            "endpoint": 0.2, "finding": 0.1, "objective": 0.8,
            "evidence": 0.05, "network": 0.3,
        }.get(node_info["type"], 0.2) * node_info["confidence"]

        # Centrality: out-degree ratio
        centrality = outflow.get(nid, 0) / max_out if max_out > 0 else 0

        # Attractor strength (weighted sum)
        attractor_strength = (
            ATTRACTOR_ALPHA * trust_inflow
            + ATTRACTOR_BETA * priv_density
            + ATTRACTOR_GAMMA * centrality
        )

        attractors.append({
            "node_id": nid,
            "name": node_info["name"],
            "type": node_info["type"],
            "trust_inflow": round(trust_inflow, 4),
            "privilege_density": round(priv_density, 4),
            "centrality": round(centrality, 4),
            "attractor_strength": round(attractor_strength, 6),
            "is_attractor": attractor_strength > 0.5,
        })

    attractors.sort(key=lambda a: a["attractor_strength"], reverse=True)
    top_attractors = [a for a in attractors if a["is_attractor"]]

    return {
        "attractors": top_attractors,
        "total_attractors": len(top_attractors),
        "total_nodes": len(attractors),
        "attractor_concentration": round(
            len(top_attractors) / max(len(attractors), 1), 4
        ),
        "parameters": {
            "trust_inflow_weight": ATTRACTOR_ALPHA,
            "privilege_density_weight": ATTRACTOR_BETA,
            "centrality_weight": ATTRACTOR_GAMMA,
        },
    }


async def compute_attractor_instability(driver, engagement_id: str) -> Dict:
    """
    Compute topological instability of each node.

    Instability = ∇Φ(v) — gradient of attack field pressure.

    High instability means:
    - Small changes in neighbor state cause large changes here
    - Node is near a "critical point" in the topology
    - Imminent compromise is more likely

    Returns unstable regions and their characteristics.
    """
    # Compute field pressure gradient (instability proxy)
    from graph.field_theory import compute_field_density

    field = await compute_field_density(driver, engagement_id)
    field_densities = field.get("field_densities", [])
    field_map = {d["node_id"]: d["field_pressure"] for d in field_densities}

    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type
            """,
            engagement_id=engagement_id,
        )
        adj = defaultdict(list)
        async for record in result:
            adj[record["source"]].append(record["target"])

    # Compute instability as local pressure variance
    instabilities = []
    for nid, pressure in field_map.items():
        neighbor_pressures = []
        for neighbor in adj.get(nid, []):
            if neighbor in field_map:
                neighbor_pressures.append(field_map[neighbor])

        if neighbor_pressures:
            mean_nb = sum(neighbor_pressures) / len(neighbor_pressures)
            # Instability = |pressure - mean_neighbor_pressure|
            instability = abs(pressure - mean_nb)
        else:
            instability = 0.0

        instabilities.append({
            "node_id": nid,
            "field_pressure": round(pressure, 6),
            "instability": round(instability, 6),
            "neighbor_count": len(adj.get(nid, [])),
        })

    instabilities.sort(key=lambda x: x["instability"], reverse=True)
    max_inst = max((i["instability"] for i in instabilities), default=1.0)
    unstable_threshold = max_inst * INSTABILITY_THRESHOLD
    unstable_regions = [i for i in instabilities if i["instability"] >= unstable_threshold]

    inst_values = [i["instability"] for i in instabilities]
    mean_inst = sum(inst_values) / len(inst_values) if inst_values else 0

    return {
        "unstable_regions": unstable_regions[:20],
        "total_unstable": len(unstable_regions),
        "instability_statistics": {
            "mean": round(mean_inst, 6),
            "max": round(max_inst, 6),
            "std": round(
                math.sqrt(sum((v - mean_inst) ** 2 for v in inst_values) / len(inst_values))
                if inst_values else 0, 6
            ),
        },
        "graph_stable": len(unstable_regions) / max(len(instabilities), 1) < 0.2,
    }


async def compute_compromise_inevitability(driver, engagement_id: str) -> Dict:
    """
    Compute inevitability scores — how certain is compromise
    given the current topology configuration.

    High inevitability = even under optimal defense,
    this node will eventually be compromised.

    Inevitability factors:
    - Multiple incoming attack paths
    - High attacker field pressure
    - Low resistance from defense
    - High privilege value
    - Weak segmentation
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        nodes = {}
        async for record in result:
            nodes[record["id"]] = {
                "name": record["name"],
                "type": record["entity_type"],
                "confidence": record["confidence"],
            }

    from graph.field_theory import compute_field_density
    field = await compute_field_density(driver, engagement_id)
    field_map = {d["node_id"]: d["field_pressure"] for d in field.get("field_densities", [])}
    max_pressure = max(field_map.values()) if field_map else 1.0

    inevitabilities = []
    for nid, node_info in nodes.items():
        pressure = field_map.get(nid, 0)
        normalized_pressure = pressure / max_pressure if max_pressure > 0 else 0

        # Privilege value (high value = more inevitable)
        priv_value = {
            "credential": 0.9, "privilege": 0.85, "identity": 0.7,
            "domain": 1.0, "service": 0.5, "host": 0.4,
            "endpoint": 0.2, "objective": 1.0,
        }.get(node_info["type"], 0.1) * node_info["confidence"]

        # Inevitability = pressure × privilege
        inevitability = normalized_pressure * priv_value * 1.5
        inevitability = min(1.0, inevitability)

        inevitabilities.append({
            "node_id": nid,
            "name": node_info["name"],
            "type": node_info["type"],
            "field_pressure_normalized": round(normalized_pressure, 4),
            "privilege_value": round(priv_value, 4),
            "inevitability": round(inevitability, 4),
            "inevitable": inevitability >= INEVITABILITY_THRESHOLD,
        })

    inevitabilities.sort(key=lambda x: x["inevitability"], reverse=True)
    inevitable_nodes = [i for i in inevitabilities if i["inevitable"]]

    return {
        "inevitability_scores": inevitabilities[:30],
        "inevitable_nodes": inevitable_nodes[:20],
        "total_inevitable": len(inevitable_nodes),
        "total_nodes": len(inevitabilities),
        "inevitability_ratio": round(len(inevitable_nodes) / max(len(inevitabilities), 1), 4),
    }
