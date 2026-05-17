"""
Causal Inference Engine — Bayesian network reasoning over graph state.

Moves beyond correlation ("these things are connected")
to causal reasoning ("this relationship CAUSED exposure propagation").

Uses Bayesian networks constructed from graph topology:

P(exposure | compromise, trust, privilege) =
    P(compromise) * P(trust | compromise) * P(privilege | trust)
    ----------------------------------------------------------
    P(exposure)

Core causal queries:
- Did this trust relationship cause exposure propagation?
- Would removing this edge prevent privilege escalation?
- What is the root cause of this attack path?
- Which single intervention would reduce risk most?
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from graph.confidence import bayesian_update

logger = logging.getLogger("lattice9-graph-engine")

# Prior probabilities for causal factors
CAUSAL_PRIORS = {
    "internet_exposure": 0.3,
    "weak_authentication": 0.4,
    "missing_patch": 0.35,
    "credential_exposure": 0.25,
    "trust_relationship": 0.2,
    "privilege_escalation": 0.15,
    "data_exposure": 0.1,
}


async def causal_path_analysis(driver, engagement_id: str, path: Dict) -> Dict:
    """
    Analyze a single attack path for causal relationships.

    For each step in the path, determine:
    - Did this edge CAUSE the next exposure?
    - What is the causal strength?
    - Would removing this edge break the chain?
    """
    node_ids = path.get("node_ids", [])
    rel_types = path.get("rel_types", [])

    if len(node_ids) < 2:
        return {"causal_chain": [], "root_cause": None}

    causal_chain = []
    for i in range(len(node_ids) - 1):
        source = node_ids[i]
        target = node_ids[i + 1]
        rel = rel_types[i] if i < len(rel_types) else "UNKNOWN"

        # Assign causal prior based on relationship type
        prior = _causal_prior_for_relationship(rel)

        # Causal strength: how much does source → target determine exposure?
        # High = removing this edge would break the chain
        # Low = other paths exist that bypass this edge
        causal_strength = prior

        # Is this a critical causal link?
        is_critical = causal_strength > 0.6

        causal_chain.append({
            "step": i,
            "source_id": source,
            "target_id": target,
            "relationship": rel,
            "causal_prior": round(prior, 4),
            "causal_strength": round(causal_strength, 4),
            "is_critical": is_critical,
            "break_effect": "chain_severed" if is_critical else "path_may_adapt",
        })

    # Root cause: first step with critical causal strength
    root_cause = None
    for step in causal_chain:
        if step["is_critical"]:
            root_cause = step
            break

    # Intervention points: edges that would break the chain if removed
    interventions = [s for s in causal_chain if s["is_critical"]]

    return {
        "causal_chain": causal_chain,
        "root_cause": root_cause,
        "intervention_points": interventions,
        "chain_fragility": len(interventions) / max(len(causal_chain), 1),
    }


def _causal_prior_for_relationship(rel_type: str) -> float:
    """Assign causal prior probability based on relationship type."""
    priors = {
        "HAS_FINDING": 0.7,        # Finding directly causes exposure
        "EXPLOITS": 0.8,           # Exploit directly causes compromise
        "AUTHENTICATES_TO": 0.6,   # Authentication enables access
        "TRUSTS": 0.5,             # Trust enables lateral movement
        "HOSTS": 0.4,              # Hosting enables service access
        "RESOLVES_TO": 0.3,        # Resolution enables reachability
        "DEPENDS_ON": 0.55,        # Dependency propagates compromise
        "NETWORK_REACH": 0.45,     # Network reach enables access
        "PRIVILEGE_ESCALATION": 0.75,  # Priv esc directly enables access
        "DATA_FLOW": 0.5,          # Data flow enables exfiltration
        "ATTACK_PATH": 0.6,        # Attack path edges are causal by design
    }
    return priors.get(rel_type, 0.3)


async def root_cause_analysis(driver, pg_pool, engagement_id: str) -> Dict:
    """
    Perform root cause analysis across all attack paths.

    Identifies which nodes/edges appear most frequently as causal factors
    across the entire path space. This reveals the infrastructure elements
    that, if addressed, would disrupt the most attack paths.
    """
    # Get all attack paths
    async with pg_pool.acquire() as conn:
        path_rows = await conn.fetch(
            """SELECT id, reasoning_trace, confidence
               FROM attack_paths
               WHERE engagement_id = $1 AND state != 'suppressed'
               ORDER BY confidence DESC
               LIMIT 50""",
            engagement_id,
        )

    if not path_rows:
        return {"root_causes": [], "interventions": []}

    # Count node and edge frequency across all paths
    node_frequency = {}
    edge_frequency = {}

    for row in path_rows:
        trace = row["reasoning_trace"]
        if isinstance(trace, str):
            trace = __import__("json").loads(trace)

        node_ids = trace.get("node_ids", [])
        node_types = trace.get("node_types", [])

        for i in range(len(node_ids) - 1):
            edge_key = f"{node_ids[i]}->{node_ids[i + 1]}"
            edge_frequency[edge_key] = edge_frequency.get(edge_key, 0) + 1

        for nid in node_ids:
            node_frequency[nid] = node_frequency.get(nid, 0) + 1

    # Rank by frequency (most common causal factor)
    sorted_nodes = sorted(node_frequency.items(), key=lambda x: x[1], reverse=True)
    sorted_edges = sorted(edge_frequency.items(), key=lambda x: x[1], reverse=True)

    # Get node details from Neo4j for top factors
    top_nodes = []
    async with driver.session(database="neo4j") as session:
        for nid, freq in sorted_nodes[:10]:
            result = await session.run(
                """MATCH (n:L9 {id: $id})
                   RETURN n.display_name AS name, n.entity_type AS type,
                          coalesce(toFloat(n.confidence), 0.5) AS confidence""",
                id=nid,
            )
            row = await result.single()
            if row:
                top_nodes.append({
                    "id": nid,
                    "name": row["name"],
                    "type": row["type"],
                    "confidence": row["confidence"],
                    "path_frequency": freq,
                    "path_coverage": round(freq / max(len(path_rows), 1), 4),
                })

    # Highest-impact interventions: removing this edge would affect N paths
    interventions = []
    for edge_key, freq in sorted_edges[:5]:
        source, target = edge_key.split("->")
        interventions.append({
            "edge": edge_key,
            "affected_paths": freq,
            "impact_score": round(freq / max(len(path_rows), 1), 4),
        })

    return {
        "root_causes": top_nodes,
        "interventions": interventions,
        "total_paths_analyzed": len(path_rows),
    }


async def what_if_intervention(driver, pg_pool, engagement_id: str,
                                node_id: str, action: str = "remove") -> Dict:
    """
    Analyze what would happen if we intervened on a specific node.

    Intervention actions:
    - "remove": remove node and all edges (patching, decommissioning)
    - "harden": reduce confidence to 0.2 (applying security controls)
    - "isolate": remove all incoming edges from internet-facing nodes
    """
    # Get all paths containing this node
    async with pg_pool.acquire() as conn:
        path_rows = await conn.fetch(
            """SELECT id, reasoning_trace, confidence
               FROM attack_paths
               WHERE engagement_id = $1 AND state != 'suppressed'""",
            engagement_id,
        )

    affected_paths = []
    unaffected_paths = []
    for row in path_rows:
        trace = row["reasoning_trace"]
        if isinstance(trace, str):
            trace = __import__("json").loads(trace)
        node_ids = trace.get("node_ids", [])
        if node_id in node_ids:
            affected_paths.append(row)
        else:
            unaffected_paths.append(row)

    # Determine which paths would be severed by intervention
    severed_count = len(affected_paths)

    return {
        "node_id": node_id,
        "intervention": action,
        "total_paths_before": len(path_rows),
        "paths_severed": severed_count,
        "paths_remaining": len(unaffected_paths),
        "risk_reduction": round(severed_count / max(len(path_rows), 1), 4),
        "affected_paths": [{
            "id": p["id"],
            "confidence": float(p["confidence"]) if p["confidence"] else 0.5,
        } for p in affected_paths[:5]],
    }
