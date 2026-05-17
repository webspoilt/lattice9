"""
Topological Blast Radius Engine v2 — Graph-native damage propagation.

Computes actual damage potential of a compromise through the infrastructure graph.

Unlike CVSS (static, environment-agnostic), topological blast radius:
- Propagates through dependency chains
- Models privilege inheritance
- Computes credential cascade risk
- Measures trust contamination spread
- Accounts for graph topology (centrality, connectivity)

Formula:

    BlastRadius(v) = Σ (ExposurePropagation(v→w) × PrivilegeInheritance(w))
                     for all w reachable from v

Where:
    ExposurePropagation(v→w) = Π(edge.confidence along path)
                               × Π(path[node].attenuation)
    PrivilegeInheritance(w) = centrality(w) × data_sensitivity(w)
"""

import logging
import math
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("lattice9-graph-engine")

PRIVILEGE_WEIGHTS = {
    "host": 0.6,
    "service": 0.5,
    "endpoint": 0.4,
    "identity": 0.8,
    "credential": 0.9,
    "finding": 0.3,
    "evidence": 0.1,
    "vulnerability": 0.4,
    "trust_zone": 0.7,
    "objective": 1.0,
}

PROPAGATION_DECAY = 0.85  # Each hop reduces exposure by 15%


async def compute_blast_radius(driver, engagement_id: str, source_node_id: str) -> Dict:
    """
    Compute comprehensive topological blast radius from a source node.

    Returns:
    - Total exposure score (normalized [0, 1])
    - Downstream nodes grouped by distance
    - Privilege inheritance chains
    - Credential cascade risk
    - Trust contamination score
    - Critical path analysis
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (source:L9 {id: $source_id, engagement_id: $engagement_id})
            MATCH path = (source)-[:HOSTS|DEPENDS_ON|TRUSTS|AUTHENTICATES_TO|HAS_FINDING|NETWORK_REACH|DATA_FLOW|PRIVILEGE_ESCALATION*1..5]->(target:L9)
            WHERE source <> target
            RETURN
                target.id AS node_id,
                target.display_name AS display_name,
                target.entity_type AS entity_type,
                coalesce(toFloat(target.confidence), 0.5) AS confidence,
                [n IN nodes(path) | n.id] AS path_ids,
                length(path) AS distance,
                reduce(conf = 1.0, n IN nodes(path) |
                    conf * coalesce(toFloat(n.confidence), 0.5)
                ) AS propagation_probability,
                [r IN relationships(path) | type(r)] AS edge_types
            ORDER BY propagation_probability DESC
            """,
            source_id=source_node_id,
            engagement_id=engagement_id,
        )

        downstream = []
        async for record in result:
            downstream.append({
                "node_id": record["node_id"],
                "display_name": record["display_name"],
                "entity_type": record["entity_type"],
                "confidence": record["confidence"],
                "distance": record["distance"],
                "propagation_probability": round(record["propagation_probability"], 4),
                "edge_types": record["edge_types"],
            })

    if not downstream:
        return {"total_exposure_score": 0, "downstream_count": 0}

    # Aggregate by distance
    by_distance = {}
    for d in downstream:
        dist = d["distance"]
        if dist not in by_distance:
            by_distance[dist] = []
        by_distance[dist].append(d)

    # Compute privilege inheritance
    privilege_chains = []
    for d in downstream[:20]:
        priv_weight = PRIVILEGE_WEIGHTS.get(d["entity_type"], 0.3)
        inherited_privilege = d["propagation_probability"] * priv_weight
        d["inherited_privilege"] = round(inherited_privilege, 4)
        if inherited_privilege > 0.3:
            privilege_chains.append(d)

    # Credential cascade: how many services are reachable via credential edges
    credential_reach = [d for d in downstream if "AUTHENTICATES_TO" in d.get("edge_types", [])]

    # Trust contamination: trust relationship propagation
    trust_contamination = [d for d in downstream if "TRUSTS" in d.get("edge_types", [])]

    # Total exposure score: weighted sum of propagation probabilities
    # Higher = compromise of source has widespread impact
    total_exposure = sum(
        d["propagation_probability"] * (PROPAGATION_DECAY ** (d["distance"] - 1))
        for d in downstream
    )
    # Normalize
    max_possible = sum(PROPAGATION_DECAY ** i for i in range(5)) * 10
    normalized_exposure = min(1.0, total_exposure / max_possible) if max_possible > 0 else 0

    return {
        "source_node_id": source_node_id,
        "downstream_count": len(downstream),
        "total_exposure_score": round(normalized_exposure, 4),
        "max_depth": max(d["distance"] for d in downstream) if downstream else 0,
        "exposure_by_distance": {
            str(d): len(nodes) for d, nodes in sorted(by_distance.items())
        },
        "privilege_chains": len(privilege_chains),
        "privilege_details": privilege_chains[:5],
        "credential_cascade_count": len(credential_reach),
        "trust_contamination_count": len(trust_contamination),
        "downstream": downstream[:20],
    }


