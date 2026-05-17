"""
Attack Economics Engine — adversarial decision economics on graph topology.

Models the operational economics of infrastructure compromise:

    Utility(path) = PrivilegeGain × PersistenceProbability
                    ───────────────────────────────────────
                    DetectionRisk × OperationalCost

Where:
    PrivilegeGain: value of target access (by entity type and data sensitivity)
    PersistenceProbability: likelihood of maintaining access post-exploit
    DetectionRisk: probability of detection during traversal
    OperationalCost: time, tooling burn, complexity of operation

Economic concepts:
  - Opportunity cost: choosing one path forfeits another
  - Marginal utility: each additional node provides diminishing returns
  - Risk-adjusted return: expected value accounting for detection
  - Stealth premium: paying higher operational cost for lower detection
  - Exploit burn: single-use exploits consumed on failure

Applications:
  - Rank attack paths by economic utility (operational ROI)
  - Identify stealth-optimal vs speed-optimal paths
  - Model adversarial tradeoffs between speed, stealth, and impact
  - Estimate operational viability thresholds
  - Compute expected value of attack campaigns
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("lattice9-graph-engine")

# Base privilege values by entity type (what is each node "worth")
PRIVILEGE_VALUES = {
    "domain": 10.0,
    "credential": 8.0,
    "identity": 6.0,
    "privilege": 7.0,
    "service": 4.0,
    "host": 3.0,
    "endpoint": 2.0,
    "network": 3.5,
    "data": 5.0,
    "objective": 10.0,
    "finding": 1.0,
    "evidence": 0.5,
    "control": 1.5,
}

# Persistence probability by relationship and entity type
PERSISTENCE_PROBABILITY = {
    "TRUSTS": 0.7,           # Trust relationships persist
    "MEMBER_OF": 0.8,        # Group membership is sticky
    "AUTHENTICATES_TO": 0.6,  # Auth tokens expire but can be refreshed
    "PRIVILEGE_ESCALATION": 0.5,  # Priv esc often detected
    "OWNS": 0.9,             # Ownership is highly persistent
    "EXPLOITS": 0.3,         # Exploits get patched
    "HOSTS": 0.6,
    "DEPENDS_ON": 0.5,
    "NETWORK_REACH": 0.4,
    "DATA_FLOW": 0.5,
}

# Operational cost by relationship type
# Cost = complexity, tooling burn, time, risk
OPERATIONAL_COST = {
    "TRUSTS": 0.3,            # Leverage existing trust is cheap
    "MEMBER_OF": 0.3,
    "AUTHENTICATES_TO": 0.5,  # Using creds is medium
    "PRIVILEGE_ESCALATION": 0.8,  # Priv esc is expensive
    "OWNS": 0.2,
    "EXPLOITS": 0.9,          # New exploits are very expensive
    "HOSTS": 0.4,
    "DEPENDS_ON": 0.6,
    "NETWORK_REACH": 0.5,
    "DATA_FLOW": 0.4,
    "RESOLVES_TO": 0.3,
    "HAS_FINDING": 0.7,
}

# Stealth_ability by entity type
STEALTH_ABILITY = {
    "credential": 0.8,     # Credential use is stealthy
    "identity": 0.7,
    "trust": 0.6,
    "service": 0.4,
    "host": 0.3,
    "endpoint": 0.2,
    "network": 0.5,
    "domain": 0.1,         # Domain-level actions are very visible
}


async def compute_path_economics(driver, engagement_id: str,
                                   path_id: str) -> Dict:
    """
    Compute full economic profile of a single attack path.

    Utility(path) = PrivilegeGain × PersistenceProbability
                    / (DetectionRisk × OperationalCost)

    Returns operational utility, component scores, and economic breakdown.
    """
    async with driver.session(database="neo4j") as session:
        path_result = await session.run(
            """MATCH p = ()-[r:ATTACK_PATH]->()
               WHERE r.id = $path_id OR r.path_id = $path_id
               RETURN p
            """,
            path_id=path_id,
        )
        # Fall back to PostgreSQL if not in Neo4j
        import json

    from db import get_pg_pool
    pg_pool = await get_pg_pool()
    try:
        async with pg_pool.acquire() as conn:
            path_row = await conn.fetchrow(
                """SELECT * FROM attack_paths WHERE id = $1 AND engagement_id = $2""",
                path_id, engagement_id,
            )
            if not path_row:
                return {"error": f"Path {path_id} not found"}

            trace_text = path_row["reasoning_trace"]
            if isinstance(trace_text, str):
                trace = json.loads(trace_text)
            else:
                trace = trace_text

            node_ids = trace.get("node_ids", [])
            rel_types = trace.get("rel_types", [])
            step_validations = trace.get("step_validations", [])

    finally:
        await pg_pool.close()

    if not node_ids or not rel_types:
        return {"error": "Path has no node or relationship data"}

    # Compute per-step economics
    step_economics = []
    total_privilege_gain = 0.0
    total_persistence = 1.0
    total_detection_risk = 0.0
    total_operational_cost = 0.0

    for i in range(len(rel_types)):
        rel = rel_types[i] if i < len(rel_types) else "ATTACK_PATH"
        target_type = trace.get("node_types", [None] * len(node_ids))[min(i + 1, len(node_ids) - 1)] if i + 1 < len(node_ids) else "unknown"

        privilege_gain = PRIVILEGE_VALUES.get(target_type, 1.0)
        persistence = PERSISTENCE_PROBABILITY.get(rel, 0.5)
        op_cost = OPERATIONAL_COST.get(rel, 0.5)
        stealth = STEALTH_ABILITY.get(target_type, 0.3)

        # Detection risk: inverse of stealth
        detection_risk = 1.0 - stealth

        # Step utility
        if detection_risk > 0 and op_cost > 0:
            step_utility = (privilege_gain * persistence) / (detection_risk * op_cost)
        else:
            step_utility = privilege_gain * persistence

        total_privilege_gain += privilege_gain
        total_persistence *= persistence
        total_detection_risk += detection_risk
        total_operational_cost += op_cost

        step_economics.append({
            "step": i,
            "relationship": rel,
            "target_type": target_type,
            "privilege_gain": round(privilege_gain, 2),
            "persistence_probability": round(persistence, 4),
            "detection_risk": round(detection_risk, 4),
            "operational_cost": round(op_cost, 4),
            "stealth_score": round(stealth, 4),
            "step_utility": round(step_utility, 4),
        })

    # Path-level economics
    detection_risk_aggregate = 1.0 - (1.0 - total_detection_risk / max(len(rel_types), 1)) ** len(rel_types)
    utility = (total_privilege_gain * total_persistence) / max(detection_risk_aggregate * total_operational_cost, 0.01)
    roi = utility / max(total_operational_cost, 0.01)

    return {
        "path_id": path_id,
        "path_title": path_row.get("title", "Unknown Path"),
        "path_confidence": float(path_row["confidence"]) if path_row["confidence"] else 0.5,
        "feasibility": float(path_row.get("feasibility") or 0.5),
        "economics": {
            "total_privilege_gain": round(total_privilege_gain, 2),
            "cumulative_persistence": round(total_persistence, 4),
            "aggregate_detection_risk": round(detection_risk_aggregate, 4),
            "total_operational_cost": round(total_operational_cost, 4),
            "path_utility": round(utility, 4),
            "path_roi": round(roi, 4),
            "stealth_rating": round(
                sum(s["stealth_score"] for s in step_economics) / max(len(step_economics), 1), 4
            ),
        },
        "step_economics": step_economics,
    }


async def rank_paths_by_utility(driver, pg_pool, engagement_id: str) -> Dict:
    """
    Rank all attack paths by expected economic utility.

    Higher utility = better operational ROI for attacker.
    Used to prioritize which paths to defend (or use).
    """
    async with pg_pool.acquire() as conn:
        path_rows = await conn.fetch(
            """SELECT id, title, reasoning_trace, confidence,
                      feasibility, attacker_roi
               FROM attack_paths
               WHERE engagement_id = $1 AND state != 'suppressed'
               ORDER BY confidence DESC
               LIMIT 50""",
            engagement_id,
        )

    if not path_rows:
        return {"paths": [], "top_paths": [], "economics_statistics": {}}

    import json
    results = []
    for row in path_rows:
        trace_text = row["reasoning_trace"]
        if isinstance(trace_text, str):
            trace = json.loads(trace_text)
        else:
            trace = trace_text

        node_ids = trace.get("node_ids", [])
        rel_types = trace.get("rel_types", [])

        if not node_ids or not rel_types:
            continue

        total_pg = 0.0
        total_pp = 1.0
        total_dr = 0.0
        total_oc = 0.0
        total_stealth = 0.0
        node_types = trace.get("node_types", [])

        for i in range(len(rel_types)):
            rel = rel_types[i]
            tgt_type = node_types[min(i + 1, len(node_types) - 1)] if i + 1 < len(node_types) else "unknown"
            total_pg += PRIVILEGE_VALUES.get(tgt_type, 1.0)
            total_pp *= PERSISTENCE_PROBABILITY.get(rel, 0.5)
            total_dr += (1.0 - STEALTH_ABILITY.get(tgt_type, 0.3))
            total_oc += OPERATIONAL_COST.get(rel, 0.5)
            total_stealth += STEALTH_ABILITY.get(tgt_type, 0.3)

        det_risk_agg = 1.0 - (1.0 - total_dr / max(len(rel_types), 1)) ** len(rel_types)
        utility = (total_pg * total_pp) / max(det_risk_agg * total_oc, 0.01)
        roi = utility / max(total_oc, 0.01)
        stealth_rating = total_stealth / max(len(rel_types), 1)

        results.append({
            "path_id": row["id"],
            "title": row["title"],
            "confidence": float(row["confidence"]) if row["confidence"] else 0.5,
            "utility": round(utility, 4),
            "roi": round(roi, 4),
            "stealth_rating": round(stealth_rating, 4),
            "total_operational_cost": round(total_oc, 4),
            "total_privilege_gain": round(total_pg, 2),
            "path_length": len(rel_types),
        })

    results.sort(key=lambda r: r["utility"], reverse=True)

    utilities = [r["utility"] for r in results]
    return {
        "paths": results,
        "total_paths_analyzed": len(results),
        "top_paths": results[:10],
        "economics_statistics": {
            "max_utility": round(max(utilities), 4) if utilities else 0,
            "min_utility": round(min(utilities), 4) if utilities else 0,
            "mean_utility": round(sum(utilities) / len(utilities), 4) if utilities else 0,
        },
    }


async def compute_stealth_optimal_paths(driver, pg_pool,
                                         engagement_id: str) -> List[Dict]:
    """
    Find paths that optimize for stealth over speed/impact.

    High stealth = low detection risk = low operational cost
    These paths maximize: PersistenceProbability / DetectionRisk
    """
    ranked = await rank_paths_by_utility(driver, pg_pool, engagement_id)
    paths = ranked.get("paths", [])

    # Re-rank by stealth rating
    paths.sort(key=lambda p: (p["stealth_rating"], p["roi"]), reverse=True)

    return [{
        "path_id": p["path_id"],
        "title": p["title"],
        "stealth_rating": p["stealth_rating"],
        "utility": p["utility"],
        "operational_cost": p["total_operational_cost"],
        "confidence": p["confidence"],
    } for p in paths[:10]]


async def compute_attack_campaign_economics(driver, pg_pool,
                                             engagement_id: str) -> Dict:
    """
    Compute economics of a full attack campaign (all paths combined).

    Models the attacker's decision: which set of paths to execute
    given budget and risk constraints.

    Campaign metrics:
    - Total expected value (sum of utilities of top K paths)
    - Campaign risk (max detection risk across selected paths)
    - Budget requirements (sum of operational costs)
    - Marginal utility (diminishing returns as more paths added)
    """
    ranked = await rank_paths_by_utility(driver, pg_pool, engagement_id)
    paths = ranked.get("paths", [])

    if not paths:
        return {"campaign_economics": {}}

    # Compute marginal utility for incremental path inclusion
    cumulative_utility = 0.0
    cumulative_cost = 0.0
    marginal_utilities = []

    for i, p in enumerate(paths):
        cumulative_utility += p["utility"]
        cumulative_cost += p["total_operational_cost"]
        marginal_utility = cumulative_utility / max(cumulative_cost, 0.01)
        marginal_utilities.append({
            "paths_included": i + 1,
            "cumulative_utility": round(cumulative_utility, 4),
            "cumulative_cost": round(cumulative_cost, 4),
            "marginal_utility": round(marginal_utility, 4),
            "diminishing_returns": i > 0 and marginal_utility < marginal_utilities[-1]["marginal_utility"],
        })

    # Optimal campaign size: where marginal utility drops below threshold
    optimal_size = None
    for mu in marginal_utilities:
        if mu["diminishing_returns"] and not any(
            m["diminishing_returns"] for m in marginal_utilities[:marginal_utilities.index(mu)]
        ):
            optimal_size = mu["paths_included"] - 1
            break

    return {
        "total_paths_available": len(paths),
        "optimal_campaign_size": optimal_size or len(paths),
        "max_campaign_utility": round(cumulative_utility, 4),
        "max_campaign_cost": round(cumulative_cost, 4),
        "marginal_utility_curve": marginal_utilities,
        "diminishing_returns_detected": any(m["diminishing_returns"] for m in marginal_utilities),
    }
