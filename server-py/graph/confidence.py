"""
Bayesian Confidence Propagation — Probabilistic reasoning over the attack graph.

Core equation for evidence-weighted confidence:

    P(H|E) = P(H) * P(E|H) / P(E)

    Where:
    - P(H) = prior confidence of a node/relationship
    - P(E|H) = likelihood of evidence given the hypothesis
    - P(E) = marginal probability of the evidence
    - P(H|E) = posterior confidence after evidence incorporation

Systems:
- Node confidence updates based on neighbor evidence
- Path confidence via product rule
- Evidence weight decay over time (temporal discount)
- Multi-source evidence fusion
- False-positive likelihood adjustment
"""

import logging
import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger("lattice9-graph-engine")

# Default confidence decay half-life in days
CONFIDENCE_HALF_LIFE_DAYS = 30
# Minimum confidence floor
CONFIDENCE_FLOOR = 0.05
# Evidence weight for different source types
EVIDENCE_WEIGHTS = {
    "manual_validation": 0.95,
    "exploit_proof": 0.90,
    "tool_output": 0.60,
    "osint": 0.40,
    "inference": 0.35,
    "scan": 0.50,
    "unknown": 0.30,
}


def bayesian_update(prior: float, likelihood: float, evidence_strength: float = 0.5) -> float:
    """
    Bayesian update: P(H|E) = P(H) * P(E|H) / P(E)

    Where P(E) = P(H) * P(E|H) + (1 - P(H)) * (1 - P(E|H))
    """
    if prior <= 0 or prior >= 1:
        return prior

    # Adjust likelihood by evidence strength
    adjusted_likelihood = 0.5 + (likelihood - 0.5) * evidence_strength

    # Marginal probability of evidence
    p_e = prior * adjusted_likelihood + (1 - prior) * (1 - adjusted_likelihood)

    if p_e == 0:
        return prior

    posterior = (prior * adjusted_likelihood) / p_e
    return max(CONFIDENCE_FLOOR, min(0.999, posterior))


def temporal_decay(confidence: float, last_seen: datetime, now: Optional[datetime] = None) -> float:
    """
    Apply temporal confidence decay using exponential decay formula:

    confidence(t) = confidence(0) * exp(-λ * t)

    Where λ = ln(2) / half_life
    """
    if now is None:
        now = datetime.utcnow()

    if not last_seen:
        return confidence

    days_elapsed = (now - last_seen).days
    if days_elapsed <= 0:
        return confidence

    decay_rate = math.log(2) / CONFIDENCE_HALF_LIFE_DAYS
    decayed = confidence * math.exp(-decay_rate * days_elapsed)

    return max(CONFIDENCE_FLOOR, decayed)


def fuse_evidence(confidences: List[float], weights: Optional[List[float]] = None) -> float:
    """
    Fuse multiple evidence sources using weighted averaging:

    fused = Σ(w_i * c_i) / Σ(w_i)

    Falls back to geometric mean if no weights provided.
    """
    if not confidences:
        return 0.5

    if weights and len(weights) == len(confidences):
        total_weight = sum(weights)
        if total_weight == 0:
            return sum(confidences) / len(confidences)
        return sum(w * c for w, c in zip(weights, confidences)) / total_weight

    # Geometric mean (penalizes low-confidence evidence)
    product = 1.0
    for c in confidences:
        product *= max(c, 0.01)
    return product ** (1.0 / len(confidences))


def path_confidence_product(node_confidences: List[float]) -> float:
    """
    Compute path confidence as product of node confidences.
    Penalizes long paths automatically.
    """
    product = 1.0
    for c in node_confidences:
        product *= max(c, CONFIDENCE_FLOOR)
    return product


def evidence_weight(source_type: str) -> float:
    """Get the base weight for an evidence source type."""
    return EVIDENCE_WEIGHTS.get(source_type.lower(), EVIDENCE_WEIGHTS["unknown"])


def likelihood_from_cvss(cvss_score: float) -> float:
    """
    Map CVSS score to exploit likelihood.
    CVSS 9.0+ → 0.9, CVSS 7.0-8.9 → 0.7, etc.
    """
    if cvss_score >= 9.0:
        return 0.90
    elif cvss_score >= 7.0:
        return 0.70
    elif cvss_score >= 4.0:
        return 0.50
    elif cvss_score >= 0.1:
        return 0.30
    return 0.10


def confidence_from_severity(severity: str) -> float:
    """Map severity string to base confidence."""
    mapping = {
        "critical": 0.90,
        "high": 0.70,
        "medium": 0.50,
        "low": 0.30,
        "info": 0.10,
    }
    return mapping.get(severity.lower(), 0.30)


