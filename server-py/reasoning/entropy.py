"""
Attack Path Entropy Collapse — Measuring attack certainty convergence.

Core question: How "inevitable" is compromise?

Entropy measures uncertainty over the space of attack paths.
As entropy collapses, attack progression becomes more deterministic.

H(G) = -Σ P(p) * log₂(P(p))

Where P(p) is the normalized probability of path p.

Applications:
- Measure how "certain" compromise becomes
- Detect when topology converges on an inevitable path
- Compare infrastructure resilience across snapshots
- Identify when entropy drops warrant immediate attention
"""

import logging
import math
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("lattice9-graph-engine")


async def compute_attack_entropy(driver, engagement_id: str) -> Dict:
    """
    Compute the entropy of the attack path space.

    Returns:
    - entropy: current uncertainty over attack paths (lower = more deterministic)
    - max_entropy: theoretical maximum given path count
    - normalized_entropy: entropy / max_entropy [0, 1]
    - collapse_rate: how fast entropy is dropping
    - dominant_path_count: paths that carry >80% of probability mass
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH path = (entry:L9 {engagement_id: $engagement_id})
                -[:HAS_FINDING|HOSTS|RESOLVES_TO|DEPENDS_ON|NETWORK_REACH|AUTHENTICATES_TO|EXPLOITS*1..6]->(terminal:L9)
            WHERE entry.entity_type IN ['service', 'host', 'endpoint']
              AND terminal.entity_type IN ['finding', 'vulnerability', 'objective']
            RETURN
                [n IN nodes(path) | n.id] AS node_ids,
                length(path) AS depth,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS path_confidence
            ORDER BY path_confidence DESC
            LIMIT 100
            """,
            engagement_id=engagement_id,
        )

        paths = []
        async for record in result:
            paths.append({
                "node_ids": record["node_ids"],
                "depth": record["depth"],
                "confidence": record["path_confidence"],
            })

    if not paths:
        return {
            "entropy": 0.0,
            "max_entropy": 0.0,
            "normalized_entropy": 0.0,
            "dominant_path_count": 0,
            "total_paths": 0,
        }

    # Compute probability distribution over paths
    total_confidence = sum(p["confidence"] for p in paths)
    if total_confidence == 0:
        return {
            "entropy": 0.0,
            "max_entropy": 0.0,
            "normalized_entropy": 0.0,
            "dominant_path_count": 0,
            "total_paths": len(paths),
        }

    probabilities = [p["confidence"] / total_confidence for p in paths]

    # Shannon entropy: H = -Σ p * log₂(p)
    entropy = -sum(p * math.log2(p) for p in probabilities if p > 0)

    # Maximum entropy (uniform distribution)
    n = len(paths)
    max_entropy = math.log2(n) if n > 1 else 0

    # Dominant paths: those carrying >80% of probability mass
    sorted_probs = sorted(probabilities, reverse=True)
    cumulative = 0.0
    dominant_count = 0
    for p in sorted_probs:
        cumulative += p
        dominant_count += 1
        if cumulative >= 0.8:
            break

    # Collapse rate proxy: ratio of dominant to total paths
    collapse_rate = 1.0 - (dominant_count / max(n, 1))

    # Path diversity index
    diversity = 1.0 - (entropy / max_entropy) if max_entropy > 0 else 0.0

    # Identify the single most likely path
    most_likely_path = paths[0] if paths else None
    most_likely_prob = probabilities[0] if probabilities else 0.0

    return {
        "entropy": round(entropy, 4),
        "max_entropy": round(max_entropy, 4),
        "normalized_entropy": round(entropy / max_entropy, 4) if max_entropy > 0 else 0.0,
        "dominant_path_count": dominant_count,
        "dominant_path_ratio": round(dominant_count / max(n, 1), 4),
        "total_paths": n,
        "collapse_rate": round(collapse_rate, 4),
        "diversity_index": round(diversity, 4),
        "most_likely_path": {
            "confidence": most_likely_prob if most_likely_path else 0,
            "depth": most_likely_path["depth"] if most_likely_path else 0,
            "node_ids": most_likely_path["node_ids"][:5] if most_likely_path else [],
        } if most_likely_path else None,
    }


