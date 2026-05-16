"""
Contextual Prioritization — Scoring findings and attack paths by operational relevance.

Scoring systems:
- Environmental relevance
- Attack-chain-based prioritization
- Blast-radius-aware scoring
- Infrastructure relevance
- Entropy-based ranking (low entropy = high certainty = high priority)
"""

import logging
import math
from typing import List, Dict, Any, Optional
from graph.confidence import bayesian_update
from graph.algorithms import blast_radius_analysis, centrality_analysis

logger = logging.getLogger("lattice9-graph-engine")


async def prioritize_findings(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Rank findings by operational priority.
    Combines multiple signals into a single priority score.

    priority = confidence * severity_weight * environmental_relevance * blast_radius_factor
    """
    async with pg_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT f.id, f.title, f.severity, f.confidence,
                   f.validation_state, f.cwe, f.affected_entity_id,
                   f.environmental_relevance, f.first_seen_at, f.last_seen_at
            FROM findings f
            WHERE f.engagement_id = $1
            ORDER BY f.severity DESC
            """,
            engagement_id,
        )

    severity_weights = {
        "critical": 1.0, "high": 0.8, "medium": 0.5, "low": 0.3, "info": 0.1,
    }

    prioritized = []
    for row in rows:
        severity_w = severity_weights.get(row["severity"], 0.5)
        confidence = float(row["confidence"]) if row["confidence"] else 0.5
        env_relevance = float(row["environmental_relevance"]) if row["environmental_relevance"] else 0.5

        # Base priority
        priority = confidence * severity_w * env_relevance

        # Boost for validated findings
        if row["validation_state"] == "validated":
            priority *= 1.3
        elif row["validation_state"] == "candidate":
            priority *= 1.0
        elif row["validation_state"] == "contradicted":
            priority *= 0.2

        # Blast radius boost
        blast_score = 0.5
        if row["affected_entity_id"]:
            try:
                blast = await blast_radius_analysis(driver, engagement_id, row["affected_entity_id"], max_depth=2)
                blast_score = blast.get("total_exposure_score", 0.5)
            except Exception:
                pass
        priority *= (0.7 + 0.3 * blast_score)

        # Entropy: lower entropy = higher information content
        entropy = _compute_finding_entropy(confidence, severity_w)
        priority *= (1.0 - entropy * 0.2)

        prioritized.append({
            "id": row["id"],
            "title": row["title"],
            "severity": row["severity"],
            "confidence": round(confidence, 4),
            "priority_score": round(min(1.0, priority), 4),
            "environmental_relevance": round(env_relevance, 4),
            "blast_radius_factor": round(blast_score, 4),
            "entropy": round(entropy, 4),
            "validation_state": row["validation_state"],
            "affected_entity_id": row["affected_entity_id"],
        })

    return sorted(prioritized, key=lambda f: f["priority_score"], reverse=True)


async def prioritize_attack_paths(driver, pg_pool, engagement_id: str,
                                   paths: List[Dict]) -> List[Dict]:
    """
    Rank attack paths by operational priority.
    Extends base path scoring with environmental context.
    """
    # Get current findings and their priorities
    finding_priorities = await prioritize_findings(driver, pg_pool, engagement_id)
    finding_map = {f["id"]: f for f in finding_priorities}

    for path in paths:
        path_score = path.get("composite_score", 0.5)

        # Boost paths that end at high-priority findings
        terminal_ids = path.get("node_ids", [])
        for tid in terminal_ids:
            if tid in finding_map:
                path_score *= (1.0 + finding_map[tid]["priority_score"] * 0.3)

        path["operational_priority"] = round(min(1.0, path_score), 4)

    return sorted(paths, key=lambda p: p.get("operational_priority", 0), reverse=True)


def _compute_finding_entropy(confidence: float, severity_weight: float) -> float:
    """
    Compute information entropy of a finding.
    Low entropy = high certainty = higher priority.

    H = -p * log2(p) - (1-p) * log2(1-p)
    where p = confidence * severity_weight
    """
    p = max(0.01, min(0.99, confidence * severity_weight))
    entropy = -p * math.log2(p) - (1 - p) * math.log2(1 - p)
    return round(entropy / math.log2(2), 4)  # Normalized to [0, 1]
