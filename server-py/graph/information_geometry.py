"""
Information Geometry — infrastructure as high-dimensional information manifold.

Represents the attack surface as a Riemannian manifold where:
  - Each node is a point in information space (risk, privilege, connectivity)
  - Geodesic paths are the shortest paths in this space
  - Curvature measures how risk/privilege topology bends around a node
  - Gradient descent finds optimal traversal paths

Manifold Coordinates:
    M(v) = (risk_score, privilege_level, connectivity_degree, defense_strength)

Riemannian Metric:
    g_ij(v) = ∂²Φ / ∂x_i ∂x_j — Hessian of the field potential

    Induces geodesic distance: d(a,b) = min ∫ √(Σ g_ij dx_i dx_j)

Applications:
  - Geodesic attack paths: shortest semantic compromise distance
  - Curvature analysis: identify regions where small changes cause large effects
  - Gradient descent traversal: follow path of least resistance
  - Topology deformation: detect anomalous manifold structure
"""

import logging
import math
from typing import List, Dict, Set, Any, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger("lattice9-graph-engine")

# Manifold coordinate weights for distance computation
COORDINATE_WEIGHTS = {
    "risk": 1.0,
    "privilege": 1.5,
    "connectivity": 0.5,
    "defense": 2.0,  # Defense strength increases distance (harder to traverse)
}


async def compute_geodesic_paths(driver, engagement_id: str,
                                  source_id: str, target_id: str) -> Dict:
    """
    Compute geodesic (shortest manifold-distance) path between two nodes.

    Geodesic distance accounts for:
    - Risk differential: moving from low to high risk = shorter distance
    - Privilege gradient: moving toward privilege = shorter distance
    - Defense presence: defense nodes increase effective distance

    Uses Dijkstra with manifold distance as edge weight.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence,
                      n.display_name AS name
            """,
            engagement_id=engagement_id,
        )
        node_data = {}
        async for record in result:
            node_data[record["id"]] = {
                "type": record["entity_type"],
                "confidence": record["confidence"],
                "name": record["name"],
            }

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

    if source_id not in node_data or target_id not in node_data:
        return {"error": "Source or target node not in graph"}

    # Build manifold coordinates for each node
    coords = {}
    for nid, nd in node_data.items():
        # Risk coordinate
        risk = nd["confidence"]

        # Privilege coordinate
        privilege = {
            "credential": 0.9, "privilege": 0.85, "identity": 0.7,
            "domain": 1.0, "service": 0.5, "host": 0.4,
            "endpoint": 0.2, "objective": 1.0, "network": 0.3,
        }.get(nd["type"], 0.1)

        # Connectivity coordinate
        connectivity = sum(1 for e in edges if e["source"] == nid or e["target"] == nid)
        connectivity_norm = min(1.0, connectivity / 10.0)

        # Defense coordinate
        defense = 0.0
        if nd["type"] in ("edr", "defense", "control", "monitoring"):
            defense = 0.8

        coords[nid] = {
            "risk": risk,
            "privilege": privilege,
            "connectivity": connectivity_norm,
            "defense": defense,
        }

    # Compute manifold distance for each edge
    # d(a,b) = Σ w_i × |coord_i(a) - coord_i(b)|
    adj = defaultdict(dict)
    for e in edges:
        s, t = e["source"], e["target"]
        if s in coords and t in coords:
            cs, ct = coords[s], coords[t]
            # Weighted Manhattan distance in manifold
            distance = (
                COORDINATE_WEIGHTS["risk"] * abs(cs["risk"] - ct["risk"])
                + COORDINATE_WEIGHTS["privilege"] * abs(cs["privilege"] - ct["privilege"])
                + COORDINATE_WEIGHTS["connectivity"] * abs(cs["connectivity"] - ct["connectivity"])
                + COORDINATE_WEIGHTS["defense"] * abs(cs["defense"] - ct["defense"])
            )
            # Base cost: small positive to avoid zero-length edges
            edge_cost = max(0.01, distance) / max(e["confidence"], 0.01)
            adj[s][t] = edge_cost
            adj[t][s] = edge_cost

    # Dijkstra for geodesic path
    INF = float('inf')
    distances = {nid: INF for nid in node_data}
    previous = {nid: None for nid in node_data}
    distances[source_id] = 0.0
    unvisited = set(node_data.keys())

    while unvisited:
        current = min(unvisited, key=lambda n: distances[n])
        unvisited.remove(current)

        if current == target_id:
            break
        if distances[current] == INF:
            break

        for neighbor, cost in adj.get(current, {}).items():
            if neighbor in unvisited:
                new_dist = distances[current] + cost
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous[neighbor] = current

    # Reconstruct path
    path = []
    current = target_id
    while current is not None:
        path.insert(0, current)
        current = previous[current]

    if path[0] != source_id:
        return {"error": "No geodesic path found"}

    geodesic_distance = distances[target_id]

    # Compute geodesic path steps with manifold coordinates
    path_steps = []
    for i in range(len(path) - 1):
        s, t = path[i], path[i + 1]
        path_steps.append({
            "step": i,
            "from": node_data[s]["name"],
            "from_type": node_data[s]["type"],
            "to": node_data[t]["name"],
            "to_type": node_data[t]["type"],
            "from_coords": coords[s],
            "to_coords": coords[t],
            "segment_distance": round(adj.get(s, {}).get(t, 0), 6),
        })

    return {
        "source": node_data[source_id]["name"],
        "target": node_data[target_id]["name"],
        "geodesic_distance": round(geodesic_distance, 6),
        "euclidean_path_length": len(path) - 1,
        "path_steps": path_steps,
        "path_nodes": [node_data[nid]["name"] for nid in path],
    }


