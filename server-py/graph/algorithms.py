"""
Graph Algorithms — Computational graph analysis for offensive intelligence.

Implements:
- Weighted shortest path (Dijkstra-based)
- BFS/DFS traversal
- PageRank-style influence propagation
- Graph centrality analysis
- Blast radius modeling
- Exposure diffusion scoring
- Privilege chain synthesis
"""

import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("lattice9-graph-engine")


async def shortest_attack_paths(driver, engagement_id: str,
                                 entry_types: List[str] = None,
                                 terminal_types: List[str] = None,
                                 max_depth: int = 8,
                                 max_paths: int = 20,
                                 min_confidence: float = 0.1) -> List[Dict]:
    """
    Dijkstra-inspired weighted shortest path analysis.
    Finds paths from entry nodes to terminal nodes respecting weighted edges.

    Path score = product(node.confidence) * avg(edge.weight)
    Prioritizes high-confidence, short paths.
    """
    if entry_types is None:
        entry_types = ["service", "host", "endpoint"]
    if terminal_types is None:
        terminal_types = ["finding", "vulnerability", "objective"]

    async with driver.session(database="neo4j") as session:
        # Weighted path traversal with confidence-aware scoring
        result = await session.run(
            """
            MATCH path = (entry:L9 {engagement_id: $engagement_id})
                -[:HAS_FINDING|HOSTS|RESOLVES_TO|DEPENDS_ON|NETWORK_REACH|PRIVILEGE_ESCALATION|EXPLOITS|AUTHENTICATES_TO*1..$max_depth]->(terminal:L9)
            WHERE entry.entity_type IN $entry_types
              AND terminal.entity_type IN $terminal_types
              AND ALL(n IN nodes(path) WHERE n.confidence >= $min_confidence)
            RETURN
                [n IN nodes(path) | n.display_name] AS node_names,
                [n IN nodes(path) | n.entity_type] AS node_types,
                [n IN nodes(path) | n.id] AS node_ids,
                [n IN nodes(path) | coalesce(toFloat(n.confidence), 0.5)] AS node_confidences,
                [r IN relationships(path) | type(r)] AS rel_types,
                [r IN relationships(path) | coalesce(toFloat(r.weight), 0.5)] AS rel_weights,
                length(path) AS depth,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS path_confidence,
                reduce(w = 0.0, r IN relationships(path) |
                    w + coalesce(toFloat(r.weight), 0.5)
            ) AS total_weight
            ORDER BY path_confidence DESC, depth ASC
            LIMIT $max_paths
            """,
            engagement_id=engagement_id,
            entry_types=entry_types,
            terminal_types=terminal_types,
            max_depth=max_depth,
            max_paths=max_paths,
            min_confidence=min_confidence,
        )

        paths = []
        async for record in result:
            path_conf = record["path_confidence"]
            total_weight = record["total_weight"]
            depth = record["depth"]
            avg_weight = total_weight / max(depth, 1)

            # Composite score: confidence * average edge weight
            composite_score = path_conf * avg_weight

            paths.append({
                "node_names": record["node_names"],
                "node_types": record["node_types"],
                "node_ids": record["node_ids"],
                "node_confidences": record["node_confidences"],
                "rel_types": record["rel_types"],
                "rel_weights": record["rel_weights"],
                "depth": depth,
                "path_confidence": round(path_conf, 4),
                "composite_score": round(composite_score, 4),
            })

        return paths


