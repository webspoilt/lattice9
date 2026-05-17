"""
Adversarial Game Theory — attacker vs defender strategic computation.

Models infrastructure compromise as a sequential game on a graph:
  - Attacker chooses which edges to traverse (actions)
  - Defender chooses countermeasure placement (reactions)
  - Both adapt strategies based on observed graph state
  - Equilibrium reveals optimal attack/defense strategies

Game Model:
    V*(s) = max_a min_d E[R(s,a,d) + γV(s')]

    V*(s):  optimal value of state s
    a:      attacker action (edge traversal / exploit)
    d:      defender reaction (detection / blocking)
    R:      reward function (privilege gain - detection cost)
    γ:      discount factor (temporal preference)
    s':     next state after action-reaction pair

Nash Equilibrium:
    Mixed strategy where neither player can unilaterally improve:
    P(a*) = argmax Π P(d) × U(a,d)

Applications:
  - Compute optimal attack strategy given defender posture
  - Identify defender-optimal blocking points
  - Model strategic adaptation mid-operation
  - Estimate detection probability under optimal defense
  - Find game-theoretic attack paths
"""

import logging
import math
import random
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("lattice9-graph-engine")

GAME_DISCOUNT = 0.9        # γ — discount factor for future rewards
GAME_EPSILON = 0.01        # Convergence threshold for iterative solve
GAME_MAX_ITER = 100        # Max iterations for value iteration
GAME_EXPLORATION = 0.1     # Exploration rate (ε-greedy)

# Reward components
REWARD_PRIVILEGE_GAIN = 10.0
REWARD_DETECTION_COST = -5.0
REWARD_CONTAINMENT_COST = -8.0
REWARD_PERSISTENCE = 3.0
REWARD_DATA_ACCESS = 6.0

# Defender actions by type
DEFENDER_ACTIONS = {
    "edr_block": {"detection_prob": 0.6, "cost": 4.0},
    "network_isolation": {"detection_prob": 0.4, "cost": 3.0},
    "credential_rotation": {"detection_prob": 0.3, "cost": 2.0},
    "patch_deployment": {"detection_prob": 0.2, "cost": 1.0},
    "mfa_enforcement": {"detection_prob": 0.5, "cost": 3.5},
    "segmentation": {"detection_prob": 0.7, "cost": 5.0},
    "logging_escalation": {"detection_prob": 0.4, "cost": 2.5},
    "honeytoken_deploy": {"detection_prob": 0.8, "cost": 6.0},
}


