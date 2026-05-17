"""
Contextual Prioritization — Operational finding and attack-path scoring.

Scoring factors:
- Environmental relevance
- Path Dependency Centrality: bottleneck index on active attack paths
- Exploit Actionability & Evasion Factor
- Severity and confidence mapping
- Validation multipliers
"""

import json
import logging
from typing import List, Dict, Any, Optional
from graph.confidence import bayesian_update
from graph.algorithms import blast_radius_analysis
from reasoning.exploit_chains import match_exploit_blueprint

logger = logging.getLogger("lattice9-graph-engine")


async def prioritize_findings(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Rank findings by cyber-operational priority.
    Combines environmental, structural (bottleneck), and exploit actionability factors.

    priority = confidence * severity_weight * env_relevance * centrality_multiplier * actionability_multiplier
    """
    # 1. Fetch generated attack paths to compute Path Dependency Centrality (bottleneck index)
    path_nodes_count = {}
    total_paths = 0

    async with pg_pool.acquire() as conn:
        path_rows = await conn.fetch(
            "SELECT reasoning_trace FROM attack_paths WHERE engagement_id = $1",
            engagement_id
        )
        
        for row in path_rows:
            try:
                trace = json.loads(row["reasoning_trace"])
                node_ids = trace.get("node_ids", [])
                if node_ids:
                    total_paths += 1
                    # Track unique nodes in this path to avoid multiple counting per path
                    unique_nodes = set(node_ids)
                    for nid in unique_nodes:
                        path_nodes_count[nid] = path_nodes_count.get(nid, 0) + 1
            except Exception as e:
                logger.error(f"Error reading attack path trace for centrality: {e}")

        # 2. Fetch all findings in this engagement
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
        title = row["title"]
        severity = row["severity"]
        confidence = float(row["confidence"]) if row["confidence"] else 0.5
        env_relevance = float(row["environmental_relevance"]) if row["environmental_relevance"] else 0.5
        affected_id = row["affected_entity_id"]

        severity_w = severity_weights.get(severity, 0.5)

        # 3. Path Dependency Centrality: fraction of paths passing through this entity/finding
        centrality = 0.0
        if total_paths > 0 and affected_id:
            centrality = path_nodes_count.get(affected_id, 0) / total_paths

        # Centrality multiplier ranges from 1.0 to 1.5 (bottlenecks prioritized heavily)
        centrality_mult = 1.0 + (centrality * 0.5)

        # 4. Exploit Actionability and Evasion Boost
        actionability_mult = 1.0
        bp = match_exploit_blueprint(title)
        
        if bp:
            # Matches high-impact blueprint
            actionability_mult *= 1.25
            if bp["credential_level"] == "none":
                # Unauthenticated exploits represent massive tactical risk
                actionability_mult *= 1.15
        
        # 5. Base Priority Math
        priority = confidence * severity_w * env_relevance * centrality_mult * actionability_mult

        # 6. Validation State multipliers
        validation_state = row["validation_state"]
        if validation_state == "validated":
            priority *= 1.3
        elif validation_state == "candidate":
            priority *= 1.0
        elif validation_state == "contradicted":
            priority *= 0.15

        # 7. Blast Radius Exposure Factor integration
        blast_score = 0.5
        if affected_id:
            try:
                blast = await blast_radius_analysis(driver, engagement_id, affected_id, max_depth=2)
                blast_score = blast.get("total_exposure_score", 0.5)
            except Exception:
                pass
        
        blast_factor = min(1.0, blast_score / 10.0) if blast_score else 0.5
        priority *= (0.7 + 0.3 * blast_factor)

        prioritized.append({
            "id": row["id"],
            "title": title,
            "severity": severity,
            "confidence": round(confidence, 4),
            "priority_score": round(max(0.01, min(1.0, priority)), 4),
            "environmental_relevance": round(env_relevance, 4),
            "blast_radius_factor": round(blast_factor, 4),
            "path_dependency_centrality": round(centrality, 4),
            "actionability_matched": bp is not None,
            "validation_state": validation_state,
            "affected_entity_id": affected_id,
        })

    # Sort descending by final operational priority score
    return sorted(prioritized, key=lambda f: f["priority_score"], reverse=True)


async def prioritize_attack_paths(driver, pg_pool, engagement_id: str,
                                   paths: List[Dict]) -> List[Dict]:
    """
    Rank attack paths by operational relevance.
    Extends path feasibility with overall finding bottleneck priorities.
    """
    # Recalculate findings priorities for contextual weights
    finding_priorities = await prioritize_findings(driver, pg_pool, engagement_id)
    finding_map = {f["id"]: f for f in finding_priorities}

    for path in paths:
        path_score = path.get("composite_score", 0.5)

        # Boost paths that target critical prioritized findings
        terminal_ids = path.get("node_ids", [])
        for tid in terminal_ids:
            if tid in finding_map:
                path_score *= (1.0 + finding_map[tid]["priority_score"] * 0.3)

        path["operational_priority"] = round(max(0.01, min(1.0, path_score)), 4)

    return sorted(paths, key=lambda p: p.get("operational_priority", 0), reverse=True)
