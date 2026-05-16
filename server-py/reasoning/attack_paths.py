"""
Attack Path Inference — Weighted multi-path analysis with composite scoring.

Scores paths by:
    composite_score = path_confidence * avg_edge_weight * blast_radius_factor

Where:
    path_confidence = Π(node.confidence for node in path)
    avg_edge_weight = Σ(edge.weight) / len(path)
    blast_radius_factor = min(1.0, Σ(exposed_node.confidence) / max_possible)
"""

import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from graph.algorithms import shortest_attack_paths, blast_radius_analysis

logger = logging.getLogger("lattice9-graph-engine")


async def generate_attack_paths(driver, pg_pool, engagement_id: str) -> List[Dict]:
    """
    Generate ranked attack paths using multi-strategy approach:
    1. Weighted shortest path (primary)
    2. Breadth-first traversal (fallback)
    3. Composite scoring + blast radius enhancement
    """
    # Strategy 1: Weighted shortest paths
    paths = await shortest_attack_paths(driver, engagement_id, max_depth=6)

    # Strategy 2: If no paths with weighted traversal, try exhaustive
    if not paths:
        paths = await _fallback_paths(driver, engagement_id)

    # Enhance paths with blast radius data
    enhanced = []
    for path in paths[:20]:
        # Get blast radius from the terminal node (most critical)
        terminal_id = path["node_ids"][-1] if path["node_ids"] else None

        blast_score = 0.5  # default
        if terminal_id:
            try:
                blast = await blast_radius_analysis(driver, engagement_id, terminal_id, max_depth=2)
                blast_score = blast.get("total_exposure_score", 0.5)
            except Exception:
                pass

        # Composite score
        composite = path["composite_score"]
        blast_factor = min(1.0, blast_score)
        final_score = composite * (0.7 + 0.3 * blast_factor)

        enhanced.append({
            "node_names": path["node_names"],
            "node_types": path["node_types"],
            "node_ids": path["node_ids"],
            "depth": path["depth"],
            "path_confidence": path["path_confidence"],
            "composite_score": round(final_score, 4),
            "blast_radius_factor": round(blast_factor, 4),
        })

    # Sort by composite score
    enhanced.sort(key=lambda p: p["composite_score"], reverse=True)

    # Persist to PostgreSQL
    await _persist_paths(pg_pool, engagement_id, enhanced)

    logger.info(f"Generated {len(enhanced)} attack paths for engagement {engagement_id}")
    return enhanced


async def _fallback_paths(driver, engagement_id: str) -> List[Dict]:
    """Fallback: exhaustive shortest path search."""
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
                "depth": depth,
                "path_confidence": round(record["path_confidence"], 4),
                "composite_score": round(composite_score, 4),
            })
        return paths


async def _persist_paths(pg_pool, engagement_id: str, paths: List[Dict]):
    """Write attack paths to PostgreSQL."""
    async with pg_pool.acquire() as conn:
        for path in paths:
            entry_id = path["node_ids"][0] if path["node_ids"] else None
            obj_id = path["node_ids"][-1] if path["node_ids"] else None

            await conn.execute(
                """
                INSERT INTO attack_paths
                    (id, engagement_id, entry_entity_id, objective_entity_id,
                     title, confidence, feasibility, impact, priority,
                     state, reasoning_trace, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'candidate', $10, NOW())
                ON CONFLICT (id) DO NOTHING
                """,
                str(uuid.uuid4()),
                engagement_id,
                entry_id,
                obj_id,
                f"Path: {' → '.join(path['node_names'][:5])}",
                str(path["path_confidence"]),
                str(path["path_confidence"] * 0.8),
                str(min(1.0, path.get("blast_radius_factor", 0.5) * 1.2)),
                str(path["composite_score"]),
                json.dumps({
                    "node_names": path["node_names"],
                    "node_types": path["node_types"],
                    "node_ids": path["node_ids"],
                    "depth": path["depth"],
                    "composite_score": path["composite_score"],
                }),
            )
