"""
Lattice9 Graph Intelligence Engine — FastAPI Application

Endpoints:
  POST /analyze/{engagement_id}    — Full intelligence pipeline
  GET  /health                     — Health check
  POST /events/{engagement_id}     — Event-driven re-analysis
  GET  /snapshots/{engagement_id}  — Temporal snapshots
  GET  /algorithms/{engagement_id} — Graph algorithm results
"""

import asyncio
import json
import logging
import uuid
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, BackgroundTasks, Query
from neo4j import AsyncGraphDatabase
import redis.asyncio as aioredis

from config import (
    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD,
    REDIS_URL, LATTICE9_ENGINE_KEY, ENGINE_VERSION, logger,
)
from db import get_pg_pool, close_pg_pool
from models import AnalysisRequest
from graph.schema import ensure_constraints
from graph.engine import (
    merge_entity_node, merge_finding_node, merge_evidence_node,
    link_finding_to_entity, create_relationship, delete_engagement_graph,
    get_graph_summary,
)
from graph.algorithms import (
    shortest_attack_paths, bfs_traversal, influence_propagation_fallback,
    blast_radius_analysis, centrality_analysis, privilege_chain_synthesis,
    exposure_diffusion, get_full_topology,
)
from graph.temporal import (
    create_snapshot, compute_temporal_diff, record_diffs,
    get_exposure_evolution, detect_infrastructure_mutations,
)
from graph.confidence import (
    propagate_confidence_to_graph, recalculate_finding_confidence,
    temporal_decay, bayesian_update,
)
from reasoning.attack_paths import generate_attack_paths
from reasoning.exploit_chains import synthesize_exploit_chains, compute_exploit_feasibility
from reasoning.prioritization import prioritize_findings, prioritize_attack_paths
from evidence.lineage import (
    create_evidence_chain, get_evidence_provenance,
    get_finding_evidence_chain, get_engagement_evidence_lineage,
)
from graph.evolution import (
    compute_infrastructure_evolution, compute_surface_entropy,
    compute_trust_drift, compute_credential_spread,
    compute_topology_instability,
)
from reasoning.counterfactual import (
    simulate_credential_compromise, simulate_edge_removal,
    simulate_defense_addition, simulate_comprehensive_scenario,
)
from reasoning.entropy import (
    compute_path_entropy, compute_privilege_inevitability,
    compute_graph_ambiguity, collapse_by_entropy_threshold,
)
from reasoning.causal import (
    causal_path_analysis, root_cause_analysis, what_if_intervention,
)
from graph.blast import (
    compute_blast_radius, compute_topological_blast_all,
    compute_credential_cascade_risk,
)
from graph.field_theory import (
    compute_field_density, compute_field_gradients,
    compute_privilege_diffusion, recompute_field_after_mutation,
)
from graph.resistance import (
    compute_edge_resistance, compute_resistance_map,
    resistance_weighted_paths, compute_segmentation_conductivity,
)
from graph.wave_propagation import (
    simulate_wave_propagation, compute_propagation_velocity,
    compute_wave_amplification_regions,
)
from reasoning.adversarial_game import (
    compute_minimax_traversal, approximate_nash_equilibrium,
    adaptive_attack_path_recomputation,
)
from reasoning.attack_economics import (
    compute_path_economics, rank_paths_by_utility,
    compute_stealth_optimal_paths, compute_attack_campaign_economics,
)
from graph.topological_da import (
    compute_persistent_homology, compute_simplicial_complexes,
    detect_graph_voids,
)
from graph.gnn_reasoning import (
    compute_node_embeddings, predict_hidden_relationships,
    compute_privilege_escalation_prediction,
)
from graph.attractor_theory import (
    compute_compromise_attractors, compute_attractor_instability,
    compute_compromise_inevitability,
)
from graph.information_geometry import (
    compute_geodesic_paths, compute_manifold_curvature,
    compute_gradient_descent_path,
)
from proxima.api import router as proxima_router