async def compute_privilege_inevitability(driver, engagement_id: str) -> Dict:
    """
    Measure how inevitable privilege escalation is.

    High inevitability = the graph topology forces privilege escalation
    regardless of path choice. The defender cannot prevent it.

    Uses path diversity analysis over privilege edges only.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH path = (start:L9 {engagement_id: $engagement_id})
                -[:AUTHENTICATES_TO|TRUSTS|PRIVILEGE_ESCALATION*1..6]->(target:L9)
            WHERE start.entity_type IN ['credential', 'identity']
              AND target.entity_type IN ['credential', 'identity', 'host']
            RETURN
                [n IN nodes(path) | n.id] AS node_ids,
                length(path) AS depth,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS path_confidence
            ORDER BY path_confidence DESC
            LIMIT 100
            """,
            engagement_id=engagement_id,
        )

        privilege_paths = []
        async for record in result:
            privilege_paths.append({
                "node_ids": record["node_ids"],
                "depth": record["depth"],
                "confidence": record["path_confidence"],
            })

    if not privilege_paths:
        return {"inevitability_score": 0, "total_paths": 0}

    # Inevitability = 1 - entropy of privilege paths
    total_conf = sum(p["confidence"] for p in privilege_paths)
    if total_conf == 0:
        return {"inevitability_score": 0, "total_paths": len(privilege_paths)}

    probs = [p["confidence"] / total_conf for p in privilege_paths]
    n = len(probs)

    # Entropy over privilege paths
    entropy = -sum(p * math.log2(p) for p in probs if p > 0)
    max_entropy = math.log2(n) if n > 1 else 0

    # Inevitability: 1 - normalized entropy
    # 0 = privilege is uncertain (many equally likely paths)
    # 1 = privilege is inevitable (one dominant path)
    inevitability = 1.0 - (entropy / max_entropy) if max_entropy > 0 else 0.0

    return {
        "inevitability_score": round(inevitability, 4),
        "total_privilege_paths": n,
        "entropy": round(entropy, 4),
    }


async def compute_graph_ambiguity(driver, engagement_id: str) -> Dict:
    """
    Measure overall graph ambiguity — how uncertain the analyst should be
    about any claim in the graph.

    High ambiguity = low confidence across the board, many paths,
    uncertain relationships.

    Low ambiguity = high confidence, few clear paths, deterministic.
    """
    async with driver.session(database="neo4j") as session:
        # Average node confidence
        node_result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN avg(coalesce(toFloat(n.confidence), 0.5)) AS avg_confidence,
                      count(n) AS node_count""",
            engagement_id=engagement_id,
        )
        node_stats = await node_result.single()

        # Average edge confidence
        edge_result = await session.run(
            """MATCH ()-[r]->() WHERE EXISTS(r.confidence)
               RETURN avg(coalesce(toFloat(r.confidence), 0.5)) AS avg_edge_confidence,
                      count(r) AS edge_count""",
        )
        edge_stats = await edge_result.single()

    avg_node_conf = float(node_stats["avg_confidence"]) if node_stats and node_stats["avg_confidence"] else 0.5
    avg_edge_conf = float(edge_stats["avg_edge_confidence"]) if edge_stats and edge_stats["avg_edge_confidence"] else 0.5
    node_count = int(node_stats["node_count"]) if node_stats and node_stats["node_count"] else 0
    edge_count = int(edge_stats["edge_count"]) if edge_stats and edge_stats["edge_count"] else 0

    # Ambiguity score: lower confidence = higher ambiguity
    # Combined score weighted by graph size
    confidence_deficit = 1.0 - ((avg_node_conf + avg_edge_conf) / 2.0)

    # Scale ambiguity by graph complexity (more nodes = potentially more ambiguous)
    complexity_factor = min(1.0, math.log2(node_count + 1) / 10.0)
    ambiguity = confidence_deficit * (0.7 + 0.3 * complexity_factor)

    return {
        "ambiguity_score": round(ambiguity, 4),
        "avg_node_confidence": round(avg_node_conf, 4),
        "avg_edge_confidence": round(avg_edge_conf, 4),
        "node_count": node_count,
        "edge_count": edge_count,
        "confidence_deficit": round(confidence_deficit, 4),
    }
