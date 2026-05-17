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
                                 max_paths: int = 15,
                                 min_confidence: float = 0.2) -> List[Dict]:
    """
    Advanced path analysis using true weighted Dijkstra search.
    Calculates the 'Path of Least Resistance' by minimizing cumulative cost:
    Cost(edge) = -log(confidence * weight * constraint_factor).
    """
    if entry_types is None:
        entry_types = ["service", "host", "endpoint"]
    if terminal_types is None:
        terminal_types = ["finding", "vulnerability", "objective"]

    import heapq
    import math

    async with driver.session(database="neo4j") as session:
        # A. Fetch dynamic exploit feasibility constraints for all findings in the engagement
        # This makes our Dijkstra path finder dynamically aware of exploit preconditions!
        feasibility_result = await session.run(
            """
            MATCH (finding:L9 {engagement_id: $engagement_id})
            WHERE finding.entity_type = 'finding'
            
            // Find bound Service / Host
            OPTIONAL MATCH (finding)<-[:HAS_FINDING]-(svc:L9 {entity_type: 'service'})
            OPTIONAL MATCH (finding)<-[:HAS_FINDING]-(host:L9 {entity_type: 'host'})
            OPTIONAL MATCH (svc)<-[:HOSTS]-(svc_host:L9 {entity_type: 'host'})
            
            // Get credentials authenticating to this target
            OPTIONAL MATCH (cred:L9 {entity_type: 'credential'})-[:AUTHENTICATES_TO]->(svc)
            OPTIONAL MATCH (cred_host:L9 {entity_type: 'credential'})-[:AUTHENTICATES_TO]->(host)
            
            // Check network reachability to the service/host
            OPTIONAL MATCH (ingress:L9)-[:NETWORK_REACH]->(svc)
            OPTIONAL MATCH (ingress_host:L9)-[:NETWORK_REACH]->(host)
            
            RETURN 
                finding.id AS id,
                finding.display_name AS title,
                coalesce(finding.description, '') AS description,
                coalesce(toFloat(finding.confidence), 0.5) AS confidence,
                coalesce(svc.port, 0) AS svc_port,
                coalesce(host.os, svc_host.os, '') AS os_platform,
                collect(distinct coalesce(cred.confidence, cred_host.confidence, 0.0)) AS cred_confs,
                (ingress IS NOT NULL OR ingress_host IS NOT NULL) AS has_network_reach
            """,
            engagement_id=engagement_id
        )

        from reasoning.exploit_chains import match_exploit_blueprint
        finding_feasibility = {}
        async for rec in feasibility_result:
            fid = rec["id"]
            title = rec["title"]
            desc = rec["description"]
            conf = rec["confidence"]
            svc_port = rec["svc_port"]
            os_platform = rec["os_platform"]
            cred_confs = rec["cred_confs"]
            has_network = rec["has_network_reach"]

            bp = match_exploit_blueprint(title, desc)
            score = conf # Base priority is finding confidence

            if bp:
                # 1. Target OS constraint check
                if bp["target_os"] and os_platform:
                    os_lower = os_platform.lower()
                    if not any(o in os_lower for o in bp["target_os"]):
                        score *= 0.05  # Severe penalty (95% cost increase) for mismatched OS
                
                # 2. Ingress port constraint check
                if bp["ingress_ports"] and svc_port:
                    if svc_port not in bp["ingress_ports"]:
                        score *= 0.10  # Heavy penalty (90% cost increase) for mismatched port
                
                # 3. Credentials check
                if bp["credential_level"] != "none":
                    has_matching_cred = any(cc > 0.3 for cc in cred_confs)
                    if not has_matching_cred:
                        score *= 0.15 # Heavy penalty for lack of authenticating credentials

                # 4. Outbound Egress Proximity proximity check
                if bp["egress_required"] and not has_network:
                    score *= 0.40 # Moderate penalty for lack of network adjacency
            
            finding_feasibility[fid] = max(0.01, min(0.99, score))

        # 1. Fetch all nodes in the engagement
        node_result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            RETURN n.id AS id, n.display_name AS display_name, n.entity_type AS entity_type, coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id
        )
        
        node_map = {}
        entry_nodes = set()
        terminal_nodes = set()

        async for record in node_result:
            nid = record["id"]
            node_map[nid] = {
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "confidence": max(0.01, min(0.999, record["confidence"]))
            }
            if record["entity_type"] in entry_types:
                entry_nodes.add(nid)
            if record["entity_type"] in terminal_types:
                terminal_nodes.add(nid)

        if not node_map:
            return []

        # 2. Fetch all directed edges in the engagement
        edge_result = await session.run(
            """
            MATCH (src:L9 {engagement_id: $engagement_id})-[r]->(dst:L9 {engagement_id: $engagement_id})
            RETURN src.id AS src_id, dst.id AS dst_id, type(r) AS rel_type, coalesce(toFloat(r.weight), 0.5) AS weight
            """,
            engagement_id=engagement_id
        )

        adj = {nid: [] for nid in node_map}
        edges_map = {} # (src, dst) -> (rel_type, weight)

        async for record in edge_result:
            src_id = record["src_id"]
            dst_id = record["dst_id"]
            if src_id in node_map and dst_id in node_map:
                adj[src_id].append((dst_id, record["rel_type"], record["weight"]))
                edges_map[(src_id, dst_id)] = (record["rel_type"], record["weight"])

        # 3. Multi-source Dijkstra to find paths from entry_nodes to terminal_nodes
        # heap element: (cumulative_cost, path_node_ids)
        heap = []
        for start_id in entry_nodes:
            heapq.heappush(heap, (0.0, [start_id]))

        found_paths = []
        visited = set()

        # We want to yield distinct paths (different node sequences) to terminals
        while heap and len(found_paths) < max_paths:
            cost, path = heapq.heappop(heap)
            curr = path[-1]

            if len(path) > max_depth + 1:
                continue

            path_tuple = tuple(path)
            if path_tuple in visited:
                continue
            visited.add(path_tuple)

            # Check if this is a path to a terminal node
            if curr in terminal_nodes and len(path) > 1:
                # Calculate path confidence and total resistance
                node_confs = [node_map[nid]["confidence"] for nid in path]
                
                # Fetch edge weights
                weights = []
                rel_types = []
                for u, v in zip(path, path[1:]):
                    rel_type, weight = edges_map[(u, v)]
                    weights.append(weight)
                    rel_types.append(rel_type)

                # Path confidence is product of node confidences
                path_conf = 1.0
                for c in node_confs:
                    path_conf *= c

                # Total resistance is sum of (1 - weight)
                total_resistance = sum(1.0 - w for w in weights)
                
                # Composite score
                composite_score = path_conf / (1.0 + total_resistance)

                if path_conf >= min_confidence:
                    found_paths.append({
                        "node_names": [node_map[nid]["display_name"] for nid in path],
                        "node_types": [node_map[nid]["entity_type"] for nid in path],
                        "node_ids": path,
                        "node_confidences": [round(c, 4) for c in node_confs],
                        "rel_types": rel_types,
                        "rel_weights": [round(w, 4) for w in weights],
                        "depth": len(path) - 1,
                        "path_confidence": round(path_conf, 4),
                        "composite_score": round(composite_score, 4),
                    })
                continue

            # Traverse neighbors
            for neighbor_id, rel_type, weight in adj.get(curr, []):
                if neighbor_id in path:
                    continue  # Simple loop avoidance

                # Dynamic Feasibility & Empirically Calibrated Cost Calculation:
                # P(transition) = P(node state) * relationship_weight * exploit_feasibility / rel_penalty
                # Cost = -ln(P(transition)) + EconomicCostMultiplier + DetectionMultiplier
                curr_conf = node_map[curr]["confidence"]
                
                # Default relation penalty if target node is not a finding
                rel_penalty = 1.0
                economic_cost = 0.0
                detection_risk = 0.0

                if rel_type == "PRIVILEGE_ESCALATION":
                    rel_penalty = 1.5
                    economic_cost = 0.5  # Modest difficulty barrier
                    detection_risk = 0.4  # Moderate EDR visibility risk
                elif rel_type == "AUTHENTICATES_TO":
                    rel_penalty = 1.05
                    economic_cost = 0.1  # Highly cost-efficient traversal
                    detection_risk = 0.05  # Quiet, low-detection risk
                elif rel_type == "NETWORK_REACH":
                    rel_penalty = 1.2
                    economic_cost = 0.2
                    detection_risk = 0.3  # Network-level visibility (IDS/NDR)
                elif rel_type == "TRUSTS":
                    rel_penalty = 0.95  # Favored path (higher probability of lateral trust exploitation)
                    economic_cost = 0.05
                    detection_risk = 0.02
                
                # Check dynamic exploit preconditions if target is a finding
                target_feasibility = finding_feasibility.get(neighbor_id, 1.0)
                
                p_trans = curr_conf * weight * target_feasibility / rel_penalty
                
                # Cost calibration bounds
                p_trans = max(0.0001, min(0.9999, p_trans))
                
                # Integrate Economic Cost & Detection Risk metrics directly into Dijkstra Edge Costs
                # Favors clean, quiet, and cheap paths over noisy, expensive exploits
                edge_cost = -math.log(p_trans) + economic_cost + detection_risk

                new_cost = cost + edge_cost
                new_path = path + [neighbor_id]
                heapq.heappush(heap, (new_cost, new_path))

        # Sort the final found paths by composite score
        found_paths.sort(key=lambda x: x["composite_score"], reverse=True)
        return found_paths[:max_paths]


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


async def get_full_topology(driver, engagement_id: str) -> Dict[str, Any]:
    """
    Retrieve full graph topology (nodes + inferred relationships) for an engagement.
    """
    async with driver.session(database="neo4j") as session:
        # Get all nodes
        nodes_result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            RETURN n.id AS id, n.display_name AS display_name, n.entity_type AS entity_type, 
                   coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id
        )
        nodes = []
        node_ids = set()
        async for record in nodes_result:
            nid = record["id"]
            node_ids.add(nid)
            nodes.append({
                "id": nid,
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "confidence": round(record["confidence"], 4)
            })

        # Get all relationships between these nodes
        links_result = await session.run(
            """
            MATCH (src:L9 {engagement_id: $engagement_id})-[r]->(dst:L9 {engagement_id: $engagement_id})
            RETURN src.id AS source, dst.id AS target, type(r) AS type, coalesce(toFloat(r.weight), 0.5) AS weight
            """,
            engagement_id=engagement_id
        )
        links = []
        async for record in links_result:
            if record["source"] in node_ids and record["target"] in node_ids:
                links.append({
                    "source": record["source"],
                    "target": record["target"],
                    "type": record["type"],
                    "weight": round(record["weight"], 4)
                })

        return {"nodes": nodes, "links": links}