async def compute_topological_blast_all(driver, engagement_id: str) -> List[Dict]:
    """
    Compute blast radius for all critical nodes in the graph.
    Returns ranked list of nodes by their damage potential.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['credential', 'identity', 'service', 'host']
               RETURN n.id AS node_id, n.display_name AS display_name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
               ORDER BY n.entity_type
            """,
            engagement_id=engagement_id,
        )

        candidates = []
        async for record in result:
            candidates.append({
                "id": record["node_id"],
                "name": record["display_name"],
                "type": record["entity_type"],
                "confidence": record["confidence"],
            })

    results = []
    for candidate in candidates[:20]:  # Limit to 20 for performance
        blast = await compute_blast_radius(driver, engagement_id, candidate["id"])
        results.append({
            "node": candidate,
            "blast_score": blast["total_exposure_score"],
            "downstream_count": blast["downstream_count"],
            "credential_cascade_count": blast["credential_cascade_count"],
            "privilege_chains": blast["privilege_chains"],
        })

    return sorted(results, key=lambda r: r["blast_score"], reverse=True)


async def compute_credential_cascade_risk(driver, engagement_id: str) -> Dict:
    """
    Compute credential cascade risk: if one credential is compromised,
    how many services become reachable?

    Models credential reuse, shared secrets, and trust propagation.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """
            MATCH (cred:L9 {engagement_id: $engagement_id, entity_type: 'credential'})
            OPTIONAL MATCH (cred)-[:AUTHENTICATES_TO*1..3]->(svc:L9)
            WITH cred, collect(DISTINCT svc.id) AS reachable_services,
                 count(DISTINCT svc) AS service_count
            RETURN cred.id AS credential_id,
                   cred.display_name AS credential_name,
                   service_count,
                   reachable_services
            ORDER BY service_count DESC
            LIMIT 20
            """,
            engagement_id=engagement_id,
        )

        credentials = []
        total_services = set()
        async for record in result:
            cred_id = record["credential_id"]
            services = record.get("reachable_services") or []
            total_services.update(services)
            credentials.append({
                "credential_id": cred_id,
                "credential_name": record["credential_name"],
                "reachable_service_count": record["service_count"],
            })

        # Cascade risk: what fraction of the graph can one credential reach?
        total_infra = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               WHERE n.entity_type IN ['service', 'host', 'endpoint']
               RETURN count(n) AS count""",
            engagement_id=engagement_id,
        )
        total = await total_infra.single()
        total_infra_count = total["count"] if total else 1

        cascade_risk = len(total_services) / max(total_infra_count, 1)

        return {
            "total_credentials": len(credentials),
            "total_reachable_services": len(total_services),
            "cascade_risk_score": round(cascade_risk, 4),
            "avg_services_per_credential": round(
                sum(c["reachable_service_count"] for c in credentials) / max(len(credentials), 1), 2
            ) if credentials else 0,
            "top_credentials": credentials[:10],
        }
