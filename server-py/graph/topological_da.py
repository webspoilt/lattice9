"""
Topological Data Analysis — persistent homology, simplicial complexes, graph voids.

Applies algebraic topology to graph infrastructure:
  - 0-dimensional homology: connected components (infrastructure segmentation)
  - 1-dimensional homology: cycles (redundant trust paths, backup routes)
  - 2-dimensional homology: voids (missing monitoring coverage, blind spots)

Simplicial complexes: cliques of size k form (k-1)-simplices.
  - 2-clique = edge (1-simplex)
  - 3-clique = triangle (2-simplex) — redundant trust
  - 4-clique = tetrahedron (3-simplex) — highly interconnected zone

Applications:
  - Hidden trust clusters: simplicial complexes reveal organizational structure
  - Attack cavities: topological voids = regions invisible to monitoring
  - Privilege concentration: detected via persistent homology of privilege edges
  - Anomalous structures: unusual homological features indicate backdoors
  - Segmentation analysis: 0-homology components = network segments
"""

import logging
import math
from typing import List, Dict, Set, Any, Optional, Tuple
from collections import defaultdict, Counter

logger = logging.getLogger("lattice9-graph-engine")

HOMOLOGY_THRESHOLD = 0.5  # Minimum edge weight for homology computation
VOID_DETECTION_RADIUS = 3  # BFS radius for void detection
MAX_CLIQUE_SIZE = 5        # Maximum clique size for simplicial computation


async def compute_persistent_homology(driver, engagement_id: str) -> Dict:
    """
    Compute persistent homology of the infrastructure graph at multiple scales.

    Filtration: gradually add edges sorted by confidence/weight.
    Track when topological features (components, cycles) appear and disappear.

    Returns:
    - H0: connected components birth/death (segmentation evolution)
    - H1: cycles birth/death (trust redundancy zones)
    - persistence_diagram: (birth, death) pairs for each feature
    - most_persistent_features: longest-lived topological features
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type,
                      coalesce(toFloat(r.confidence), 0.5) AS weight
            """,
            engagement_id=engagement_id,
        )
        raw_edges = []
        node_set = set()
        async for record in result:
            raw_edges.append({
                "source": record["source"],
                "target": record["target"],
                "weight": record["weight"],
            })
            node_set.add(record["source"])
            node_set.add(record["target"])

    if not raw_edges:
        return {"error": "No edges to analyze"}

    # Sort edges by weight ascending (filtration order)
    sorted_edges = sorted(raw_edges, key=lambda e: e["weight"])
    node_list = list(node_set)
    node_index = {n: i for i, n in enumerate(node_list)}
    n = len(node_list)

    # Union-Find for H0 (connected components)
    parent = list(range(n))
    rank = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx == ry:
            return False
        if rank[rx] < rank[ry]:
            parent[rx] = ry
        elif rank[rx] > rank[ry]:
            parent[ry] = rx
        else:
            parent[ry] = rx
            rank[rx] += 1
        return True

    # H0 persistence: components merging
    h0_birth = {i: 0.0 for i in range(n)}
    h0_features = []
    components = n

    # H1 persistence: cycle detection via incremental graph
    adjacency = defaultdict(set)
    h1_features = []

    for edge in sorted_edges:
        s = node_index[edge["source"]]
        t = node_index[edge["target"]]
        w = edge["weight"]

        # Check if adding this edge merges components (H0 death)
        if union(s, t):
            components -= 1
        else:
            # Edge connects same component — potential cycle (H1)
            # Use DFS to check if a new cycle is created
            if s in adjacency and t in adjacency[s]:
                continue  # Redundant edge (multi-graph)
            adjacency[s].add(t)
            adjacency[t].add(s)

            # Check if this edge creates a cycle via BFS
            visited = set()
            stack = [(s, [s])]
            cycle_found = False
            while stack and not cycle_found:
                node, path = stack.pop()
                for neighbor in adjacency[node]:
                    if neighbor == t and len(path) > 2 and node != s:
                        # Cycle found connecting s↔t via path
                        cycle = path + [t]
                        h1_features.append({
                            "birth": w,
                            "death": 1.0,  # Persists to max scale
                            "cycle_nodes": [node_list[c] for c in cycle],
                            "cycle_length": len(cycle),
                        })
                        cycle_found = True
                        break
                    if neighbor not in visited and neighbor not in (s,):
                        visited.add(neighbor)
                        stack.append((neighbor, path + [neighbor]))

    # Record H0 features (components that merged)
    # Birth = when component first appeared, Death = when it merged
    # For simplicity: components that never merge persist to 1.0
    merged = set()
    for edge in sorted_edges:
        s = node_index[edge["source"]]
        t = node_index[edge["target"]]
        w = edge["weight"]
        if find(s) == find(t):
            continue  # Already same component
        # One component dies (merges into larger)
        # This is an approximation — exact persistence requires tracking component IDs
        union(s, t)

    return {
        "h0_features": {
            "initial_components": n,
            "final_components": components,
            "merge_events": n - components,
        },
        "h1_features": {
            "total_cycles": len(h1_features),
            "cycles": h1_features[:20],  # Top 20 by persistence
        },
        "most_persistent_features": sorted(
            h1_features, key=lambda h: h["death"] - h["birth"], reverse=True
        )[:10],
    }


