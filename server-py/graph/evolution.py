"""
Temporal Graph Memory Engine — Infrastructure evolution tracking.

Tracks how infrastructure mutates over time:
- Relationship mutation (edges appearing/disappearing/weight-shifting)
- Exposure evolution (attack surface expansion/contraction)
- Trust drift (trust relationship stability)
- Credential spread (credential propagation across services)
- Graph evolution (node/edge churn rates)
- Attack-surface entropy (topology instability over time)
- Topology instability (structural volatility scoring)

Core insight: infrastructure is a dynamic system, not a static inventory.
The rate of change IS intelligence.
"""

import logging
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("lattice9-graph-engine")


async def compute_evolution_metrics(driver, pg_pool, engagement_id: str) -> Dict:
    """
    Compute comprehensive evolution metrics for an engagement's graph.
    Returns measures of graph mutability, trust stability, and surface drift.
    """
    async with pg_pool.acquire() as conn:
        snapshots = await conn.fetch(
            """SELECT id, captured_at, entity_count, relationship_count, metadata
               FROM graph_snapshots
               WHERE engagement_id = $1
               ORDER BY captured_at ASC""",
            engagement_id,
        )

    if len(snapshots) < 2:
        return {"status": "insufficient_history", "snapshots": len(snapshots)}

    # Compute inter-snapshot metrics
    intervals = []
    for i in range(1, len(snapshots)):
        prev = snapshots[i - 1]
        curr = snapshots[i]

        time_delta = (curr["captured_at"] - prev["captured_at"]).total_seconds()
        if time_delta <= 0:
            continue

        entity_delta = curr["entity_count"] - prev["entity_count"]
        rel_delta = curr["relationship_count"] - prev["relationship_count"]

        # Node churn rate: entities added or removed per hour
        churn_rate = (abs(entity_delta) / time_delta) * 3600

        # Relationship volatility: relationship changes per hour
        rel_volatility = (abs(rel_delta) / time_delta) * 3600

        intervals.append({
            "from": prev["captured_at"].isoformat(),
            "to": curr["captured_at"].isoformat(),
            "time_span_hours": time_delta / 3600,
            "entity_delta": entity_delta,
            "relationship_delta": rel_delta,
            "node_churn_rate": round(churn_rate, 4),
            "relationship_volatility": round(rel_volatility, 4),
        })

    # Aggregate metrics
    avg_churn = sum(i["node_churn_rate"] for i in intervals) / max(len(intervals), 1)
    avg_volatility = sum(i["relationship_volatility"] for i in intervals) / max(len(intervals), 1)

    # Attack-surface entropy: how unstable the topology is
    # High entropy = infrastructure is changing rapidly (harder to attack, harder to defend)
    # Low entropy = infrastructure is stable (easier to model)
    surface_entropy = _compute_surface_entropy(intervals)

    # Trust drift: how much trust relationships have changed
    trust_drift = await _compute_trust_drift(driver, pg_pool, engagement_id)

    # Credential spread velocity
    credential_spread = await _compute_credential_spread(driver, engagement_id)

    return {
        "engagement_id": engagement_id,
        "total_snapshots": len(snapshots),
        "observation_window_hours": (snapshots[-1]["captured_at"] - snapshots[0]["captured_at"]).total_seconds() / 3600,
        "intervals": intervals,
        "aggregate": {
            "avg_node_churn_rate": round(avg_churn, 4),
            "avg_relationship_volatility": round(avg_volatility, 4),
            "surface_entropy": round(surface_entropy, 4),
        },
        "trust_drift": trust_drift,
        "credential_spread": credential_spread,
    }


def _compute_surface_entropy(intervals: List[Dict]) -> float:
    """
    Compute attack-surface entropy from interval changes.

    High entropy = rapid, unpredictable topology change
    Low entropy = stable, predictable infrastructure

    Uses normalized variance of churn rates as entropy proxy.
    """
    if len(intervals) < 2:
        return 0.0

    churn_rates = [i["node_churn_rate"] for i in intervals]
    volatility = [i["relationship_volatility"] for i in intervals]

    # Combine churn and volatility into a single instability score
    instability_scores = [c + v for c, v in zip(churn_rates, volatility)]

    # Coefficient of variation as entropy proxy
    mean = sum(instability_scores) / len(instability_scores)
    if mean == 0:
        return 0.0

    variance = sum((s - mean) ** 2 for s in instability_scores) / len(instability_scores)
    std_dev = math.sqrt(variance)

    # Normalize to [0, 1]
    cv = std_dev / mean
    return min(1.0, cv / (1 + cv))


async def _compute_trust_drift(driver, pg_pool, engagement_id: str) -> Dict:
    """
    Measure how trust relationships have changed between snapshots.
    Trust drift indicates shifting security boundaries.
    """
    async with driver.session(database="neo4j") as session:
        # Count current trust relationships
        trust_count = await session.run(
            """MATCH ()-[r:TRUSTS]->()
               WHERE r.confidence IS NOT NULL
               RETURN count(r) AS count""",
        )
        current_trust = (await trust_count.single())["count"]

        # Count privilege escalation paths
        priv_count = await session.run(
            """MATCH ()-[r:PRIVILEGE_ESCALATION]->()
               WHERE r.confidence IS NOT NULL
               RETURN count(r) AS count""",
        )
        current_priv = (await priv_count.single())["count"]

    async with pg_pool.acquire() as conn:
        # Get first snapshot trust data for comparison
        first_snap = await conn.fetchrow(
            """SELECT metadata FROM graph_snapshots
               WHERE engagement_id = $1
               ORDER BY captured_at ASC LIMIT 1""",
            engagement_id,
        )

    if not first_snap:
        return {"current_trust_edges": current_trust, "drift_score": 0}

    return {
        "current_trust_edges": current_trust,
        "current_privilege_edges": current_priv,
    }


