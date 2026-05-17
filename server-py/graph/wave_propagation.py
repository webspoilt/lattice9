"""
Attack Wave Propagation — compromise as dynamic wave diffusion through topology.

Models infrastructure compromise as a reaction-diffusion system where:
  - Compromise diffuses through trust/privilege relationships
  - EDR/defense systems produce damping (absorption)
  - Privilege escalation creates wave amplification
  - Segmentation barriers produce reflection/attenuation
  - New findings produce source terms (injection)

Continuous Model (discretized on graph):
    ∂C/∂t = D∇²C − λC + S(x,t)

    C:     compromise concentration at each node [0, 1]
    D:     diffusion tensor (edge-dependent conductivity)
    ∇²C:  graph Laplacian (discrete second derivative)
    λ:    decay/containment rate (EDR damping)
    S:    source term (new compromise events)

Discrete Graph Implementation:
    C(t+1) = C(t) + dt × (-D × L × C(t) - λ × C(t) + S)

    L = graph Laplacian = degree_matrix - adjacency_matrix

Applications:
  - Simulate compromise spread from initial foothold
  - Compute propagation velocity through infrastructure
  - Identify amplification zones (privilege concentration)
  - Model EDR/defense damping effectiveness
  - Predict containment outcomes
  - Visualize propagation waves over topology
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger("lattice9-graph-engine")

# Default diffusion parameters
DIFFUSION_DEFAULT_D = 0.3       # Base diffusion coefficient
DIFFUSION_DEFAULT_LAMBDA = 0.1  # Base decay rate
DIFFUSION_DT = 0.1              # Time step (must be ≤ 0.5/max_degree for stability)
DIFFUSION_STEPS = 50            # Number of simulation steps
DIFFUSION_CONVERGENCE = 0.001   # Convergence threshold

# Edge type → diffusion coefficient (conductivity)
EDGE_DIFFUSIVITY = {
    "TRUSTS": 0.8,
    "MEMBER_OF": 0.7,
    "AUTHENTICATES_TO": 0.6,
    "PRIVILEGE_ESCALATION": 0.9,
    "OWNS": 1.0,
    "EXPLOITS": 0.7,
    "HOSTS": 0.5,
    "DEPENDS_ON": 0.6,
    "NETWORK_REACH": 0.4,
    "DATA_FLOW": 0.5,
    "RESOLVES_TO": 0.2,
    "HAS_FINDING": 0.3,
}


async def simulate_wave_propagation(driver, engagement_id: str,
                                     source_node_ids: List[str] = None,
                                     steps: int = DIFFUSION_STEPS,
                                     dt: float = DIFFUSION_DT) -> Dict:
    """
    Simulate compromise wave propagation through the graph.

    Args:
        source_node_ids: Initial compromise foothold nodes (default: highest-risk nodes)
        steps: Number of time steps to simulate
        dt: Time step size

    Returns:
    - propagation_history: compromise concentration per node per time step
    - wave_front: final compromise state
    - propagation_velocity: avg spread rate Δ(infected)/Δt
    - amplification_zones: nodes where compromise grew fastest
    - damping_zones: nodes where compromise decayed fastest
    - containment_estimate: fraction of graph remaining uncompromised
    """
    # Build graph structure
    async with driver.session(database="neo4j") as session:
        nodes_result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        nodes = {}
        node_list = []
        async for record in nodes_result:
            node_id = record["id"]
            nodes[node_id] = {
                "name": record["name"],
                "entity_type": record["entity_type"],
                "confidence": record["confidence"],
            }
            node_list.append(node_id)

        edges_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type,
                      coalesce(toFloat(r.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        edges = []
        async for record in edges_result:
            edges.append({
                "source": record["source"],
                "target": record["target"],
                "rel_type": record["rel_type"],
                "confidence": record["confidence"],
            })

        # Check for EDR/defense nodes
        edr_result = await session.run(
            """MATCH (e:L9 {engagement_id: $engagement_id})
               WHERE e.entity_type IN ['edr', 'defense', 'control']
               RETURN e.id AS id, e.display_name AS name
            """,
            engagement_id=engagement_id,
        )
        edr_nodes = {}
        async for record in edr_result:
            edr_nodes[record["id"]] = record["name"]

    if not node_list:
        return {"error": "No nodes in graph"}

    n = len(node_list)
    node_index = {nid: i for i, nid in enumerate(node_list)}

    # Build adjacency matrix (sparse) and Laplacian
    adj = defaultdict(list)
    for e in edges:
        if e["source"] in node_index and e["target"] in node_index:
            diffusivity = EDGE_DIFFUSIVITY.get(e["rel_type"], 0.3) * e["confidence"]
            adj[e["source"]].append((e["target"], diffusivity))
            adj[e["target"]].append((e["source"], diffusivity))

    # Initialize concentration vector C
    C = [0.0] * n

    # Set source nodes (initial compromise foothold)
    if source_node_ids:
        for sid in source_node_ids:
            if sid in node_index:
                C[node_index[sid]] = 1.0
    else:
        # Default: start from highest-risk nodes
        sorted_by_risk = sorted(
            node_list,
            key=lambda nid: nodes[nid]["confidence"],
            reverse=True,
        )
        for sid in sorted_by_risk[:3]:
            C[node_index[sid]] = 0.8

    # Build per-node diffusion coefficient and decay rate
    D_vec = [DIFFUSION_DEFAULT_D] * n
    lambda_vec = [DIFFUSION_DEFAULT_LAMBDA] * n

    # Apply EDR damping: nodes near EDR have higher decay rate
    for eid, ename in edr_nodes.items():
        if eid not in node_index:
            continue
        # Increase decay rate at EDR nodes and neighbors
        ei = node_index[eid]
        lambda_vec[ei] += 0.3  # EDR node itself absorbs compromise
        for neighbor, _ in adj[eid]:
            if neighbor in node_index:
                ni = node_index[neighbor]
                lambda_vec[ni] += 0.15  # Neighbors get partial absorption

    # Propagate reverse: mark nodes with defenses
    for eid in edr_nodes:
        if eid not in node_index:
            continue
        ei = node_index[eid]
        # EDR reduces diffusion outward from itself
        for neighbor, diffusivity in adj[eid]:
            if neighbor in node_index:
                # Reduce diffusion coefficient on edges from EDR
                d0 = DIFFUSION_DEFAULT_D
                D_vec[node_index[neighbor]] = max(0.05, d0 * (1.0 - 0.3))

    # Simulation history
    history = [C.copy()]
    infected_count_history = [sum(1 for c in C if c > 0.1)]
    convergence_step = steps

    # Iterative diffusion simulation
    for t in range(steps):
        # Compute Laplacian: (L × C)[i] = degree[i] * C[i] - Σ adj[i][j] * C[j]
        new_C = C.copy()

        for node_id in node_list:
            i = node_index[node_id]
            if C[i] <= 0.001:
                continue  # Skip near-zero nodes for performance

            # Laplacian term: ∇²C = ΔC = (1/|N|) Σ D_ij × (C[j] - C[i])
            laplacian = 0.0
            degree = len(adj[node_id])
            if degree > 0:
                for neighbor, diffusivity in adj[node_id]:
                    if neighbor in node_index:
                        j = node_index[neighbor]
                        diff_term = diffusivity * (C[j] - C[i])
                        laplacian += diff_term
                laplacian /= degree

            # Source term: new compromise from findings
            source = 0.0
            if nodes[node_id]["entity_type"] in ("finding", "vulnerability"):
                source = nodes[node_id]["confidence"] * 0.1

            # Wave amplification: privilege nodes amplify propagation
            amplification = 1.0
            if nodes[node_id]["entity_type"] in ("credential", "privilege", "identity"):
                amplification = 1.5

            # Update: C_new = C + dt × (D × ∇²C - λ × C + S) × amplification
            dC = dt * (
                D_vec[i] * laplacian
                - lambda_vec[i] * C[i]
                + source
            ) * amplification

            new_C[i] = max(0.0, min(1.0, C[i] + dC))

        C = new_C
        history.append(C.copy())
        infected_count = sum(1 for c in C if c > 0.1)
        infected_count_history.append(infected_count)

        # Check convergence
        if abs(infected_count_history[-1] - infected_count_history[-2]) / max(len(node_list), 1) < DIFFUSION_CONVERGENCE:
            convergence_step = t + 1
            break

    # Process results
    final_concentrations = {}
    for nid in node_list:
        i = node_index[nid]
        final_concentrations[nid] = {
            "name": nodes[nid]["name"],
            "entity_type": nodes[nid]["entity_type"],
            "final_concentration": round(C[i], 6),
        }

    # Propagation velocity = Δinfected / Δtimesteps
    total_infected = infected_count_history[-1]
    initial_infected = infected_count_history[0]
    velocity = (total_infected - initial_infected) / max(convergence_step, 1)

    # Amplification zones: nodes where concentration grew most from start to end
    amplification_scores = {}
    for nid in node_list:
        i = node_index[nid]
        initial_c = 1.0 if (source_node_ids and nid in source_node_ids) else 0.0
        growth = C[i] - initial_c
        if growth > 0:
            amplification_scores[nid] = round(growth, 6)

    top_amplifications = sorted(
        amplification_scores.items(), key=lambda x: x[1], reverse=True
    )[:10]

    # Damping zones: nodes where EDR/defense suppressed growth
    damping_scores = {}
    for nid in node_list:
        i = node_index[nid]
        if lambda_vec[i] > DIFFUSION_DEFAULT_LAMBDA and C[i] < 0.3:
            damping_scores[nid] = {
                "name": nodes[nid]["name"],
                "concentration": round(C[i], 6),
                "decay_rate": round(lambda_vec[i], 4),
            }

    # Containment estimate
    containment = 1.0 - (total_infected / len(node_list))

    return {
        "parameters": {
            "diffusion_coefficient": DIFFUSION_DEFAULT_D,
            "decay_rate": DIFFUSION_DEFAULT_LAMBDA,
            "time_steps": convergence_step,
            "dt": dt,
            "edr_nodes_present": len(edr_nodes),
        },
        "initial_foothold": source_node_ids or "auto-selected top 3 risk nodes",
        "final_wave_front": dict(sorted(
            final_concentrations.items(),
            key=lambda x: x[1]["final_concentration"],
            reverse=True,
        )[:20]),
        "propagation_velocity": round(velocity, 4),
        "total_infected": total_infected,
        "total_nodes": len(node_list),
        "infection_percentage": round(total_infected / max(len(node_list), 1) * 100, 1),
        "containment_estimate": round(containment, 4),
        "convergence_at_step": convergence_step,
        "amplification_zones": [
            {
                "node_id": nid,
                "name": nodes[nid]["name"],
                "growth": amp,
            } for nid, amp in top_amplifications
        ],
        "damping_zones": list(damping_scores.values())[:10],
        "infected_history": infected_count_history,
    }


async def compute_propagation_velocity(driver, engagement_id: str) -> Dict:
    """
    Compute the propagation velocity of compromise through the graph.

    Velocity = how many nodes are reachable at distance d from a source,
    averaged across all high-confidence source nodes.

    Returns velocity profile, not just scalar.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['host', 'service', 'credential', 'identity']
               RETURN n.id AS node_id, n.display_name AS name,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
               ORDER BY n.confidence DESC
               LIMIT 10
            """,
            engagement_id=engagement_id,
        )
        sources = []
        async for record in result:
            sources.append({
                "id": record["node_id"],
                "name": record["name"],
                "confidence": record["confidence"],
            })

    if not sources:
        return {"velocity": 0, "message": "No source nodes available"}

    velocities = []
    for src in sources:
        wave = await simulate_wave_propagation(
            driver, engagement_id,
            source_node_ids=[src["id"]],
            steps=30,
        )
        velocities.append({
            "source": src["name"],
            "source_id": src["id"],
            "velocity": wave["propagation_velocity"],
            "infection_percentage": wave["infection_percentage"],
            "containment": wave["containment_estimate"],
        })

    avg_velocity = sum(v["velocity"] for v in velocities) / len(velocities) if velocities else 0

    return {
        "source_velocities": velocities,
        "average_velocity": round(avg_velocity, 4),
        "fastest_propagation": max(velocities, key=lambda v: v["velocity"]) if velocities else None,
        "slowest_propagation": min(velocities, key=lambda v: v["velocity"]) if velocities else None,
    }


async def compute_wave_amplification_regions(driver, engagement_id: str) -> Dict:
    """
    Identify regions of the graph where compromise waves amplify.

    Amplification occurs where:
    - Multiple trust relationships converge (hub nodes)
    - Privilege escalation paths exist
    - High credential density
    - Low resistance to propagation

    Returns ranked list of amplification regions.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               OPTIONAL MATCH (n)-[r]-(connected:L9)
               WITH n, count(DISTINCT connected) AS connectivity,
                    collect(DISTINCT type(r)) AS rel_types,
                    n.entity_type AS entity_type
               RETURN n.id AS node_id, n.display_name AS name,
                      entity_type, connectivity, rel_types
               ORDER BY connectivity DESC
               LIMIT 30
            """,
            engagement_id=engagement_id,
        )

        amplification_regions = []
        async for record in result:
            entity_type = record["entity_type"]
            connectivity = record["connectivity"] or 0

            # Amplification factor based on connectivity and entity type
            base_amplification = 1.0
            if entity_type in ("credential", "privilege", "identity"):
                base_amplification = 2.0
            elif entity_type in ("service", "host"):
                base_amplification = 1.3
            elif entity_type == "domain":
                base_amplification = 3.0

            # Hub nodes (high connectivity) amplify more
            hub_factor = 1.0 + (connectivity * 0.1)
            amplification_factor = base_amplification * hub_factor

            amplification_regions.append({
                "node_id": record["node_id"],
                "name": record["name"],
                "entity_type": entity_type,
                "connectivity": connectivity,
                "amplification_factor": round(amplification_factor, 4),
                "is_amplifier": amplification_factor > 1.5,
            })

    return {
        "amplification_regions": sorted(
            amplification_regions,
            key=lambda x: x["amplification_factor"],
            reverse=True,
        ),
        "total_amplifiers": sum(1 for r in amplification_regions if r["is_amplifier"]),
    }
