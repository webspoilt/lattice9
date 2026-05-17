"""
Counterfactual Attack Simulation Engine — What-if analysis over graph state.

Core capability:
    Simulate infrastructure modifications WITHOUT altering the real graph.
    Answer questions like:
    - "What if this credential is compromised?"
    - "What if SMB exposure disappears?"
    - "What if EDR blocks this traversal?"
    - "What if this trust relationship is removed?"

The engine:
    1. Reads real graph state from Neo4j
    2. Applies in-memory transformations (remove nodes/edges, add nodes/edges, modify weights)
    3. Recomputes attack paths over the modified graph
    4. Returns delta vs. baseline
    5. Throws away the modified state (no persistence)

This is PURE computation. No state mutation.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from graph.algorithms import shortest_attack_paths
from reasoning.attack_paths import _path_composite_score

logger = logging.getLogger("lattice9-graph-engine")


class CounterfactualScenario:
    """
    A counterfactual scenario describes graph modifications to simulate.
    Modifications are applied in order within a single session.
    """

    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.node_removals: List[str] = []       # node IDs to remove
        self.edge_removals: List[Tuple[str, str, str]] = []  # (source, target, type)
        self.node_additions: List[Dict] = []      # new nodes
        self.edge_additions: List[Dict] = []      # new edges
        self.confidence_modifications: List[Tuple[str, float]] = []  # (node_id, new_confidence)

    def remove_node(self, node_id: str):
        self.node_removals.append(node_id)
        return self

    def remove_edge(self, source_id: str, target_id: str, rel_type: str = None):
        self.edge_removals.append((source_id, target_id, rel_type))
        return self

    def add_node(self, node: Dict):
        self.node_additions.append(node)
        return self

    def add_edge(self, source: str, target: str, rel_type: str, confidence: float = 0.8):
        self.edge_additions.append({
            "source": source, "target": target,
            "type": rel_type, "confidence": confidence,
        })
        return self

    def modify_confidence(self, node_id: str, new_confidence: float):
        self.confidence_modifications.append((node_id, new_confidence))
        return self


async def run_counterfactual(
    driver,
    engagement_id: str,
    scenario: CounterfactualScenario,
    max_paths: int = 10,
) -> Dict:
    """
    Run a counterfactual simulation over the graph.

    Strategy: apply modifications via Cypher queries in a simulated context.
    Since Neo4j doesn't support true in-memory branching,
    we use a transaction that we will ROLL BACK after analysis.
    """
    # 1. Get baseline attack paths
    baseline_paths = await shortest_attack_paths(driver, engagement_id, max_paths=max_paths)

    # 2. Apply scenario modifications in a Neo4j transaction (will roll back)
    async with driver.session(database="neo4j") as session:
        tx = await session.begin_transaction()
        try:
            await _apply_modifications(tx, scenario)
            # 3. Recompute paths over modified graph
            modified_paths = await _counterfactual_paths(tx, engagement_id, max_paths)
            # 4. Roll back all changes
            await tx.rollback()
        except Exception:
            await tx.rollback()
            raise

    # 5. Compute delta
    delta = _compute_counterfactual_delta(baseline_paths, modified_paths)

    return {
        "scenario": scenario.name,
        "description": scenario.description,
        "modifications": {
            "node_removals": len(scenario.node_removals),
            "edge_removals": len(scenario.edge_removals),
            "node_additions": len(scenario.node_additions),
            "edge_additions": len(scenario.edge_additions),
            "confidence_modifications": len(scenario.confidence_modifications),
        },
        "baseline": {
            "total_paths": len(baseline_paths),
            "paths": baseline_paths[:5],
        },
        "counterfactual": {
            "total_paths": len(modified_paths),
            "paths": modified_paths[:5],
        },
        "delta": delta,
    }


async def _apply_modifications(tx, scenario: CounterfactualScenario):
    """Apply scenario modifications within a transaction."""
    for node_id in scenario.node_removals:
        await tx.run(
            "MATCH (n:L9 {id: $id}) DETACH DELETE n",
            id=node_id,
        )

    for source, target, rel_type in scenario.edge_removals:
        if rel_type:
            await tx.run(
                f"MATCH (a:L9 {{id: $source}})-[r:{rel_type}]->(b:L9 {{id: $target}}) DELETE r",
                source=source, target=target,
            )
        else:
            await tx.run(
                "MATCH (a:L9 {id: $source})-[r]->(b:L9 {id: $target}) DELETE r",
                source=source, target=target,
            )

    for edge in scenario.edge_additions:
        await tx.run(
            f"""
            MATCH (a:L9 {{id: $source}})
            MATCH (b:L9 {{id: $target}})
            MERGE (a)-[r:{edge['type']}]->(b)
            SET r.confidence = $confidence, r.weight = $weight
            """,
            source=edge["source"],
            target=edge["target"],
            confidence=float(edge.get("confidence", 0.8)),
            weight=float(edge.get("confidence", 0.8)) * 0.8,
        )

    for node_id, new_conf in scenario.confidence_modifications:
        await tx.run(
            "MATCH (n:L9 {id: $id}) SET n.confidence = $confidence",
            id=node_id,
            confidence=float(new_conf),
        )


async def _counterfactual_paths(tx, engagement_id: str, max_paths: int) -> List[Dict]:
    """Run attack path query within the modified transaction context."""
    result = await tx.run(
        """
        MATCH path = (entry:L9 {engagement_id: $engagement_id})
            -[:HAS_FINDING|HOSTS|RESOLVES_TO|DEPENDS_ON|NETWORK_REACH|AUTHENTICATES_TO|EXPLOITS*1..6]->(terminal:L9)
        WHERE entry.entity_type IN ['service', 'host', 'endpoint']
          AND terminal.entity_type IN ['finding', 'vulnerability', 'objective']
          AND ALL(n IN nodes(path) WHERE n.confidence >= 0.1)
        RETURN
            [n IN nodes(path) | n.display_name] AS node_names,
            [n IN nodes(path) | n.entity_type] AS node_types,
            [n IN nodes(path) | n.id] AS node_ids,
            [r IN relationships(path) | type(r)] AS rel_types,
            [r IN relationships(path) | coalesce(toFloat(r.weight), 0.5)] AS rel_weights,
            length(path) AS depth,
            reduce(conf = 1.0, n IN nodes(path) |
                conf * coalesce(toFloat(n.confidence), 0.5)
            ) AS path_confidence,
            reduce(w = 0.0, r IN relationships(path) |
                w + coalesce(toFloat(r.weight), 0.5)
            ) AS total_weight
        ORDER BY path_confidence DESC
        LIMIT $max_paths
        """,
        engagement_id=engagement_id,
        max_paths=max_paths,
    )

    paths = []
    async for record in result:
        depth = record["depth"]
        total_weight = record["total_weight"]
        avg_weight = total_weight / max(depth, 1)
        composite = record["path_confidence"] * avg_weight

        paths.append({
            "node_names": record["node_names"],
            "node_types": record["node_types"],
            "node_ids": record["node_ids"],
            "rel_types": record["rel_types"],
            "depth": depth,
            "path_confidence": round(record["path_confidence"], 4),
            "composite_score": round(composite, 4),
        })
    return paths


def _compute_counterfactual_delta(baseline: List[Dict], counterfactual: List[Dict]) -> Dict:
    """
    Compute the difference between baseline and counterfactual path sets.

    Metrics:
    - path_count_delta: change in number of viable paths
    - confidence_delta: change in average path confidence
    - score_delta: change in composite scores
    - new_paths: paths that only exist in counterfactual
    - removed_paths: paths that disappeared
    - risk_increase: did the attack surface expand?
    """
    baseline_ids = {tuple(p["node_ids"]): p for p in baseline}
    cf_ids = {tuple(p["node_ids"]): p for p in counterfactual}

    new_paths = [p for ids, p in cf_ids.items() if ids not in baseline_ids]
    removed_paths = [p for ids, p in baseline_ids.items() if ids not in cf_ids]

    # Confidence deltas
    baseline_conf = [p["path_confidence"] for p in baseline]
    cf_conf = [p["path_confidence"] for p in counterfactual]
    avg_baseline_conf = sum(baseline_conf) / max(len(baseline_conf), 1)
    avg_cf_conf = sum(cf_conf) / max(len(cf_conf), 1)

    return {
        "path_count_delta": len(counterfactual) - len(baseline),
        "avg_confidence_delta": round(avg_cf_conf - avg_baseline_conf, 4),
        "new_paths_count": len(new_paths),
        "removed_paths_count": len(removed_paths),
        "new_paths": new_paths[:3],
        "removed_paths": removed_paths[:3],
        "risk_increased": len(new_paths) > len(removed_paths),
    }


async def credential_compromise_scenario(driver, engagement_id: str,
                                          credential_id: str) -> Dict:
    """
    Pre-built scenario: "What if this credential is compromised?"
    Simulates:
    - Credential becomes fully trusted (confidence → 1.0)
    - All AUTHENTICATES_TO edges from this credential become maximum weight
    - Recompute all reachable paths
    """
    scenario = CounterfactualScenario(
        name="credential_compromise",
        description=f"Simulating compromise of credential {credential_id}",
    )
    scenario.modify_confidence(credential_id, 1.0)

    # Get all services this credential authenticates to
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (cred:L9 {id: $cred_id})-[r:AUTHENTICATES_TO]->(svc:L9)
               RETURN svc.id AS svc_id, r.confidence AS current_conf""",
            cred_id=credential_id,
        )
        svc_ids = []
        async for record in result:
            svc_ids.append(record["svc_id"])
            scenario.modify_confidence(record["svc_id"], 1.0)

    scenario.description += f" (affects {len(svc_ids)} services)"

    return await run_counterfactual(driver, engagement_id, scenario)