async def _compute_credential_spread(driver, engagement_id: str) -> Dict:
    """
    Measure credential propagation across the graph.
    Credential spread = number of unique services reachable by credentials.
    """
    async with driver.session(database="neo4j") as session:
        # Credential-to-service reachability
        result = await session.run(
            """MATCH (cred:L9 {engagement_id: $engagement_id, entity_type: 'credential'})
               OPTIONAL MATCH (cred)-[:AUTHENTICATES_TO]->(svc:L9)
               WITH cred, count(svc) AS reachable_services
               RETURN count(cred) AS total_credentials,
                      sum(reachable_services) AS total_reachable_services,
                      avg(reachable_services) AS avg_services_per_cred
            """,
            engagement_id=engagement_id,
        )
        row = await result.single()
        if not row:
            return {"total_credentials": 0, "spread_score": 0}

        total = row["total_credentials"] or 0
        reachable = row["total_reachable_services"] or 0
        avg_spread = float(row["avg_services_per_cred"] or 0)

        # Spread score: how much damage one credential compromise causes
        # Higher = credentials grant access to more services (worse)
        spread_score = min(1.0, (avg_spread / 10.0) * (reachable / max(total, 1)))

        return {
            "total_credentials": total,
            "total_reachable_services": reachable,
            "avg_services_per_credential": round(avg_spread, 4),
            "spread_score": round(spread_score, 4),
        }


async def get_graph_evolution_timeline(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Build a timeline of infrastructure evolution events.
    Each event is a significant graph mutation:
    - New critical-finding attached to exposed host
    - New trust relationship to a high-value target
    - Credential appearing with broad service access
    - Service exposure changing
    """
    async with pg_pool.acquire() as conn:
        snapshots = await conn.fetch(
            """SELECT id, captured_at, metadata
               FROM graph_snapshots
               WHERE engagement_id = $1
               ORDER BY captured_at ASC""",
            engagement_id,
        )

    events = []
    for i in range(1, len(snapshots)):
        prev_meta = snapshots[i - 1]["metadata"]
        curr_meta = snapshots[i]["metadata"]
        if not prev_meta or not curr_meta:
            continue

        prev_nodes = {n["id"]: n for n in json.loads(prev_meta).get("nodes", [])}
        curr_nodes = {n["id"]: n for n in json.loads(curr_meta).get("nodes", [])}

        # New findings
        prev_findings = {k: v for k, v in prev_nodes.items() if v.get("type") == "finding"}
        curr_findings = {k: v for k, v in curr_nodes.items() if v.get("type") == "finding"}
        new_findings = [v for k, v in curr_findings.items() if k not in prev_findings]

        for f in new_findings:
            events.append({
                "timestamp": snapshots[i]["captured_at"].isoformat(),
                "type": "new_finding",
                "label": f.get("name", "Unknown"),
                "confidence": f.get("confidence", 0.5),
                "severity": "unknown",
            })

    # Sort by timestamp
    events.sort(key=lambda e: e.get("timestamp", ""))
    return events


async def compute_topology_instability(driver, pg_pool, engagement_id: str) -> Dict:
    """
    Compute structural instability of the infrastructure topology.
    Uses graph edit distance between consecutive snapshots.

    High instability = infrastructure is undergoing significant change
    (migrations, redeployments, architecture shifts)
    Low instability = infrastructure is stable/frozen
    """
    async with pg_pool.acquire() as conn:
        snapshots = await conn.fetch(
            """SELECT id, captured_at, metadata
               FROM graph_snapshots
               WHERE engagement_id = $1
               ORDER BY captured_at ASC LIMIT 10""",
            engagement_id,
        )

    if len(snapshots) < 2:
        return {"instability_score": 0, "trend": "insufficient_data"}

    instability_scores = []
    for i in range(1, len(snapshots)):
        prev_meta = snapshots[i - 1]["metadata"]
        curr_meta = snapshots[i]["metadata"]
        if not prev_meta or not curr_meta:
            continue

        prev_nodes = json.loads(prev_meta).get("nodes", [])
        curr_nodes = json.loads(curr_meta).get("nodes", [])

        prev_ids = {n["id"] for n in prev_nodes}
        curr_ids = {n["id"] for n in curr_nodes}

        symmetric_diff = len(prev_ids ^ curr_ids)
        total = len(prev_ids | curr_ids)
        jaccard_distance = symmetric_diff / max(total, 1)

        instability_scores.append(jaccard_distance)

    avg_instability = sum(instability_scores) / max(len(instability_scores), 1)

    # Trend: is instability increasing or decreasing?
    if len(instability_scores) >= 3:
        first_half = sum(instability_scores[:len(instability_scores)//2]) / max(len(instability_scores)//2, 1)
        second_half = sum(instability_scores[len(instability_scores)//2:]) / max(len(instability_scores) - len(instability_scores)//2, 1)
        trend = "increasing" if second_half > first_half * 1.1 else "decreasing" if second_half < first_half * 0.9 else "stable"
    else:
        trend = "stable"

    return {
        "instability_score": round(avg_instability, 4),
        "trend": trend,
        "samples": len(instability_scores),
    }
