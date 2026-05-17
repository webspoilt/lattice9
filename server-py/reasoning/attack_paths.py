"""
Attack Path Inference — Weighted multi-path analysis with strict prerequisite auditing.

Calculates composite path priority as:
    composite_score = path_feasibility * path_impact

Where:
    path_feasibility = cumulative step-by-step prerequisite satisfaction
    path_impact = blast radius and asset exposure value
"""

import json
import logging
import uuid
import math
from typing import List, Dict, Any, Optional
from graph.algorithms import shortest_attack_paths, blast_radius_analysis
from reasoning.exploit_chains import evaluate_finding_feasibility

logger = logging.getLogger("lattice9-graph-engine")


async def generate_attack_paths(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Generate ranked attack paths using Dijkstra multi-path traversal
    coupled with deep prerequisite validation audits.
    """
    # 1. Fetch shortest Weighted Dijkstra paths (Path of Least Resistance)
    paths = await shortest_attack_paths(driver, engagement_id, max_depth=6)

    # 2. Fallback to BFS if no weighted paths are discovered
    if not paths:
        paths = await _fallback_paths(driver, engagement_id)

    # 3. Prerequisite validation and trace enrichment
    enhanced = []
    
    async with driver.session(database="neo4j") as session:
        for path in paths[:20]:
            node_ids = path["node_ids"]
            node_names = path["node_names"]
            node_types = path["node_types"]
            
            terminal_id = node_ids[-1] if node_ids else None
            
            # Analyze target blast radius impact
            blast_score = 0.5
            if terminal_id:
                try:
                    blast = await blast_radius_analysis(driver, engagement_id, terminal_id, max_depth=2)
                    blast_score = blast.get("total_exposure_score", 0.5)
                except Exception:
                    pass

            # Step-by-step constraint satisfaction audit
            step_validations = []
            cumulative_penalty = 1.0
            is_constrained = False
            
            for idx, (nid, ntype, nname) in enumerate(zip(node_ids, node_types, node_names)):
                if ntype == "finding":
                    try:
                        res = await evaluate_finding_feasibility(session, nid)
                        step_validations.append({
                            "step_index": idx,
                            "node_id": nid,
                            "display_name": nname,
                            "blueprint": res["blueprint"],
                            "feasibility_score": res["feasibility_score"],
                            "satisfied": res["satisfied"],
                            "missing": res["missing"]
                        })
                        
                        # Apply step penalty to the overall path feasibility
                        # If a finding is highly constrained, its penalty drops the score
                        if res["missing"]:
                            is_constrained = True
                        
                        # Cumulative multiplication of exploit feasibility
                        # representing joint probability of path success
                        cumulative_penalty *= res["feasibility_score"]
                    except Exception as e:
                        logger.error(f"Error auditing step {nid}: {e}")
                        cumulative_penalty *= 0.5
            
            # Calculate final feasibility and priority scores
            # Feasibility is base Dijkstra confidence multiplied by prerequisite satisfaction
            base_conf = path["path_confidence"]
            feasibility = base_conf * cumulative_penalty
            
            # Penalize depth to favor shorter, cleaner paths
            depth_penalty = 1.0 / (1.0 + 0.1 * (path["depth"] - 1))
            feasibility *= depth_penalty

            blast_factor = min(1.0, blast_score / 10.0) if blast_score else 0.5
            final_priority = feasibility * (0.5 + 0.5 * blast_factor)

            enhanced.append({
                "node_names": node_names,
                "node_types": node_types,
                "node_ids": node_ids,
                "depth": path["depth"],
                "path_confidence": round(base_conf, 4),
                "feasibility": round(feasibility, 4),
                "impact": round(blast_factor, 4),
                "composite_score": round(final_priority, 4),
                "reasoning_trace": {
                    "is_constrained": is_constrained,
                    "step_validations": step_validations,
                    "blast_radius_exposure": round(blast_score, 4),
                    "depth_penalty_applied": round(depth_penalty, 4)
                }
            })

    # Sort enhanced paths by final priority
    enhanced.sort(key=lambda p: p["composite_score"], reverse=True)

    # Persist the enriched paths to PostgreSQL
    await _persist_paths(pg_pool, engagement_id, enhanced)

    logger.info(f"Generated {len(enhanced)} enriched attack paths for engagement {engagement_id}")
    return enhanced


async def _fallback_paths(driver, engagement_id: str) -> List[Dict]:
    """Fallback: BFS query to identify potential linkages."""
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (a:L9 {engagement_id: $engagement_id})
            MATCH (b:L9 {engagement_id: $engagement_id})
            WHERE a <> b
              AND a.entity_type IN ['service', 'host', 'endpoint']
              AND b.entity_type IN ['finding', 'vulnerability', 'objective']
            WITH a, b
            OPTIONAL MATCH p = shortestPath(
                (a)-[:HAS_FINDING|HOSTS|RESOLVES_TO|DEPENDS_ON|NETWORK_REACH*..6]-(b)
            )
            WHERE p IS NOT NULL
            RETURN
                [n IN nodes(p) | n.display_name] AS node_names,
                [n IN nodes(p) | n.entity_type] AS node_types,
                [n IN nodes(p) | n.id] AS node_ids,
                [n IN nodes(p) | coalesce(toFloat(n.confidence), 0.5)] AS node_confidences,
                [r IN relationships(p) | type(r)] AS rel_types,
                length(p) AS depth,
                reduce(conf = 1.0, n IN nodes(p) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS path_confidence,
                reduce(w = 0.0, r IN relationships(p) |
                    w + coalesce(toFloat(r.weight), 0.5)
                ) AS total_weight
            ORDER BY depth ASC, path_confidence DESC
            LIMIT 20
            """,
            engagement_id=engagement_id,
        )

        paths = []
        async for record in result:
            depth = record["depth"]
            total_weight = record["total_weight"]
            avg_weight = total_weight / max(depth, 1)
            composite_score = record["path_confidence"] * avg_weight

            paths.append({
                "node_names": record["node_names"],
                "node_types": record["node_types"],
                "node_ids": record["node_ids"],
                "node_confidences": record["node_confidences"],
                "rel_types": record["rel_types"],
                "rel_weights": [0.5] * len(record["rel_types"]),
                "depth": depth,
                "path_confidence": round(record["path_confidence"], 4),
                "composite_score": round(composite_score, 4),
            })
        return paths


async def _persist_paths(pg_pool, engagement_id: str, paths: List[Dict]):
    """Persist validated paths to PostgreSQL."""
    async with pg_pool.acquire() as conn:
        # Clear existing paths for this engagement to prevent duplicates
        await conn.execute(
            "DELETE FROM attack_paths WHERE engagement_id = $1",
            engagement_id
        )

        for path in paths:
            entry_id = path["node_ids"][0] if path["node_ids"] else None
            obj_id = path["node_ids"][-1] if path["node_ids"] else None

            # Generate unique path ID
            path_id = str(uuid.uuid4())

            await conn.execute(
                """
                INSERT INTO attack_paths
                    (id, engagement_id, entry_entity_id, objective_entity_id,
                     title, confidence, feasibility, impact, priority,
                     state, reasoning_trace, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'candidate', $10, NOW())
                """,
                path_id,
                engagement_id,
                entry_id,
                obj_id,
                f"Path: {' → '.join(path['node_names'][:4])}",
                str(path["path_confidence"]),
                str(path["feasibility"]),
                str(path["impact"]),
                str(path["composite_score"]),
                json.dumps(path["reasoning_trace"]),
            )