class IntelligenceEngine:
    """Orchestrates all graph intelligence operations."""

    def __init__(self):
        self.driver = None
        self.redis = None
        self._init_driver()
        self._init_redis()

    def _init_driver(self):
        if all([NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD]):
            try:
                self.driver = AsyncGraphDatabase.driver(
                    NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD),
                    max_connection_pool_size=10,
                    connection_acquisition_timeout=30,
                )
                logger.info("Neo4j driver initialized (pool: 10)")
            except Exception as e:
                logger.error(f"Neo4j init failed: {e}")

    def _init_redis(self):
        if REDIS_URL:
            try:
                self.redis = aioredis.from_url(REDIS_URL, max_connections=10)
                logger.info("Redis client initialized")
            except Exception as e:
                logger.error(f"Redis init failed: {e}")

    async def close(self):
        if self.driver:
            await self.driver.close()
        if self.redis:
            await self.redis.close()
        await close_pg_pool()

    async def run_full_analysis(self, engagement_id: str, run_id: str = None):
        """
        Full intelligence pipeline:
        1. Schema constraints
        2. Entity/evidence correlation → Neo4j
        3. Relationship inference
        4. Confidence propagation
        5. Attack path generation
        6. Temporal snapshot
        7. Prioritization
        8. Drift detection + Redis publish
        """
        logger.info(f"=== Full analysis pipeline start: {engagement_id} (run={run_id}) ===")

        if not self.driver:
            logger.error("Neo4j unavailable, aborting")
            return

        await ensure_constraints(self.driver)
        pg_pool = await get_pg_pool()
        if not pg_pool:
            logger.error("PostgreSQL unavailable, aborting")
            return

        try:
            # Step 1-3: Correlate entities and infer relationships
            await self._correlate_all(engagement_id, pg_pool)

            # Step 4: Propagate confidence through the graph
            await propagate_confidence_to_graph(self.driver, engagement_id)

            # Step 5: Generate attack paths
            paths = await generate_attack_paths(self.driver, pg_pool, engagement_id)

            # Step 6: Capture temporal snapshot
            try:
                snapshot_id = await create_snapshot(self.driver, pg_pool, engagement_id)
                logger.info(f"Snapshot captured: {snapshot_id}")
            except Exception as e:
                logger.warning(f"Snapshot capture failed (non-fatal): {e}")
                snapshot_id = None

            # Step 7: Prioritize findings
            try:
                prioritized = await prioritize_findings(self.driver, pg_pool, engagement_id)
                logger.info(f"Prioritized {len(prioritized)} findings")
            except Exception as e:
                logger.warning(f"Prioritization failed (non-fatal): {e}")

            # Step 8: Drift detection + Redis notification
            if self.redis:
                await self.redis.publish(
                    "drift.detected",
                    json.dumps({
                        "engagement_id": engagement_id,
                        "run_id": run_id,
                        "path_count": len(paths),
                        "snapshot_id": snapshot_id,
                        "timestamp": str(uuid.uuid1()),
                    })
                )

            summary = await get_graph_summary(self.driver, engagement_id)
            logger.info(f"=== Analysis complete: {engagement_id} === {summary}")

        except Exception as e:
            logger.error(f"Analysis pipeline failed: {e}", exc_info=True)
        finally:
            await pg_pool.close()

    async def _correlate_all(self, engagement_id: str, pg_pool):
        """Fetch all data from PostgreSQL and merge into Neo4j graph."""
        async with pg_pool.acquire() as conn:
            # Fetch entities
            entity_rows = await conn.fetch(
                """SELECT id, entity_type, canonical_key, display_name,
                          confidence::text, first_seen_at, last_seen_at,
                          valid_from, valid_to, attributes::text
                   FROM entities WHERE engagement_id = $1""",
                engagement_id,
            )

            # Fetch findings
            finding_rows = await conn.fetch(
                """SELECT f.id, f.title, f.severity, f.confidence::text,
                          f.validation_state, f.cwe, f.affected_entity_id,
                          f.first_seen_at, f.last_seen_at,
                          COALESCE(e.display_name, 'unknown') AS entity_name,
                          COALESCE(e.canonical_key, 'unknown') AS entity_key
                   FROM findings f
                   LEFT JOIN entities e ON f.affected_entity_id = e.id
                   WHERE f.engagement_id = $1""",
                engagement_id,
            )

            # Fetch evidence
            evidence_rows = await conn.fetch(
                """SELECT id, source_type, artifact_uri, sha256,
                          captured_at, metadata::text
                   FROM evidence_items WHERE engagement_id = $1""",
                engagement_id,
            )

        logger.info(
            f"Fetched {len(entity_rows)} entities, {len(finding_rows)} findings, "
            f"{len(evidence_rows)} evidence items"
        )

        if not entity_rows and not finding_rows:
            logger.info(f"No data for engagement {engagement_id}")
            return

        async with self.driver.session(database="neo4j") as session:
            # Merge entities
            for row in entity_rows:
                await merge_entity_node(session, dict(row), engagement_id)

            # Merge findings + link to affected entities
            for f in finding_rows:
                await merge_finding_node(session, dict(f), engagement_id)
                if f["affected_entity_id"]:
                    await link_finding_to_entity(
                        session,
                        str(f["id"]),
                        str(f["affected_entity_id"]),
                        float(f["confidence"]) if f["confidence"] else 0.5,
                        f["last_seen_at"],
                    )

            # Merge evidence
            for ev in evidence_rows:
                await merge_evidence_node(session, dict(ev), engagement_id)

            # Infer typed relationships
            await self._infer_relationships(session, entity_rows, engagement_id)

    async def _infer_relationships(self, session, entity_rows, engagement_id):
        """Infer typed relationships between entities."""
        by_type = {}
        for row in entity_rows:
            et = row["entity_type"]
            by_type.setdefault(et, []).append(row)

        # RESOLVES_TO: FQDN hosts → IP hosts
        hosts = by_type.get("host", [])
        for host in hosts:
            ck = host["canonical_key"]
            if not ck.replace(".", "").isdigit():
                for other in hosts:
                    ock = other["canonical_key"]
                    if ock.replace(".", "").isdigit():
                        await create_relationship(
                            session, str(host["id"]), str(other["id"]),
                            "RESOLVES_TO", 0.7,
                            {"inference_rule": "dns_resolution"},
                        )

        # HOSTS: services → hosts
        services = by_type.get("service", [])
        for svc in services:
            svc_key = svc["canonical_key"]
            for host in hosts:
                host_key = host["canonical_key"]
                if host_key in svc_key or svc_key.endswith(host_key):
                    await create_relationship(
                        session, str(host["id"]), str(svc["id"]),
                        "HOSTS", 0.8,
                        {"inference_rule": "key_containment"},
                    )

        # AUTHENTICATES_TO: credentials → services (by naming patterns)
        creds = by_type.get("credential", [])
        for cred in creds:
            cred_key = cred["canonical_key"].lower()
            for svc in services:
                svc_key = svc["canonical_key"].lower()
                if any(part in cred_key for part in svc_key.split(".")):
                    await create_relationship(
                        session, str(cred["id"]), str(svc["id"]),
                        "AUTHENTICATES_TO", 0.6,
                        {"inference_rule": "key_pattern_match"},
                    )

        logger.info(f"Inferred relationships for engagement {engagement_id}")


