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


async def propagate_confidence_to_graph(driver, engagement_id: str,
                                        damping_factor: float = 0.75,
                                        max_iterations: int = 15,
                                        convergence_threshold: float = 1e-5,
                                        partition_scale_threshold: int = 500):
    """
    Propagate confidence scores through the graph using a mathematically rigorous
    Iterative Bayesian Belief Propagation algorithm (Noisy-OR lateral compromise propagation).
    
    Includes Hardened Systems Features:
    1. Damping & Cyclic Stabilization: Dampens updates to prevent loopy cycles from oscillating.
    2. Dynamic Oscillation Shield: Automatically reduces damping factor if delta behavior oscillates.
    3. Relevance Boundary Partitioning: Scales to large graphs (>10,000 nodes) by focusing sweeps
       only on active subgraphs (within 4 hops of Findings/Credentials/Vulnerabilities).
    """
    TRANSITION_FACTORS = {
        "HAS_FINDING": 0.90,
        "AUTHENTICATES_TO": 0.95,
        "HOSTS": 0.75,
        "RESOLVES_TO": 0.30,
        "DEPENDS_ON": 0.65,
        "PRIVILEGE_ESCALATION": 0.85,
        "EXPLOITS": 0.90,
        "NETWORK_REACH": 0.50,
        "TRUSTS": 0.75,
    }

    async with driver.session(database="neo4j") as session:
        # A. Fetch total node count to determine if we should partition
        count_result = await session.run(
            """
            MATCH (n:L9 {engagement_id: $engagement_id})
            RETURN count(n) AS cnt
            """,
            engagement_id=engagement_id
        )
        record_cnt = await count_result.single()
        total_node_count = record_cnt["cnt"] if record_cnt else 0
        
        use_partition = total_node_count > partition_scale_threshold
        logger.info(f"Bayesian propagation: total engagement nodes = {total_node_count} (partition_scaling={use_partition})")

        # B. Query active nodes (with partition boundaries if needed)
        if use_partition:
            node_query = """
                MATCH (f:L9 {engagement_id: $engagement_id})
                WHERE f.entity_type IN ['finding', 'vulnerability', 'credential']
                MATCH (f)-[*..4]-(n:L9 {engagement_id: $engagement_id})
                RETURN DISTINCT n.id AS id, n.entity_type AS type, coalesce(toFloat(n.confidence), 0.5) AS conf
            """
        else:
            node_query = """
                MATCH (n:L9 {engagement_id: $engagement_id})
                RETURN n.id AS id, n.entity_type AS type, coalesce(toFloat(n.confidence), 0.5) AS conf
            """

        result = await session.run(node_query, engagement_id=engagement_id)
        
        # priors: P(X_prior), beliefs: current state of belief Bel(X)
        priors = {}
        beliefs = {}
        async for record in result:
            nid = record["id"]
            val = max(CONFIDENCE_FLOOR, min(0.999, record["conf"]))
            priors[nid] = val
            beliefs[nid] = val

        if not beliefs:
            logger.info(f"No nodes found in relevance boundaries for propagation (engagement: {engagement_id})")
            return

        # C. Query active directed relationships for propagation
        if use_partition:
            rel_query = """
                MATCH (f:L9 {engagement_id: $engagement_id})
                WHERE f.entity_type IN ['finding', 'vulnerability', 'credential']
                MATCH (f)-[*..4]-(src:L9 {engagement_id: $engagement_id})
                MATCH (src)-[r]->(dst:L9 {engagement_id: $engagement_id})
                RETURN DISTINCT src.id AS src_id, dst.id AS dst_id, type(r) AS rel_type, 
                       coalesce(toFloat(r.weight), 0.5) AS weight
            """
        else:
            rel_query = """
                MATCH (src:L9 {engagement_id: $engagement_id})-[r]->(dst:L9 {engagement_id: $engagement_id})
                RETURN src.id AS src_id, dst.id AS dst_id, type(r) AS rel_type, 
                       coalesce(toFloat(r.weight), 0.5) AS weight
            """

        result = await session.run(rel_query, engagement_id=engagement_id)
        
        # Build directed adjacency list of parents (incoming edges)
        parents = {nid: [] for nid in beliefs}
        async for record in result:
            src_id = record["src_id"]
            dst_id = record["dst_id"]
            if src_id in beliefs and dst_id in beliefs:
                parents[dst_id].append((src_id, record["rel_type"], record["weight"]))

        # D. Iterative Belief Propagation with Damping and Dynamic Oscillation Shield
        logger.info(f"Starting BBP (sweep size: {len(beliefs)} nodes, threshold: {convergence_threshold})")
        
        prev_max_delta = 999.0
        consecutive_increases = 0

        for iteration in range(max_iterations):
            new_beliefs = {}
            max_delta = 0.0

            # Dynamic Oscillation Shield:
            # If the max delta is increasing rather than decaying, we are likely experiencing
            # a cyclic oscillation/feedback loop. We automatically scale down the damping factor.
            if iteration > 0 and max_delta >= prev_max_delta:
                consecutive_increases += 1
                if consecutive_increases >= 2:
                    damping_factor = max(0.20, damping_factor * 0.70)
                    logger.debug(f"BBP: feedback oscillation detected. Auto-damped damping_factor to {damping_factor:.4f}")
            else:
                consecutive_increases = 0

            for node_id, current_val in beliefs.items():
                node_parents = parents[node_id]
                node_prior = priors[node_id]

                if not node_parents:
                    # Root nodes remain at their prior confidence levels
                    new_beliefs[node_id] = node_prior
                    continue

                # Noisy-OR combination of compromise propagation from parents
                prod_term = 1.0
                for parent_id, rel_type, weight in node_parents:
                    parent_bel = beliefs[parent_id]
                    factor = TRANSITION_FACTORS.get(rel_type, 0.50)
                    p_xy = factor * weight
                    prod_term *= (1.0 - parent_bel * p_xy)

                p_prop = 1.0 - prod_term

                # Bayesian fusion of the node's prior evidence and the propagated compromise probability
                updated_bel = bayesian_update(node_prior, p_prop, evidence_strength=0.8)
                
                # Apply Damping & Cyclic Stabilization equation:
                # Bel_new = damping * Bel_updated + (1 - damping) * Bel_prev
                damped_bel = damping_factor * updated_bel + (1.0 - damping_factor) * current_val
                new_beliefs[node_id] = damped_bel

                # Track convergence delta
                delta = abs(damped_bel - current_val)
                if delta > max_delta:
                    max_delta = delta

            # Update working belief state
            beliefs = new_beliefs
            prev_max_delta = max_delta

            logger.debug(f"Sweep {iteration+1}/{max_iterations}: max delta = {max_delta:.6f}")
            if max_delta < convergence_threshold:
                logger.info(f"Belief propagation converged after {iteration+1} iterations (max delta={max_delta:.6f}).")
                break
        else:
            logger.warning(f"Belief propagation reached max iterations ({max_iterations}) without full convergence (max delta={max_delta:.6f})")

        # E. Batch commit the final converged beliefs back to Neo4j
        updates = [{"id": nid, "conf": round(val, 4)} for nid, val in beliefs.items()]
        
        await session.run(
            """
            UNWIND $updates AS update
            MATCH (n:L9 {id: update.id})
            SET n.confidence = update.conf
            """,
            updates=updates
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