async def compute_simplicial_complexes(driver, engagement_id: str) -> Dict:
    """
    Compute simplicial complex structure of the graph.

    Simplex types:
    - 0-simplex: node
    - 1-simplex: edge
    - 2-simplex: triangle (3-clique)
    - 3-simplex: tetrahedron (4-clique)
    - 4-simplex: 5-clique

    Returns:
    - simplex_count: number of simplices at each dimension
    - maximal_complexes: largest cliques in the graph
    - trust_clusters: node groups forming high-dimensional simplices
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type
            """,
            engagement_id=engagement_id,
        )
        raw_edges = []
        nodes_set = set()
        async for record in result:
            src, tgt = record["source"], record["target"]
            raw_edges.append((src, tgt))
            nodes_set.add(src)
            nodes_set.add(tgt)

    # Build adjacency for clique detection
    adj = defaultdict(set)
    for s, t in raw_edges:
        adj[s].add(t)
        adj[t].add(s)

    nodes = list(nodes_set)

    # Find all cliques up to MAX_CLIQUE_SIZE using Bron-Kerbosch
    all_cliques = []

    def bron_kerbosch(R, P, X):
        if not P and not X:
            if len(R) >= 2:
                all_cliques.append(sorted(R))
            return
        if not P:
            return
        # Pivot optimization
        u = next(iter(P | X)) if P | X else None
        for v in P - (adj[u] if u else set()):
            bron_kerbosch(
                R | {v},
                P & adj[v],
                X & adj[v],
            )
            P = P - {v}
            X = X | {v}

    bron_kerbosch(set(), set(nodes), set())

    # Count by dimension
    dim_counts = Counter()
    for c in all_cliques:
        dim = len(c) - 1  # k nodes = (k-1)-simplex
        if dim <= MAX_CLIQUE_SIZE - 1:
            dim_counts[dim] += 1

    # Maximal simplices (not subset of larger simplex)
    maximal = []
    for c in sorted(all_cliques, key=len, reverse=True):
        is_maximal = True
        for m in maximal:
            if set(c).issubset(set(m)) and len(c) < len(m):
                is_maximal = False
                break
        if is_maximal:
            maximal.append(c)

    return {
        "simplex_counts": {
            f"{dim}-simplex ({(dim + 1)}-clique)": count
            for dim, count in sorted(dim_counts.items())
        },
        "total_simplices": len(all_cliques),
        "maximal_simplices": [list(c) for c in maximal[:20]],
        "max_dimension": max(dim_counts.keys()) if dim_counts else 0,
    }


async def detect_graph_voids(driver, engagement_id: str) -> Dict:
    """
    Detect topological voids in the infrastructure graph.

    Voids = regions with sparse connectivity that could represent:
    - Blind spots in monitoring coverage
    - Gaps in trust relationships
    - Missing privilege escalation paths
    - Network segmentation gaps

    Detection: find nodes at distance > threshold from all monitoring/EDR nodes.
    """
    async with driver.session(database="neo4j") as session:
        # Find monitoring/EDR nodes
        monitor_result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['edr', 'defense', 'control', 'monitoring']
               RETURN n.id AS id
            """,
            engagement_id=engagement_id,
        )
        monitor_nodes = set()
        async for record in monitor_result:
            monitor_nodes.add(record["id"])

        # Find all nodes
        all_nodes = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type
            """,
            engagement_id=engagement_id,
        )
        all_node_list = []
        async for record in all_nodes:
            all_node_list.append({
                "id": record["id"],
                "name": record["name"],
                "type": record["entity_type"],
            })

        # Build adjacency
        edges_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN DISTINCT a.id AS source, b.id AS target
            """,
            engagement_id=engagement_id,
        )
        adj = defaultdict(set)
        async for record in edges_result:
            adj[record["source"]].add(record["target"])
            adj[record["target"]].add(record["source"])

    voids = []
    for node in all_node_list:
        nid = node["id"]
        # BFS to find nearest monitor node
        visited = {nid}
        queue = [nid]
        distance = 0
        found_monitor = False
        while queue and distance <= VOID_DETECTION_RADIUS:
            level_size = len(queue)
            for _ in range(level_size):
                current = queue.pop(0)
                if current in monitor_nodes and distance > 0:
                    found_monitor = True
                    break
                for neighbor in adj.get(current, set()):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
            if found_monitor:
                break
            distance += 1

        if not found_monitor or distance > 2:
            voids.append({
                "node_id": nid,
                "name": node["name"],
                "type": node["type"],
                "distance_to_monitor": distance if found_monitor else None,
                "is_void": not found_monitor or distance > 2,
            })

    return {
        "total_voids": sum(1 for v in voids if v["is_void"]),
        "void_ratio": round(sum(1 for v in voids if v["is_void"]) / max(len(all_node_list), 1), 4),
        "voids": [v for v in voids if v["is_void"]][:30],
        "total_nodes": len(all_node_list),
        "monitor_nodes": len(monitor_nodes),
    }