async def propagate_confidence_to_graph(driver, engagement_id: str):
    """
    Propagate confidence scores through the graph using iterative Bayesian updates.
    Updates node confidences based on evidence, lineage, and neighbor states.
    """
    async with driver.session(database="neo4j") as session:
        # 1. Capture initial state
        result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            RETURN n.id AS id, n.entity_type AS type, coalesce(toFloat(n.confidence), 0.5) AS conf
            """,
            engagement_id=engagement_id
        )
        nodes = {record["id"]: {"type": record["type"], "conf": record["conf"]} async for record in result}

        # 2. Iterative propagation (Max 3 passes to avoid infinite loops/over-smoothing)
        for i in range(3):
            logger.info(f"Confidence propagation pass {i+1}/3 for {engagement_id}")
            
            # Fetch relationships for propagation
            result = await session.run(
                """
                MATCH (src:L9 {engagement_id: $engagement_id})-[r]->(dst:L9 {engagement_id: $engagement_id})
                RETURN src.id AS src_id, dst.id AS dst_id, type(r) AS rel_type, 
                       coalesce(toFloat(r.weight), 0.5) AS weight
                """,
                engagement_id=engagement_id
            )

            updates = []
            async for record in result:
                src_id, dst_id = record["src_id"], record["dst_id"]
                if src_id not in nodes or dst_id not in nodes:
                    continue

                src_conf = nodes[src_id]["conf"]
                dst_conf = nodes[dst_id]["conf"]
                rel_weight = record["weight"]
                rel_type = record["rel_type"]

                # Inference rules for confidence propagation
                if rel_type == "HAS_FINDING":
                    # Finding confidence propagates strongly to the entity
                    new_dst_conf = bayesian_update(dst_conf, src_conf, rel_weight * 0.8)
                    nodes[dst_id]["conf"] = new_dst_conf
                    updates.append((dst_id, new_dst_conf))
                
                elif rel_type == "HOSTS":
                    # Host compromise (high confidence finding) decays service confidence
                    new_dst_conf = bayesian_update(dst_conf, src_conf, rel_weight * 0.5)
                    nodes[dst_id]["conf"] = new_dst_conf
                    updates.append((dst_id, new_dst_conf))

                elif rel_type == "AUTHENTICATES_TO":
                    # Compromised credential provides high confidence path to service
                    new_dst_conf = bayesian_update(dst_conf, src_conf, rel_weight * 0.9)
                    nodes[dst_id]["conf"] = new_dst_conf
                    updates.append((dst_id, new_dst_conf))

            # Batch update the graph
            if updates:
                await session.run(
                    """
                    UNWIND $updates AS update
                    MATCH (n:L9 {id: update.id})
                    SET n.confidence = update.conf
                    """,
                    updates=[{"id": u[0], "conf": u[1]} for u in updates]
                )

        logger.info(f"Bayesian confidence propagation complete for {engagement_id}")


async def update_node_confidence(driver, node_id: str, new_confidence: float):
    """Update a single node's confidence score."""
    async with driver.session(database="neo4j") as session:
        await session.run(
            """
            MATCH (n:L9 {id: $node_id})
            SET n.confidence = $confidence,
                n.last_updated = datetime()
            """,
            node_id=node_id,
            confidence=float(new_confidence),
        )


async def recalculate_finding_confidence(driver, pg_pool, finding_id: str):
    """
    Recalculate a finding's confidence based on:
    - Its evidence chain
    - Supporting vs. contradicting evidence
    - Temporal decay since last observation
    - Severity-based prior
    """
    async with pg_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT f.severity, f.confidence, f.last_seen_at,
                   f.validation_state, f.evidence
            FROM findings f
            WHERE f.id = $1
            """,
            finding_id,
        )
        if not row:
            return 0.5

        # Get supporting evidence
        evidence_rows = await conn.fetch(
            """
            SELECT fe.role, fe.confidence_delta, ei.source_type
            FROM finding_evidence fe
            JOIN evidence_items ei ON fe.evidence_id = ei.id
            WHERE fe.finding_id = $1
            """,
            finding_id,
        )

    # Prior from severity
    prior = confidence_from_severity(row["severity"])

    # Apply temporal decay
    last_seen = row["last_seen_at"]
    if hasattr(last_seen, "tzinfo"):
        now = datetime.utcnow()
    else:
        now = datetime.utcnow()
    decayed = temporal_decay(prior, last_seen, now)

    # Fuse evidence confidences
    if evidence_rows:
        confidences = []
        weights = []
        for ev in evidence_rows:
            base_weight = evidence_weight(ev["source_type"])
            role_modifier = 0.8 if ev["role"] == "supporting" else -0.3
            confidence = max(0.1, min(0.99, base_weight + role_modifier))
            confidences.append(confidence)
            weights.append(abs(float(ev["confidence_delta"])) + 0.1)

        evidence_conf = fuse_evidence(confidences, weights)

        # Bayesian fusion of prior and evidence
        final_conf = bayesian_update(decayed, evidence_conf, 0.7)
    else:
        final_conf = decayed

    # Persist update
    async with pg_pool.acquire() as conn:
        await conn.execute(
            "UPDATE findings SET confidence = $1 WHERE id = $2",
            str(round(final_conf, 4)),
            finding_id,
        )

    return round(final_conf, 4)