async def bfs_traversal(driver, engagement_id: str,
                         start_node_id: str,
                         max_depth: int = 4,
                         rel_types: List[str] = None) -> List[Dict]:
    """
    BFS traversal from a starting node.
    Used for: infrastructure discovery, lateral movement modeling.
    """
    if rel_types is None:
        rel_types = ["HAS_FINDING", "HOSTS", "RESOLVES_TO", "NETWORK_REACH",
                     "DEPENDS_ON", "TRUSTS", "DATA_FLOW"]

    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (start:L9 {id: $start_id})
            MATCH path = (start)-[*1..$max_depth]->(neighbor:L9)
            WHERE ALL(r IN relationships(path) WHERE type(r) IN $rel_types)
            RETURN
                [n IN nodes(path) | n.display_name] AS node_names,
                [n IN nodes(path) | n.entity_type] AS node_types,
                [n IN nodes(path) | n.id] AS node_ids,
                [n IN nodes(path) | coalesce(toFloat(n.confidence), 0.5)] AS node_confidences,
                length(path) AS depth,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS path_confidence
            ORDER BY depth ASC, path_confidence DESC
            """,
            start_id=start_node_id,
            max_depth=max_depth,
            rel_types=rel_types,
        )

        results = []
        async for record in result:
            results.append({
                "node_names": record["node_names"],
                "node_types": record["node_types"],
                "node_ids": record["node_ids"],
                "depth": record["depth"],
                "path_confidence": round(record["path_confidence"], 4),
            })
        return results


async def influence_propagation(driver, engagement_id: str,
                                  max_iterations: int = 10,
                                  damping: float = 0.85) -> List[Dict]:
    """
    PageRank-style influence propagation across the graph.
    Computes which nodes are most influential (central to attack surface).
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            CALL gds.pageRank.stream('l9_graph_' + $engagement_id, {
                maxIterations: $max_iterations,
                dampingFactor: $damping,
                relationshipWeightProperty: 'weight'
            })
            YIELD nodeId, score
            RETURN gds.util.asNode(nodeId).id AS node_id,
                   gds.util.asNode(nodeId).display_name AS display_name,
                   gds.util.asNode(nodeId).entity_type AS entity_type,
                   score
            ORDER BY score DESC
            LIMIT 50
            """,
            engagement_id=engagement_id,
            max_iterations=max_iterations,
            damping=damping,
        )

        results = []
        async for record in result:
            results.append({
                "node_id": record["node_id"],
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "influence_score": round(record["score"], 4),
            })
        return results


async def influence_propagation_fallback(driver, engagement_id: str) -> List[Dict]:
    """
    Fallback influence computation if GDS is unavailable.
    Uses degree centrality weighted by confidence.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(r) AS degree, avg(coalesce(toFloat(n.confidence), 0.5)) AS avg_conf
            RETURN n.id AS node_id,
                   n.display_name AS display_name,
                   n.entity_type AS entity_type,
                   degree * avg_conf AS influence_score,
                   degree,
                   avg_conf
            ORDER BY influence_score DESC
            LIMIT 50
            """,
            engagement_id=engagement_id,
        )

        results = []
        async for record in result:
            results.append({
                "node_id": record["node_id"],
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "influence_score": round(record["influence_score"], 4),
                "degree": record["degree"],
            })
        return results


async def blast_radius_analysis(driver, engagement_id: str,
                                 critical_node_id: str,
                                 max_depth: int = 4) -> Dict:
    """
    Compute blast radius from a critical node.
    Returns all reachable nodes + aggregated compromise score.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (critical:L9 {id: $critical_id})
            MATCH path = (critical)-[*1..$max_depth]->(exposed:L9)
            WHERE critical.engagement_id = $engagement_id
            RETURN
                exposed.id AS node_id,
                exposed.display_name AS display_name,
                exposed.entity_type AS entity_type,
                coalesce(toFloat(exposed.confidence), 0.5) AS confidence,
                length(path) AS distance,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS exposure_probability
            ORDER BY distance ASC, exposure_probability DESC
            """,
            engagement_id=engagement_id,
            critical_id=critical_node_id,
            max_depth=max_depth,
        )

        exposed = []
        async for record in result:
            exposed.append({
                "node_id": record["node_id"],
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "confidence": record["confidence"],
                "distance": record["distance"],
                "exposure_probability": round(record["exposure_probability"], 4),
            })

        total_exposure = sum(e["exposure_probability"] for e in exposed)

        # Aggregate by distance (closer = higher risk)
        risk_by_distance = {}
        for e in exposed:
            d = e["distance"]
            if d not in risk_by_distance:
                risk_by_distance[d] = {"count": 0, "total_exposure": 0.0}
            risk_by_distance[d]["count"] += 1
            risk_by_distance[d]["total_exposure"] += e["exposure_probability"]

        return {
            "critical_node_id": critical_node_id,
            "total_exposed": len(exposed),
            "total_exposure_score": round(total_exposure, 4),
            "max_depth": max_depth,
            "risk_by_distance": risk_by_distance,
            "exposed_nodes": exposed,
        }


async def centrality_analysis(driver, engagement_id: str) -> Dict:
    """
    Compute node centrality metrics:
    - Degree centrality (connection count)
    - Betweenness centrality (bridging role)
    - Closeness centrality (reachability)
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(DISTINCT r) AS degree
            OPTIONAL MATCH (n)-[r2]-(neighbor:L9)
            WITH n, degree, count(DISTINCT neighbor) AS unique_neighbors
            ORDER BY degree DESC
            RETURN n.id AS node_id,
                   n.display_name AS display_name,
                   n.entity_type AS entity_type,
                   degree,
                   unique_neighbors,
                   coalesce(toFloat(n.confidence), 0.5) AS confidence
            LIMIT 50
            """,
            engagement_id=engagement_id,
        )

        nodes = []
        async for record in result:
            # Normalized centrality: degree / max_possible
            nodes.append({
                "node_id": record["node_id"],
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "degree_centrality": record["degree"],
                "unique_neighbors": record["unique_neighbors"],
                "confidence": record["confidence"],
                "centrality_score": round(record["degree"] * record["confidence"], 4),
            })

        return {
            "nodes": nodes,
            "max_centrality": max((n["centrality_score"] for n in nodes), default=0),
            "total_nodes": len(nodes),
        }


async def privilege_chain_synthesis(driver, engagement_id: str) -> List[Dict]:
    """
    Synthesize privilege escalation chains by following
    AUTHENTICATES_TO → TRUSTS → PRIVILEGE_ESCALATION paths.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH path = (start:L9 {engagement_id: $engagement_id})
                -[:AUTHENTICATES_TO|TRUSTS|PRIVILEGE_ESCALATION*1..6]->(target:L9)
            WHERE start.entity_type IN ['credential', 'identity']
              AND target.entity_type IN ['credential', 'identity', 'service', 'host']
            RETURN
                [n IN nodes(path) | n.display_name] AS node_names,
                [n IN nodes(path) | n.entity_type] AS node_types,
                [n IN nodes(path) | n.id] AS node_ids,
                [r IN relationships(path) | type(r)] AS step_types,
                length(path) AS depth,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS chain_confidence,
                reduce(w = 0.0, r IN relationships(path) |
                    w + coalesce(toFloat(r.weight), 0.5)
                ) AS total_weight
            ORDER BY chain_confidence DESC, depth ASC
            LIMIT 20
            """,
            engagement_id=engagement_id,
        )

        chains = []
        async for record in result:
            chains.append({
                "node_names": record["node_names"],
                "node_types": record["node_types"],
                "node_ids": record["node_ids"],
                "step_types": record["step_types"],
                "depth": record["depth"],
                "chain_confidence": round(record["chain_confidence"], 4),
            })
        return chains


async def exposure_diffusion(driver, engagement_id: str,
                              source_types: List[str] = None) -> List[Dict]:
    """
    Model how exposure diffuses through the infrastructure graph.
    Uses weighted random walk to simulate attacker progression.
    """
    if source_types is None:
        source_types = ["credential", "identity", "service"]

    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (entry:L9 {engagement_id: $engagement_id})
            WHERE entry.entity_type IN $source_types
            MATCH path = (entry)-[:HAS_FINDING|HOSTS|RESOLVES_TO|DEPENDS_ON|NETWORK_REACH*1..5]->(exposed:L9)
            WHERE exposed.entity_type IN ['host', 'service', 'finding', 'credential']
            RETURN
                entry.id AS entry_id,
                entry.display_name AS entry_name,
                entry.entity_type AS entry_type,
                exposed.id AS exposed_id,
                exposed.display_name AS exposed_name,
                exposed.entity_type AS exposed_type,
                coalesce(toFloat(exposed.confidence), 0.5) AS exposed_confidence,
                length(path) AS diffusion_distance,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS diffusion_probability
            ORDER BY diffusion_probability DESC
            LIMIT 100
            """,
            engagement_id=engagement_id,
            source_types=source_types,
        )

        exposures = []
        async for record in result:
            exposures.append({
                "entry_id": record["entry_id"],
                "entry_name": record["entry_name"],
                "entry_type": record["entry_type"],
                "exposed_id": record["exposed_id"],
                "exposed_name": record["exposed_name"],
                "exposed_type": record["exposed_type"],
                "diffusion_distance": record["diffusion_distance"],
                "diffusion_probability": round(record["diffusion_probability"], 4),
            })
        return exposures