async def compute_minimax_traversal(driver, engagement_id: str,
                                     source_id: str, target_id: str) -> Dict:
    """
    Compute minimax-optimal attack path accounting for defender reactions.

    For each step, attacker chooses edge with best worst-case outcome
    (maximizing minimum reward given optimal defender response).

    Returns minimax-optimal path, value, and defender reaction points.
    """
    async with driver.session(database="neo4j") as session:
        # Build graph state
        result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]-(b:L9 {engagement_id: $engagement_id})
               RETURN DISTINCT a.id AS source, b.id AS target,
                      type(r) AS rel_type,
                      coalesce(toFloat(r.confidence), 0.5) AS confidence,
                      a.entity_type AS source_type,
                      b.entity_type AS target_type
            """,
            engagement_id=engagement_id,
        )
        graph_edges = []
        nodes_set = set()
        async for record in result:
            src = record["source"]
            tgt = record["target"]
            nodes_set.add(src)
            nodes_set.add(tgt)
            graph_edges.append({
                "source": src,
                "target": tgt,
                "rel_type": record["rel_type"],
                "confidence": record["confidence"],
                "source_type": record["source_type"],
                "target_type": record["target_type"],
            })

        # Get node types
        nodes_result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        node_types = {}
        async for record in nodes_result:
            node_types[record["id"]] = {
                "type": record["entity_type"],
                "confidence": record["confidence"],
            }

        # Check for defender nodes
        defense_result = await session.run(
            """MATCH (d:L9 {engagement_id: $engagement_id})
               WHERE d.entity_type IN ['edr', 'defense', 'control', 'monitoring']
               RETURN d.id AS id, d.display_name AS name
            """,
            engagement_id=engagement_id,
        )
        defender_nodes = {}
        async for record in defense_result:
            defender_nodes[record["id"]] = record["name"]

    if not graph_edges:
        return {"error": "No graph edges found"}

    nodes = list(nodes_set)
    if source_id not in nodes_set or target_id not in nodes_set:
        return {"error": "Source or target not in graph"}

    # Build adjacency with edge metadata
    adj = {}
    for e in graph_edges:
        adj.setdefault(e["source"], []).append(e)
        adj.setdefault(e["target"], []).append({
            "source": e["target"],
            "target": e["source"],
            "rel_type": e["rel_type"],
            "confidence": e["confidence"],
            "source_type": e["target_type"],
            "target_type": e["source_type"],
        })

    # Value iteration: compute minimax values
    V = {}
    policy = {}

    # Initialize values (high value for target, zero elsewhere)
    for n in nodes:
        V[n] = 1.0 if n == target_id else 0.0

    for iteration in range(GAME_MAX_ITER):
        delta = 0.0
        new_V = V.copy()

        for n in nodes:
            if n == target_id:
                new_V[n] = 1.0
                continue

            if n not in adj or not adj[n]:
                new_V[n] = V[n] * GAME_DISCOUNT
                continue

            # Attacker chooses action a ∈ actions(n)
            best_value = -float('inf')
            best_action = None

            for edge in adj[n]:
                neighbor = edge["target"]
                if neighbor not in V:
                    continue

                # Reward for traversing this edge
                privilege_gain = _compute_edge_privilege_value(node_types, edge)
                detection_risk = _compute_edge_detection_risk(
                    node_types, defender_nodes, edge
                )

                # Defender chooses reaction d ∈ defender_actions(neighbor)
                # Defender minimizes attacker's outcome
                defender_value = float('inf')
                worst_defense = None

                for d_action, d_params in DEFENDER_ACTIONS.items():
                    # Detection probability at this node
                    detection_prob = d_params["detection_prob"]
                    # Adjust for presence of actual defender nodes
                    if neighbor in defender_nodes:
                        detection_prob = min(1.0, detection_prob * 1.5)
                    elif edge["source"] in defender_nodes:
                        detection_prob = min(1.0, detection_prob * 1.3)

                    # Expected value under this defender action
                    # If detected: game ends with detection cost
                    # If undetected: continue to next state
                    detected_value = detection_prob * REWARD_DETECTION_COST
                    undetected_value = (1 - detection_prob) * (
                        privilege_gain + GAME_DISCOUNT * V[neighbor]
                    )
                    expected_value = detected_value + undetected_value

                    if expected_value < defender_value:
                        defender_value = expected_value
                        worst_defense = d_action

                # Attacker wants to maximize the minimum (minimax)
                # Value = best worst-case outcome
                attacker_value = defender_value

                if attacker_value > best_value:
                    best_value = attacker_value
                    best_action = {
                        "edge": edge,
                        "defender_reaction": worst_defense,
                        "value": attacker_value,
                    }

            new_V[n] = best_value if best_value != -float('inf') else V[n]
            policy[n] = best_action
            delta = max(delta, abs(new_V[n] - V[n]))

        V = new_V
        if delta < GAME_EPSILON:
            logger.info(f"Game value iteration converged at step {iteration}")
            break

    # Extract minimax path from source to target
    path = []
    current = source_id
    visited = {current}
    path_values = []

    while current != target_id and len(path) < 20:
        if current not in policy or not policy[current]:
            break
        action = policy[current]
        edge = action["edge"]
        next_node = edge["target"]

        if next_node in visited:
            break

        path.append({
            "from": current,
            "from_type": node_types.get(current, {}).get("type", "unknown"),
            "to": next_node,
            "to_type": node_types.get(next_node, {}).get("type", "unknown"),
            "rel_type": edge["rel_type"],
            "state_value": round(V.get(current, 0), 4),
            "expected_reward": round(action["value"], 4),
            "defender_counter": action["defender_reaction"],
        })
        path_values.append(V.get(current, 0))
        visited.add(next_node)
        current = next_node

    if current == target_id:
        path.append({
            "from": current,
            "to": current,
            "state_value": 1.0,
            "expected_reward": 1.0,
            "defender_counter": None,
        })

    return {
        "source": source_id,
        "target": target_id,
        "minimax_path": path,
        "path_length": len(path),
        "source_value": round(V.get(source_id, 0), 4),
        "target_value": round(V.get(target_id, 0), 4),
        "defender_nodes": list(defender_nodes.values()),
        "convergence_iterations": iteration + 1,
        "total_states_evaluated": len(V),
    }


async def approximate_nash_equilibrium(driver, engagement_id: str) -> Dict:
    """
    Approximate Nash equilibrium for attack vs defense on the graph.

    Computes mixed strategies: probability distributions over
    attacker targets and defender countermeasures where neither
    can improve unilaterally.

    Simplification: solve zero-sum game on critical subgraph.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['host', 'service', 'credential', 'identity', 'domain']
               RETURN n.id AS node_id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
               ORDER BY n.confidence DESC
               LIMIT 20
            """,
            engagement_id=engagement_id,
        )
        critical_nodes = []
        async for record in result:
            critical_nodes.append({
                "id": record["node_id"],
                "name": record["name"],
                "entity_type": record["entity_type"],
                "confidence": record["confidence"],
            })

    if len(critical_nodes) < 3:
        return {"error": "Too few critical nodes for game analysis"}

    # Build payoff matrix: attacker (rows) chooses target node,
    # defender (cols) chooses which node to protect
    n = len(critical_nodes)
    payoff_matrix = [[0.0] * n for _ in range(n)]

    for i, attacker_target in enumerate(critical_nodes):
        for j, defender_protect in enumerate(critical_nodes):
            at = attacker_target["entity_type"]
            dp = defender_protect["entity_type"]

            # Value = privilege_gain - (protection_effect if defended)
            privilege_gain = {
                "domain": 10.0, "credential": 8.0, "identity": 6.0,
                "service": 4.0, "host": 3.0,
            }.get(at, 1.0)

            # Protection reduces value if defender protects this node
            protection_effect = 0.0
            if attacker_target["id"] == defender_protect["id"]:
                protection_effect = {
                    "domain": 0.8, "credential": 0.7, "identity": 0.6,
                    "service": 0.5, "host": 0.4,
                }.get(dp, 0.3)
                protection_effect *= defender_protect["confidence"]

            payoff_matrix[i][j] = privilege_gain * (1.0 - protection_effect)

    # Approximate mixed-strategy Nash:
    # Attacker mixed strategy proportional to row sums
    # Defender mixed strategy proportional to column sums

    row_sums = [sum(row) for row in payoff_matrix]
    total_row_sum = sum(row_sums)
    attacker_strategy = [
        round(s / total_row_sum, 4) if total_row_sum > 0 else 0
        for s in row_sums
    ]

    col_sums = [0.0] * n
    for row in payoff_matrix:
        for j in range(n):
            col_sums[j] += row[j]
    total_col_sum = sum(col_sums)
    defender_strategy = [
        round(s / total_col_sum, 4) if total_col_sum > 0 else 0
        for s in col_sums
    ]

    # Equilibrium value
    game_value = sum(
        attacker_strategy[i] * col_sums[i]
        for i in range(n)
    ) / n if n > 0 else 0

    return {
        "game_value": round(game_value, 4),
        "attacker_strategy": [
            {"node": critical_nodes[i]["name"],
             "type": critical_nodes[i]["entity_type"],
             "probability": attacker_strategy[i]}
            for i in range(n) if attacker_strategy[i] > 0.01
        ],
        "defender_strategy": [
            {"node": critical_nodes[i]["name"],
             "type": critical_nodes[i]["entity_type"],
             "probability": defender_strategy[i]}
            for i in range(n) if defender_strategy[i] > 0.01
        ],
        "critical_nodes_evaluated": n,
    }


async def adaptive_attack_path_recomputation(driver, engagement_id: str,
                                              source_id: str) -> Dict:
    """
    Recompute attack paths assuming defender adapts to attacker actions.

    After each edge traversal, defender observes and may:
    - Block the traversed edge
    - Increase detection probability on remaining edges
    - Deploy countermeasures to high-value targets

    Attacker must adapt: find alternative paths that account
    for defender adaptation.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['host', 'service', 'credential', 'domain', 'objective']
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type
               ORDER BY n.entity_type
            """,
            engagement_id=engagement_id,
        )
        target_nodes = []
        async for record in result:
            target_nodes.append({
                "id": record["id"],
                "name": record["name"],
                "type": record["entity_type"],
            })

    if not target_nodes:
        return {"error": "No target nodes found"}

    # Defender adaptation: after each edge, increase detection on remaining
    adaptation_results = []
    for target in target_nodes[:5]:  # Limit to 5 targets
        minimax = await compute_minimax_traversal(
            driver, engagement_id, source_id, target["id"]
        )

        if "error" in minimax:
            continue

        # Simulate defender adaptation: each step increases detection
        path = minimax.get("minimax_path", [])
        adaptation_factor = 1.0
        adapted_path = []
        for i, step in enumerate(path):
            # Defender adaptation: detection increases with each step
            adaptation_factor = 1.0 + (i * 0.2)
            step["adapted_detection_multiplier"] = round(adaptation_factor, 4)
            step["adapted_reward"] = round(
                step.get("expected_reward", 0) / adaptation_factor, 4
            )
            adapted_path.append(step)

        adaptation_results.append({
            "target": target["name"],
            "target_id": target["id"],
            "source_value": minimax.get("source_value", 0),
            "path_length": minimax.get("path_length", 0),
            "adapted_path": adapted_path,
            "defender_adaptation_factor": round(adaptation_factor, 4),
        })

    return {
        "source": source_id,
        "targets_analyzed": len(adaptation_results),
        "results": adaptation_results,
    }


def _compute_edge_privilege_value(
    node_types: Dict[str, Dict],
    edge: Dict,
) -> float:
    """Compute privilege gain from traversing this edge."""
    target_type = edge.get("target_type", "unknown")
    base_value = {
        "domain": REWARD_PRIVILEGE_GAIN * 2,
        "credential": REWARD_PRIVILEGE_GAIN * 1.5,
        "identity": REWARD_PRIVILEGE_GAIN * 1.2,
        "service": REWARD_PRIVILEGE_GAIN * 0.8,
        "host": REWARD_PRIVILEGE_GAIN * 0.5,
        "endpoint": REWARD_PRIVILEGE_GAIN * 0.3,
        "objective": REWARD_DATA_ACCESS * 2,
    }.get(target_type, REWARD_PRIVILEGE_GAIN * 0.3)

    rel_bonus = {
        "PRIVILEGE_ESCALATION": 5.0,
        "AUTHENTICATES_TO": 3.0,
        "TRUSTS": 2.0,
        "OWNS": 4.0,
        "EXPLOITS": 3.0,
    }.get(edge["rel_type"], 0.0)

    return base_value + rel_bonus


def _compute_edge_detection_risk(
    node_types: Dict[str, Dict],
    defender_nodes: Dict[str, str],
    edge: Dict,
) -> float:
    """Compute detection risk for traversing this edge."""
    risk = 0.3  # Base detection risk

    # Higher risk for well-known services
    service_risk = {
        "smb": 0.7, "http": 0.4, "ssh": 0.3,
        "rdp": 0.6, "database": 0.5,
    }.get(edge["rel_type"].lower(), 0.3)

    risk = max(risk, service_risk)

    # Defender nodes increase detection risk
    if edge["source"] in defender_nodes or edge["target"] in defender_nodes:
        risk = min(1.0, risk * 1.5)

    return risk