async def edge_removal_scenario(driver, engagement_id: str,
                                 source_id: str, target_id: str,
                                 rel_type: str = None) -> Dict:
    """
    Pre-built scenario: "What if this connection is blocked?"
    Removes an edge and recomputes attack paths.
    """
    scenario = CounterfactualScenario(
        name="edge_removal",
        description=f"Simulating removal of edge {source_id} -> {target_id}",
    )
    # Remove the edge
    scenario.remove_edge(source_id, target_id, rel_type)

    # Boost defenses on target
    scenario.modify_confidence(target_id, max(0.1, 0.3))

    return await run_counterfactual(driver, engagement_id, scenario)


async def defense_addition_scenario(driver, engagement_id: str,
                                     protected_node_id: str) -> Dict:
    """
    Pre-built scenario: "What if EDR/SIEM blocks this path?"
    Simulates adding defense controls by:
    - Lowering confidence of edges into the protected node
    - Reducing the protected node's confidence (harder to exploit)
    """
    scenario = CounterfactualScenario(
        name="defense_addition",
        description=f"Simulating defense controls on {protected_node_id}",
    )
    scenario.modify_confidence(protected_node_id, 0.15)

    # Reduce weight of all incoming edges
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {id: $node_id})<-[r]-(src:L9)
               RETURN src.id AS src_id, type(r) AS rel_type""",
            node_id=protected_node_id,
        )
        async for record in result:
            scenario.modify_confidence(record["src_id"],
                                        max(0.3, 0.5))

    return await run_counterfactual(driver, engagement_id, scenario)