# Module-level singleton
engine = IntelligenceEngine()


# === FastAPI Application ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Lattice9 Engine v{ENGINE_VERSION} starting")
    yield
    logger.info("Engine shutting down")
    await engine.close()


app = FastAPI(
    title="Lattice9 Graph Intelligence Engine",
    version=ENGINE_VERSION,
    lifespan=lifespan,
)

app.include_router(proxima_router)


def verify_engine_key(x_lattice9_key: Optional[str] = Header(None)):
    if x_lattice9_key != LATTICE9_ENGINE_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# === API Endpoints ===

@app.post("/analyze/{engagement_id}")
async def analyze_engagement(
    engagement_id: str,
    request: AnalysisRequest,
    tasks: BackgroundTasks,
    x_lattice9_key: Optional[str] = Header(None),
):
    verify_engine_key(x_lattice9_key)
    logger.info(f"Analysis request: {engagement_id} (run={request.run_id})")
    tasks.add_task(engine.run_full_analysis, engagement_id, request.run_id)
    return {"status": "analysis_queued", "engagement_id": engagement_id, "run_id": request.run_id}


@app.post("/events/{engagement_id}")
async def event_driven_analysis(
    engagement_id: str,
    event_type: str = Query(..., description="Event type: evidence_added, finding_updated"),
    entity_id: str = Query(None, description="Affected entity ID"),
    tasks: BackgroundTasks = BackgroundTasks(),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Event-driven re-analysis for specific graph operations."""
    verify_engine_key(x_lattice9_key)

    if event_type == "evidence_added":
        tasks.add_task(engine.run_full_analysis, engagement_id, f"event_{event_type}")
    elif event_type == "finding_updated" and entity_id:
        pg_pool = await get_pg_pool()
        if pg_pool:
            await recalculate_finding_confidence(engine.driver, pg_pool, entity_id)
            await pg_pool.close()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown event: {event_type}")

    return {"status": "event_queued", "event_type": event_type}


@app.get("/snapshots/{engagement_id}")
async def list_snapshots(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        evolution = await get_exposure_evolution(engine.driver, pg_pool, engagement_id)
        return evolution
    finally:
        await pg_pool.close()


@app.get("/snapshots/{engagement_id}/drift")
async def get_drift_analysis(
    engagement_id: str,
    from_snapshot_id: str = Query(..., description="Source Snapshot UUID"),
    to_snapshot_id: str = Query(..., description="Target Snapshot UUID"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Compute structural graph drift and topology mutations between two snapshots."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        diff_data = await compute_temporal_diff(
            engine.driver, pg_pool, engagement_id, from_snapshot_id, to_snapshot_id
        )
        mutations = await detect_infrastructure_mutations(engine.driver, pg_pool, engagement_id)
        return {"diff": diff_data, "mutations": mutations}
    except Exception as e:
        logger.error(f"Error computing snapshot drift: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/snapshots/{engagement_id}/replay/{path_id}")
async def replay_attack_path(
    engagement_id: str,
    path_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Perform a step-by-step playback simulation of an attack path with dynamic prerequisite audits."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        async with pg_pool.acquire() as conn:
            path_row = await conn.fetchrow(
                "SELECT * FROM attack_paths WHERE id = $1 AND engagement_id = $2",
                path_id, engagement_id
            )
            if not path_row:
                raise HTTPException(status_code=404, detail="Attack path not found")
            
            trace = json.loads(path_row["reasoning_trace"])
            step_validations = trace.get("step_validations", [])
            total_economic_cost = trace.get("total_economic_cost", 0.0)
            total_detection_risk = trace.get("total_detection_risk", 0.0)
            
            return {
                "path_id": path_id,
                "title": path_row["title"],
                "confidence": float(path_row["confidence"]),
                "feasibility": float(path_row["feasibility"]),
                "attacker_roi": float(path_row.get("attacker_roi") or 0.0),
                "steps_timeline": step_validations,
                "aggregated_cost": total_economic_cost,
                "aggregated_detection_risk": total_detection_risk,
                "status": "simulation_ready"
            }
    except Exception as e:
        logger.error(f"Error replaying attack path {path_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/algorithms/{engagement_id}")
async def get_algorithm_results(
    engagement_id: str,
    algorithm: str = Query("centrality", description="Algorithm: centrality, influence, blast, privilege, exposure"),
    node_id: str = Query(None, description="Node ID for blast radius analysis"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Run and return graph algorithm results."""
    verify_engine_key(x_lattice9_key)

    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    if algorithm == "centrality":
        result = await centrality_analysis(engine.driver, engagement_id)
    elif algorithm == "influence":
        result = await influence_propagation_fallback(engine.driver, engagement_id)
    elif algorithm == "blast" and node_id:
        result = await blast_radius_analysis(engine.driver, engagement_id, node_id)
    elif algorithm == "privilege":
        result = await privilege_chain_synthesis(engine.driver, engagement_id)
    elif algorithm == "exposure":
        result = await exposure_diffusion(engine.driver, engagement_id)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown algorithm or missing node_id")

    return {"engagement_id": engagement_id, "algorithm": algorithm, "result": result}


@app.get("/algorithms/{engagement_id}/topology")
async def get_topology(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    """Retrieve full graph nodes and link connections for high-density UI rendering."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        topo = await get_full_topology(engine.driver, engagement_id)
        return topo
    except Exception as e:
        logger.error(f"Error fetching full topology: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/algorithms/{engagement_id}/paths")
async def get_attack_paths(
    engagement_id: str,
    max_depth: int = Query(6, description="Max path depth"),
    x_lattice9_key: Optional[str] = Header(None),
):
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    paths = await shortest_attack_paths(engine.driver, engagement_id, max_depth=max_depth)
    return {"engagement_id": engagement_id, "paths": paths, "total": len(paths)}


@app.get("/algorithms/{engagement_id}/exploit-chains")
async def get_exploit_chains(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    chains = await synthesize_exploit_chains(engine.driver, engagement_id)
    return {"engagement_id": engagement_id, "exploit_chains": chains, "total": len(chains)}


@app.get("/evidence/{engagement_id}/lineage")
async def get_lineage(engagement_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        lineage = await get_engagement_evidence_lineage(pg_pool, engagement_id)
        return lineage
    finally:
        await pg_pool.close()


@app.get("/evidence/{evidence_id}/provenance")
async def get_provenance(evidence_id: str, x_lattice9_key: Optional[str] = Header(None)):
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        provenance = await get_evidence_provenance(pg_pool, evidence_id)
        return provenance
    finally:
        await pg_pool.close()


@app.get("/evidence/{finding_id}/pedigree")
async def get_evidence_pedigree(finding_id: str, x_lattice9_key: Optional[str] = Header(None)):
    """Retrieve derived pedigree recursion lineage representing ancestor nodes leading to the confidence state."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        # Retrieve supporting and contradicting ancestors recursively
        chain_data = await get_finding_evidence_chain(pg_pool, finding_id)
        
        # Traverse for each supporting evidence's pedigree trace
        detailed_pedigrees = []
        for evidence in chain_data.get("supporting_evidence", []):
            prov = await get_evidence_provenance(pg_pool, evidence["id"])
            if "pedigree_ancestry" in prov:
                detailed_pedigrees.extend(prov["pedigree_ancestry"])
                
        return {
            "finding_id": finding_id,
            "evidence_chain": chain_data,
            "pedigree_genealogy": detailed_pedigrees,
            "net_genealogy_count": len(detailed_pedigrees)
        }
    except Exception as e:
        logger.error(f"Error fetching pedigree genealogy for {finding_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


# ==== Evolution Engine Endpoints ====

@app.get("/evolution/{engagement_id}")
async def get_evolution(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Temporal Graph Memory — infrastructure evolution, surface entropy, trust drift."""
    verify_engine_key(x_lattice9_key)
    pg_pool = await get_pg_pool()
    try:
        evolution = await compute_infrastructure_evolution(
            engine.driver, pg_pool, engagement_id
        )
        surface_entropy = await compute_surface_entropy(
            engine.driver, engagement_id
        )
        trust_drift = await compute_trust_drift(
            engine.driver, pg_pool, engagement_id
        )
        cred_spread = await compute_credential_spread(
            engine.driver, engagement_id
        )
        topo_instability = await compute_topology_instability(
            engine.driver, pg_pool, engagement_id
        )
        return {
            "infrastructure_evolution": evolution,
            "surface_entropy": surface_entropy,
            "trust_drift": trust_drift,
            "credential_spread": cred_spread,
            "topology_instability": topo_instability,
        }
    except Exception as e:
        logger.error(f"Evolution analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


# ==== Counterfactual Engine Endpoints ====

@app.post("/counterfactual/{engagement_id}/credential-compromise")
async def cf_credential_compromise(
    engagement_id: str,
    credential_id: str = Query(..., description="Credential node ID"),
    compromised_since: str = Query(None, description="ISO timestamp of compromise"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """What-if: simulate a credential being compromised."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await simulate_credential_compromise(
            engine.driver, pg_pool, engagement_id, credential_id, compromised_since
        )
        return result
    except Exception as e:
        logger.error(f"Counterfactual simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.post("/counterfactual/{engagement_id}/edge-removal")
async def cf_edge_removal(
    engagement_id: str,
    source_id: str = Query(..., description="Source node ID of the edge"),
    target_id: str = Query(..., description="Target node ID of the edge"),
    rel_type: str = Query(..., description="Relationship type"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """What-if: simulate removing a relationship edge."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await simulate_edge_removal(
            engine.driver, pg_pool, engagement_id, source_id, target_id, rel_type
        )
        return result
    except Exception as e:
        logger.error(f"Edge removal simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.post("/counterfactual/{engagement_id}/defense-addition")
async def cf_defense_addition(
    engagement_id: str,
    node_id: str = Query(..., description="Node ID to apply defense to"),
    defense_type: str = Query("mfa", description="Defense type: mfa, patch, segmentation, monitoring"),
    effectiveness: float = Query(0.8, description="Defense effectiveness [0,1]"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """What-if: simulate adding a defense control."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await simulate_defense_addition(
            engine.driver, pg_pool, engagement_id, node_id, defense_type, effectiveness
        )
        return result
    except Exception as e:
        logger.error(f"Defense simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.post("/counterfactual/{engagement_id}/comprehensive")
async def cf_comprehensive(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Full counterfactual scenario sweep."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await simulate_comprehensive_scenario(
            engine.driver, pg_pool, engagement_id
        )
        return result
    except Exception as e:
        logger.error(f"Comprehensive simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


# ==== Entropy Engine Endpoints ====

@app.get("/entropy/{engagement_id}")
async def get_entropy_analysis(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Attack Path Entropy Collapse — path entropy, privilege inevitability, graph ambiguity."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        path_entropy = await compute_path_entropy(
            engine.driver, pg_pool, engagement_id
        )
        privilege_inevitability = await compute_privilege_inevitability(
            engine.driver, engagement_id
        )
        ambiguity = await compute_graph_ambiguity(
            engine.driver, engagement_id
        )
        collapsed = await collapse_by_entropy_threshold(
            engine.driver, pg_pool, engagement_id, threshold=0.5
        )
        return {
            "path_entropy": path_entropy,
            "privilege_inevitability": privilege_inevitability,
            "graph_ambiguity": ambiguity,
            "collapse_recommendations": collapsed,
        }
    except Exception as e:
        logger.error(f"Entropy analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


# ==== Causal Engine Endpoints ====

@app.post("/causal/{engagement_id}/path-analysis")
async def causal_path(
    engagement_id: str,
    path_id: str = Query(..., description="Attack path ID for causal chain analysis"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Causal inference on an attack path."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        async with pg_pool.acquire() as conn:
            path_row = await conn.fetchrow(
                """SELECT reasoning_trace FROM attack_paths
                   WHERE id = $1 AND engagement_id = $2""",
                path_id, engagement_id,
            )
            if not path_row:
                raise HTTPException(status_code=404, detail="Path not found")
            trace_data = path_row["reasoning_trace"]
            if isinstance(trace_data, str):
                trace_data = json.loads(trace_data)

        result = await causal_path_analysis(
            engine.driver, engagement_id, trace_data
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Causal analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/causal/{engagement_id}/root-cause")
async def causal_root_cause(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Root cause analysis across all attack paths."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await root_cause_analysis(
            engine.driver, pg_pool, engagement_id
        )
        return result
    except Exception as e:
        logger.error(f"Root cause analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.post("/causal/{engagement_id}/what-if")
async def causal_what_if(
    engagement_id: str,
    node_id: str = Query(..., description="Node ID to intervene on"),
    action: str = Query("remove", description="remove, harden, isolate"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """What-if intervention analysis for a specific node."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await what_if_intervention(
            engine.driver, pg_pool, engagement_id, node_id, action
        )
        return result
    except Exception as e:
        logger.error(f"What-if intervention failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


# ==== Blast Radius v2 Endpoints ====

@app.get("/blast/{engagement_id}/{node_id}")
async def blast_radius_v2(
    engagement_id: str,
    node_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Topological blast radius v2 for a specific node."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_blast_radius(engine.driver, engagement_id, node_id)
        return result
    except Exception as e:
        logger.error(f"Blast radius v2 failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/blast/{engagement_id}/all")
async def blast_radius_all(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Topological blast radius for all critical nodes."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_topological_blast_all(engine.driver, engagement_id)
        return {"engagement_id": engagement_id, "ranked_nodes": result}
    except Exception as e:
        logger.error(f"Blast radius all failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/blast/{engagement_id}/credential-cascade")
async def blast_credential_cascade(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Credential cascade risk analysis."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_credential_cascade_risk(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Credential cascade failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Graph Field Theory Endpoints ====

@app.get("/field/{engagement_id}/density")
async def get_field_density(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Attack pressure field density Φ(v) across all nodes."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_field_density(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Field density failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/field/{engagement_id}/gradients/{node_id}")
async def get_field_gradients(
    engagement_id: str,
    node_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Attack field gradient ∇Φ(v) at a specific node."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_field_gradients(engine.driver, engagement_id, node_id)
        return result
    except Exception as e:
        logger.error(f"Field gradients failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/field/{engagement_id}/privilege-diffusion")
async def get_privilege_diffusion(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Privilege energy density diffusion across graph."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_privilege_diffusion(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Privilege diffusion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Topological Resistance Endpoints ====

@app.get("/resistance/{engagement_id}/map")
async def get_resistance_map(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Complete resistance map of all edges."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_resistance_map(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Resistance map failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/resistance/{engagement_id}/paths")
async def get_resistance_paths(
    engagement_id: str,
    source_id: str = Query(...),
    target_id: str = Query(...),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Lowest-resistance attack paths between nodes."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await resistance_weighted_paths(
            engine.driver, engagement_id, source_id, target_id
        )
        return result
    except Exception as e:
        logger.error(f"Resistance paths failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/resistance/{engagement_id}/segmentation")
async def get_segmentation_conductivity(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Segmentation conductivity analysis."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_segmentation_conductivity(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Segmentation analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Attack Wave Propagation Endpoints ====

@app.post("/wave/{engagement_id}/simulate")
async def get_wave_simulation(
    engagement_id: str,
    source_node_ids: str = Query(None, description="Comma-separated source node IDs"),
    steps: int = Query(50, description="Simulation time steps"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Simulate compromise wave propagation through the graph."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        sources = source_node_ids.split(",") if source_node_ids else None
        result = await simulate_wave_propagation(
            engine.driver, engagement_id, source_node_ids=sources, steps=steps
        )
        return result
    except Exception as e:
        logger.error(f"Wave simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wave/{engagement_id}/velocity")
async def get_propagation_velocity(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Compromise propagation velocity profile."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_propagation_velocity(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Propagation velocity failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wave/{engagement_id}/amplification")
async def get_wave_amplification(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Wave amplification regions in the graph."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_wave_amplification_regions(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Wave amplification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Adversarial Game Theory Endpoints ====

@app.get("/game/{engagement_id}/minimax")
async def get_minimax_traversal(
    engagement_id: str,
    source_id: str = Query(...),
    target_id: str = Query(...),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Minimax-optimal attack path accounting for defender reactions."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_minimax_traversal(
            engine.driver, engagement_id, source_id, target_id
        )
        return result
    except Exception as e:
        logger.error(f"Minimax traversal failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/game/{engagement_id}/nash")
async def get_nash_equilibrium(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Approximate Nash equilibrium for attack vs defense."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await approximate_nash_equilibrium(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Nash equilibrium failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/game/{engagement_id}/adaptive")
async def get_adaptive_paths(
    engagement_id: str,
    source_id: str = Query(...),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Adaptive path recomputation under defender pressure."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await adaptive_attack_path_recomputation(
            engine.driver, engagement_id, source_id
        )
        return result
    except Exception as e:
        logger.error(f"Adaptive paths failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Attack Economics Endpoints ====

@app.get("/economics/{engagement_id}/paths")
async def get_path_economics(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Rank attack paths by economic utility."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await rank_paths_by_utility(engine.driver, pg_pool, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Path economics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/economics/{engagement_id}/stealth")
async def get_stealth_paths(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Stealth-optimal attack paths."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await compute_stealth_optimal_paths(
            engine.driver, pg_pool, engagement_id
        )
        return result
    except Exception as e:
        logger.error(f"Stealth paths failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/economics/{engagement_id}/campaign")
async def get_campaign_economics(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Full attack campaign economic analysis."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    pg_pool = await get_pg_pool()
    try:
        result = await compute_attack_campaign_economics(
            engine.driver, pg_pool, engagement_id
        )
        return result
    except Exception as e:
        logger.error(f"Campaign economics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


# ==== Topological Data Analysis Endpoints ====

@app.get("/topology/{engagement_id}/homology")
async def get_persistent_homology(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Persistent homology (topological features) of the infrastructure graph."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_persistent_homology(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Persistent homology failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/topology/{engagement_id}/simplices")
async def get_simplicial_complexes(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Simplicial complex structure of the graph."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_simplicial_complexes(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Simplicial complexes failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/topology/{engagement_id}/voids")
async def get_graph_voids(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Topological voids (monitoring blind spots) in the graph."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await detect_graph_voids(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Graph voids failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Graph Neural Reasoning Endpoints ====

@app.get("/gnn/{engagement_id}/embeddings")
async def get_node_embeddings(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Node2Vec-style embeddings for all graph nodes."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_node_embeddings(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Node embeddings failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gnn/{engagement_id}/predict-relationships")
async def get_predicted_relationships(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Predict undocumented trust/privilege relationships."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await predict_hidden_relationships(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Relationship predictions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gnn/{engagement_id}/escalation-predictions")
async def get_escalation_predictions(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Predict likely privilege escalation paths."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_privilege_escalation_prediction(
            engine.driver, engagement_id
        )
        return result
    except Exception as e:
        logger.error(f"Escalation predictions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Attack Attractor Theory Endpoints ====

@app.get("/attractor/{engagement_id}")
async def get_compromise_attractors(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Compromise attractors — nodes where attack flow converges."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_compromise_attractors(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Attractor analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/attractor/{engagement_id}/instability")
async def get_attractor_instability(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Topological instability regions."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_attractor_instability(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Attractor instability failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/attractor/{engagement_id}/inevitability")
async def get_compromise_inevitability(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Compromise inevitability scores."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_compromise_inevitability(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Compromise inevitability failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Information Geometry Endpoints ====

@app.get("/geometry/{engagement_id}/geodesic")
async def get_geodesic_path(
    engagement_id: str,
    source_id: str = Query(...),
    target_id: str = Query(...),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Geodesic (manifold-shortest) attack path between nodes."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_geodesic_paths(
            engine.driver, engagement_id, source_id, target_id
        )
        return result
    except Exception as e:
        logger.error(f"Geodesic path failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/geometry/{engagement_id}/curvature")
async def get_manifold_curvature(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Manifold curvature at each node."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_manifold_curvature(engine.driver, engagement_id)
        return result
    except Exception as e:
        logger.error(f"Manifold curvature failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/geometry/{engagement_id}/gradient-descent")
async def get_gradient_descent(
    engagement_id: str,
    source_id: str = Query(...),
    objective: str = Query("privilege", description="privilege, risk, pressure"),
    x_lattice9_key: Optional[str] = Header(None),
):
    """Gradient descent traversal path in information space."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")
    try:
        result = await compute_gradient_descent_path(
            engine.driver, engagement_id, source_id, objective
        )
        return result
    except Exception as e:
        logger.error(f"Gradient descent failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==== Unified Intelligence Query ====

@app.get("/intelligence/{engagement_id}/all")
async def get_all_intelligence(
    engagement_id: str,
    x_lattice9_key: Optional[str] = Header(None),
):
    """Aggregate all computational intelligence modules in a single response."""
    verify_engine_key(x_lattice9_key)
    if not engine.driver:
        raise HTTPException(status_code=503, detail="Graph database unavailable")

    import asyncio
    pg_pool = await get_pg_pool()
    try:
        field_task = asyncio.create_task(
            compute_field_density(engine.driver, engagement_id)
        )
        resistance_task = asyncio.create_task(
            compute_resistance_map(engine.driver, engagement_id)
        )
        attractor_task = asyncio.create_task(
            compute_compromise_attractors(engine.driver, engagement_id)
        )
        inevitability_task = asyncio.create_task(
            compute_compromise_inevitability(engine.driver, engagement_id)
        )

        field, resistance, attractor, inevitability = await asyncio.gather(
            field_task, resistance_task, attractor_task, inevitability_task,
            return_exceptions=True,
        )

        return {
            "field_theory": field if not isinstance(field, Exception) else {"error": str(field)},
            "resistance": resistance if not isinstance(resistance, Exception) else {"error": str(resistance)},
            "attractor": attractor if not isinstance(attractor, Exception) else {"error": str(attractor)},
            "inevitability": inevitability if not isinstance(inevitability, Exception) else {"error": str(inevitability)},
        }
    except Exception as e:
        logger.error(f"Unified intelligence failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await pg_pool.close()


@app.get("/health")
async def health():
    status = "operational"
    if engine.driver:
        try:
            async with engine.driver.session(database="neo4j") as session:
                await session.run("RETURN 1")
        except Exception:
            status = "degraded"

    return {
        "status": status,
        "engine": f"Lattice9-OS-{ENGINE_VERSION}",
        "schema_version": ENGINE_VERSION,
        "neo4j": engine.driver is not None,
        "redis": engine.redis is not None,
    }