async def compute_manifold_curvature(driver, engagement_id: str) -> Dict:
    """
    Compute manifold curvature at each node.

    Curvature = how much the graph bends around the node in manifold space.

    High curvature regions:
    - Boundaries between network segments
    - Points where privilege gradient is steep
    - Transition zones between low and high risk
    - Near defense boundaries

    Curvature approximation using Ollivier-Ricci curvature:
    κ(u,v) = 1 - W(m_u, m_v) / d(u,v)

    Where W is Wasserstein distance between neighbor distributions.
    Simplification: use degree-normalized local variance.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence,
                      n.display_name AS name
            """,
            engagement_id=engagement_id,
        )
        node_data = {}
        async for record in result:
            node_data[record["id"]] = {
                "type": record["entity_type"],
                "confidence": record["confidence"],
                "name": record["name"],
            }

        edges_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type
            """,
            engagement_id=engagement_id,
        )
        adj = defaultdict(set)
        async for record in edges_result:
            adj[record["source"]].add(record["target"])
            adj[record["target"]].add(record["source"])

    # Compute curvature at each edge, then average per node
    edge_curvatures = {}

    for nid in node_data:
        neighbors = adj.get(nid, set())
        if len(neighbors) < 2:
            edge_curvatures[nid] = 0.0
            continue

        # Compute local variance in confidence (proxy for curvature)
        confidence_values = []
        for nb in neighbors:
            if nb in node_data:
                confidence_values.append(node_data[nb]["confidence"])

        if len(confidence_values) < 2:
            edge_curvatures[nid] = 0.0
            continue

        mean_conf = sum(confidence_values) / len(confidence_values)
        variance = sum((c - mean_conf) ** 2 for c in confidence_values) / len(confidence_values)

        # Curvature = normalized variance of neighbor confidence
        # High variance = high curvature = boundary region
        curvature = math.sqrt(variance)
        edge_curvatures[nid] = curvature

    max_curv = max(edge_curvatures.values()) if edge_curvatures else 1.0
    curvatures = [
        {
            "node_id": nid,
            "name": node_data.get(nid, {}).get("name", nid),
            "type": node_data.get(nid, {}).get("type", "unknown"),
            "curvature": round(c / max_curv if max_curv > 0 else 0, 6),
            "neighbor_count": len(adj.get(nid, set())),
        }
        for nid, c in edge_curvatures.items()
    ]
    curvatures.sort(key=lambda x: x["curvature"], reverse=True)

    total_curv = sum(c["curvature"] for c in curvatures)
    return {
        "curvatures": curvatures[:30],
        "high_curvature_regions": [c for c in curvatures if c["curvature"] > 0.6],
        "curvature_statistics": {
            "mean": round(total_curv / max(len(curvatures), 1), 6),
            "max": round(max_curv, 6),
            "total_nodes": len(curvatures),
        },
    }


async def compute_gradient_descent_path(driver, engagement_id: str,
                                         source_id: str,
                                         objective: str = "privilege") -> Dict:
    """
    Compute gradient descent path from source toward maximum privilege/risk.

    At each step, move to the neighbor with the highest:
    - Privilege gradient (if objective="privilege")
    - Risk gradient (if objective="risk")
    - Field pressure gradient (if objective="pressure")

    This reveals the natural attack flow under no resistance.
    """
    objective_key = {
        "privilege": "privilege",
        "risk": "risk",
        "pressure": "pressure",
    }.get(objective, "privilege")

    # Compute objective function value at each node
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence,
                      n.display_name AS name
            """,
            engagement_id=engagement_id,
        )
        node_data = {}
        async for record in result:
            node_data[record["id"]] = {
                "type": record["entity_type"],
                "confidence": record["confidence"],
                "name": record["name"],
            }

        edges_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target
            """,
            engagement_id=engagement_id,
        )
        adj = defaultdict(set)
        async for record in edges_result:
            adj[record["source"]].add(record["target"])
            adj[record["target"]].add(record["source"])

    # Compute objective function
    objective_values = {}
    for nid, nd in node_data.items():
        if objective_key == "privilege":
            val = {
                "credential": 0.9, "privilege": 0.85, "identity": 0.7,
                "domain": 1.0, "service": 0.5, "host": 0.4,
                "endpoint": 0.2, "objective": 1.0,
            }.get(nd["type"], 0.1) * nd["confidence"]
        elif objective_key == "risk":
            val = nd["confidence"]
        else:
            val = nd["confidence"] * 0.5
        objective_values[nid] = val

    if source_id not in objective_values:
        return {"error": "Source node not in graph"}

    # Gradient descent
    path = [source_id]
    current = source_id
    visited = {source_id}
    max_steps = 20

    for _ in range(max_steps):
        neighbors = adj.get(current, set()) - visited
        if not neighbors:
            break

        # Find neighbor with highest objective value (steepest ascent)
        gradients = []
        for nb in neighbors:
            if nb not in objective_values:
                continue
            gradient = objective_values[nb] - objective_values[current]
            gradients.append((nb, gradient))

        if not gradients:
            break

        # Move to steepest ascent
        next_node = max(gradients, key=lambda x: x[1])

        if next_node[1] <= 0:
            # Local maximum reached
            break

        path.append(next_node[0])
        visited.add(next_node[0])
        current = next_node[0]

    # Check if we found a local maximum (attractor)
    local_max = True
    for neighbor in adj.get(current, set()):
        if neighbor in objective_values and objective_values[neighbor] > objective_values[current]:
            local_max = False
            break

    return {
        "source": node_data[source_id]["name"],
        "objective": objective_key,
        "path": [node_data[nid]["name"] for nid in path],
        "path_values": [round(objective_values[nid], 4) for nid in path],
        "path_length": len(path) - 1,
        "terminated_at_local_maximum": local_max,
        "terminal_node": node_data.get(current, {}).get("name", "unknown"),
        "terminal_value": round(objective_values.get(current, 0), 4),
    }
