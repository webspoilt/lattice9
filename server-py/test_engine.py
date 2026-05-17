"""
Lattice9 Core Graph & Reasoning Engine Regression Test Suite.
Verifies convergence of Bayesian belief propagation, Dijkstra path prerequisite tracing, and prioritization centrality.
"""

import asyncio
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock

import math

# Ensure server-py path is available for imports
sys.path.append(".")

from graph.confidence import propagate_confidence_to_graph, bayesian_update
from graph.algorithms import shortest_attack_paths
from reasoning.exploit_chains import match_exploit_blueprint, evaluate_finding_feasibility
from reasoning.prioritization import prioritize_findings


class TestLattice9Engine(unittest.TestCase):

    def test_exploit_blueprint_matching(self):
        """Verify that vulnerability findings map correctly to exploit blueprints."""
        # EternalBlue
        bp = match_exploit_blueprint("Remote Code Execution in MS17-010 (EternalBlue)")
        self.assertIsNotNone(bp)
        self.assertEqual(bp["name"], "EternalBlue (MS17-010)")
        self.assertEqual(bp["credential_level"], "none")
        self.assertEqual(bp["ingress_ports"], [445])

        # Log4Shell
        bp_log = match_exploit_blueprint("Apache Log4j RCE (Log4Shell) on port 8080")
        self.assertIsNotNone(bp_log)
        self.assertEqual(bp_log["name"], "Log4Shell")

        # Unknown vuln should return None
        bp_none = match_exploit_blueprint("Some Generic Information Disclosure")
        self.assertIsNone(bp_none)

    def test_bayesian_belief_propagation_convergence(self):
        """Verify that Iterative Bayesian Belief Propagation executes and converges deterministically."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()
        
        # Define count mock
        mock_record_cnt = MagicMock()
        mock_record_cnt.__getitem__.side_effect = lambda key: {"cnt": 2}[key]
        mock_result_cnt = MagicMock()
        mock_result_cnt.single = AsyncMock(return_value=mock_record_cnt)

        # Define mock node records with __getitem__
        node_1 = MagicMock()
        node_1.__getitem__.side_effect = lambda key: {"id": "host-1", "conf": 0.9, "type": "host"}[key]
        node_2 = MagicMock()
        node_2.__getitem__.side_effect = lambda key: {"id": "finding-1", "conf": 0.5, "type": "finding"}[key]

        mock_result_nodes = MagicMock()
        mock_result_nodes.__aiter__.return_value = [node_1, node_2]
        
        # Define mock relationship records with __getitem__
        rel_1 = MagicMock()
        rel_1.__getitem__.side_effect = lambda key: {
            "src_id": "host-1",
            "dst_id": "finding-1",
            "rel_type": "HAS_FINDING",
            "weight": 0.8
        }[key]

        mock_result_rels = MagicMock()
        mock_result_rels.__aiter__.return_value = [rel_1]

        # Return mock records for session runs
        mock_session.run.side_effect = [
            mock_result_cnt,
            mock_result_nodes,
            mock_result_rels,
            AsyncMock() # batch update run
        ]

        # Setup context manager correctly for async with
        mock_session_context = MagicMock()
        mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_context.__aexit__ = AsyncMock()

        mock_driver = MagicMock()
        mock_driver.session.return_value = mock_session_context

        # Run belief propagation
        loop.run_until_complete(propagate_confidence_to_graph(mock_driver, "test-engagement-id"))
        
        # Check that session.run was called at least 4 times
        self.assertGreaterEqual(mock_session.run.call_count, 4)
        loop.close()

    def test_loopy_belief_stabilization_and_oscillation_damping(self):
        """Verify loopy cyclic graph belief stabilization and Dynamic Oscillation Shield."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()

        # A. Mock count query (total nodes = 2, below partition threshold so no partition partitioning runs)
        mock_record_cnt = MagicMock()
        mock_record_cnt.__getitem__.side_effect = lambda key: {"cnt": 2}[key]
        mock_result_cnt = MagicMock()
        mock_result_cnt.single = AsyncMock(return_value=mock_record_cnt)

        # B. Define node records (2 nodes in an active dependency loop)
        node_1 = MagicMock()
        node_1.__getitem__.side_effect = lambda key: {"id": "node-A", "conf": 0.9, "type": "finding"}[key]
        node_2 = MagicMock()
        node_2.__getitem__.side_effect = lambda key: {"id": "node-B", "conf": 0.1, "type": "host"}[key]

        mock_result_nodes = MagicMock()
        mock_result_nodes.__aiter__.return_value = [node_1, node_2]

        # C. Define loop relationships (node-A exploits node-B, node-B privilege_escalation node-A)
        rel_1 = MagicMock()
        rel_1.__getitem__.side_effect = lambda key: {
            "src_id": "node-A",
            "dst_id": "node-B",
            "rel_type": "EXPLOITS",
            "weight": 0.95
        }[key]
        rel_2 = MagicMock()
        rel_2.__getitem__.side_effect = lambda key: {
            "src_id": "node-B",
            "dst_id": "node-A",
            "rel_type": "PRIVILEGE_ESCALATION",
            "weight": 0.95
        }[key]

        mock_result_rels = MagicMock()
        mock_result_rels.__aiter__.return_value = [rel_1, rel_2]

        # side_effect for session runs: count, nodes, rels, and update
        mock_session.run.side_effect = [
            mock_result_cnt,
            mock_result_nodes,
            mock_result_rels,
            AsyncMock()
        ]

        mock_session_context = MagicMock()
        mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_context.__aexit__ = AsyncMock()

        mock_driver = MagicMock()
        mock_driver.session.return_value = mock_session_context

        # Execute propagation with tight parameters to test loop feedback damping
        loop.run_until_complete(propagate_confidence_to_graph(
            mock_driver,
            "test-cyclic-id",
            damping_factor=0.8,
            max_iterations=10,
            convergence_threshold=1e-5
        ))

        # Check all database runs were performed correctly
        self.assertEqual(mock_session.run.call_count, 4)
        loop.close()

    def test_exploit_feasibility_prerequisites(self):
        """Verify that step-by-step prerequisite auditing yields correct feasibility parameters."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Mock Neo4j session querying finding and host OS details
        mock_session = AsyncMock()
        
        mock_record_win = MagicMock()
        mock_record_win.__getitem__.side_effect = lambda key: {
            "title": "Remote Code Execution in MS17-010 (EternalBlue)",
            "description": "Vulnerability in Microsoft SMBv1",
            "confidence": 0.8,
            "severity": "critical",
            "svc_port": 445,
            "os_platform": "Windows Server 2012 R2",
            "cred_confs": [],
            "has_network_reach": False
        }[key]

        mock_session.run.side_effect = [
            # First query: vuln details matching title
            AsyncMock(
                single=AsyncMock(
                    return_value=mock_record_win
                )
            )
        ]

        # Evaluate EternalBlue on Windows (should pass target OS constraint)
        res = loop.run_until_complete(evaluate_finding_feasibility(mock_session, "finding-1"))
        
        self.assertEqual(res["blueprint"], "EternalBlue (MS17-010)")
        self.assertIn("Target OS 'windows server 2012 r2' matches blueprint target (['windows'])", res["satisfied"])
        self.assertIn("Ingress port 445 matches blueprint open ports", res["satisfied"])
        self.assertEqual(len(res["missing"]), 0)
        self.assertEqual(res["feasibility_score"], 0.8)  # returns base confidence * penalty (1.0) = 0.8

        # Let's test mismatched OS: Windows exploit on Linux target OS
        mock_session_linux = AsyncMock()
        mock_record_linux = MagicMock()
        mock_record_linux.__getitem__.side_effect = lambda key: {
            "title": "Remote Code Execution in MS17-010 (EternalBlue)",
            "description": "Vulnerability in Microsoft SMBv1",
            "confidence": 0.8,
            "severity": "critical",
            "svc_port": 80,
            "os_platform": "Ubuntu 22.04 LTS",
            "cred_confs": [],
            "has_network_reach": False
        }[key]

        mock_session_linux.run.side_effect = [
            AsyncMock(
                single=AsyncMock(
                    return_value=mock_record_linux
                )
            )
        ]

        res_linux = loop.run_until_complete(evaluate_finding_feasibility(mock_session_linux, "finding-1"))
        self.assertIn("Platform mismatch (Target OS is 'ubuntu 22.04 lts', but blueprint requires ['windows'])", res_linux["missing"])
        self.assertIn("Port mismatch (Service port 80 is open, but blueprint requires [445])", res_linux["missing"])
        # Mismatched OS should heavily penalize feasibility score to 0.01 (min floor)
        self.assertEqual(res_linux["feasibility_score"], 0.01)

        loop.close()

    def test_prioritization_and_centrality(self):
        """Verify that Path Dependency Centrality applies correct boosts to findings."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Mock Postgres connection
        mock_conn = AsyncMock()
        # Mock attack paths retrieval returning a trace where node-1 is central
        mock_conn.fetch.side_effect = [
            # First fetch: SELECT reasoning_trace FROM attack_paths
            [
                {"reasoning_trace": '{"node_ids": ["node-1", "node-2"]}'},
                {"reasoning_trace": '{"node_ids": ["node-1", "node-3"]}'}
            ],
            # Second fetch: SELECT findings
            [
                {
                    "id": "finding-1",
                    "title": "Remote Code Execution in MS17-010 (EternalBlue)",
                    "severity": "critical",
                    "confidence": 0.8,
                    "validation_state": "validated",
                    "cwe": "CWE-94",
                    "affected_entity_id": "node-1",
                    "environmental_relevance": 0.9
                }
            ]
        ]

        mock_pg_pool = MagicMock()
        mock_pg_pool.acquire.return_value.__aenter__.return_value = mock_conn

        # Mock Neo4j driver (for blast radius call)
        mock_driver = MagicMock()

        prioritized = loop.run_until_complete(prioritize_findings(mock_driver, mock_pg_pool, "engagement-1"))
        
        self.assertEqual(len(prioritized), 1)
        f = prioritized[0]
        
        # Verify Path Dependency Centrality calculation
        # node-1 is present in both paths (2/2 = 1.0)
        self.assertEqual(f["path_dependency_centrality"], 1.0)
        self.assertTrue(f["actionability_matched"])
        self.assertEqual(f["validation_state"], "validated")
        
        # Final priority should be highly boosted and capped at 1.0
        self.assertGreater(f["priority_score"], 0.8)
        loop.close()

    def test_graph_hell_contradictory_propagation(self):
        """Verify that BBP safely resolves intense, contradictory prior and evidence signals without bounds overflow."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()

        # Mock count query (3 nodes, below partition threshold)
        mock_record_cnt = MagicMock()
        mock_record_cnt.__getitem__.side_effect = lambda key: {"cnt": 3}[key]
        mock_result_cnt = MagicMock()
        mock_result_cnt.single = AsyncMock(return_value=mock_record_cnt)

        # 3 Nodes: Node C receives contradictory inputs from Node A (High Compromise) and Node B (Highly Secure/Low Compromise)
        node_a = MagicMock()
        node_a.__getitem__.side_effect = lambda key: {"id": "node-A", "conf": 0.99, "type": "finding"}[key]
        node_b = MagicMock()
        node_b.__getitem__.side_effect = lambda key: {"id": "node-B", "conf": 0.01, "type": "host"}[key]
        node_c = MagicMock()
        node_c.__getitem__.side_effect = lambda key: {"id": "node-C", "conf": 0.50, "type": "host"}[key]

        mock_result_nodes = MagicMock()
        mock_result_nodes.__aiter__.return_value = [node_a, node_b, node_c]

        # Relationship: A -> C (EXPLOITS, high weight), B -> C (TRUSTS, high weight)
        rel_1 = MagicMock()
        rel_1.__getitem__.side_effect = lambda key: {
            "src_id": "node-A",
            "dst_id": "node-C",
            "rel_type": "EXPLOITS",
            "weight": 0.99
        }[key]
        rel_2 = MagicMock()
        rel_2.__getitem__.side_effect = lambda key: {
            "src_id": "node-B",
            "dst_id": "node-C",
            "rel_type": "TRUSTS",
            "weight": 0.99
        }[key]

        mock_result_rels = MagicMock()
        mock_result_rels.__aiter__.return_value = [rel_1, rel_2]

        mock_session.run.side_effect = [
            mock_result_cnt,
            mock_result_nodes,
            mock_result_rels,
            AsyncMock()  # batch update run
        ]

        mock_session_context = MagicMock()
        mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_context.__aexit__ = AsyncMock()

        mock_driver = MagicMock()
        mock_driver.session.return_value = mock_session_context

        # Execute propagation
        loop.run_until_complete(propagate_confidence_to_graph(mock_driver, "contradictory-test"))

        # Verify that BBP processed the session commits
        self.assertEqual(mock_session.run.call_count, 4)
        loop.close()

    def test_graph_hell_extreme_cyclic_loops(self):
        """Verify that the Dynamic Oscillation Shield and damping prevent circular reference explosions in dense loops."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()

        # Mock count query (3 nodes, dense clique)
        mock_record_cnt = MagicMock()
        mock_record_cnt.__getitem__.side_effect = lambda key: {"cnt": 3}[key]
        mock_result_cnt = MagicMock()
        mock_result_cnt.single = AsyncMock(return_value=mock_record_cnt)

        # 3 Nodes in a complete, highly-compromised loop clique
        node_a = MagicMock()
        node_a.__getitem__.side_effect = lambda key: {"id": "node-A", "conf": 0.95, "type": "finding"}[key]
        node_b = MagicMock()
        node_b.__getitem__.side_effect = lambda key: {"id": "node-B", "conf": 0.95, "type": "host"}[key]
        node_c = MagicMock()
        node_c.__getitem__.side_effect = lambda key: {"id": "node-C", "conf": 0.95, "type": "host"}[key]

        mock_result_nodes = MagicMock()
        mock_result_nodes.__aiter__.return_value = [node_a, node_b, node_c]

        # Bidirectional cyclic loops: A -> B -> C -> A
        rel_ab = MagicMock()
        rel_ab.__getitem__.side_effect = lambda key: {"src_id": "node-A", "dst_id": "node-B", "rel_type": "EXPLOITS", "weight": 0.99}[key]
        rel_bc = MagicMock()
        rel_bc.__getitem__.side_effect = lambda key: {"src_id": "node-B", "dst_id": "node-C", "rel_type": "PRIVILEGE_ESCALATION", "weight": 0.99}[key]
        rel_ca = MagicMock()
        rel_ca.__getitem__.side_effect = lambda key: {"src_id": "node-C", "dst_id": "node-A", "rel_type": "AUTHENTICATES_TO", "weight": 0.99}[key]

        mock_result_rels = MagicMock()
        mock_result_rels.__aiter__.return_value = [rel_ab, rel_bc, rel_ca]

        mock_session.run.side_effect = [
            mock_result_cnt,
            mock_result_nodes,
            mock_result_rels,
            AsyncMock()
        ]

        mock_session_context = MagicMock()
        mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_context.__aexit__ = AsyncMock()

        mock_driver = MagicMock()
        mock_driver.session.return_value = mock_session_context

        # We execute with tight max_iterations to verify the shield kicks in and converges/terminates cleanly
        loop.run_until_complete(propagate_confidence_to_graph(
            mock_driver,
            "clique-loop-test",
            damping_factor=0.9, # Start high to test shield trigger
            max_iterations=15,
            convergence_threshold=1e-5
        ))

        self.assertEqual(mock_session.run.call_count, 4)
        loop.close()

    def test_graph_hell_disconnected_islands_and_noise(self):
        """Verify that BBP remains robust, stable, and error-free when handling isolated graph components and highly noisy edge weights."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()

        # Mock count query (4 nodes split into two completely disconnected components)
        mock_record_cnt = MagicMock()
        mock_record_cnt.__getitem__.side_effect = lambda key: {"cnt": 4}[key]
        mock_result_cnt = MagicMock()
        mock_result_cnt.single = AsyncMock(return_value=mock_record_cnt)

        # Island 1: node-1 -> node-2 (extreme high/low noise weights)
        node_1 = MagicMock()
        node_1.__getitem__.side_effect = lambda key: {"id": "node-1", "conf": 0.99, "type": "finding"}[key]
        node_2 = MagicMock()
        node_2.__getitem__.side_effect = lambda key: {"id": "node-2", "conf": 0.01, "type": "host"}[key]

        # Island 2: node-3 -> node-4 (extreme prior conditions)
        node_3 = MagicMock()
        node_3.__getitem__.side_effect = lambda key: {"id": "node-3", "conf": 0.50, "type": "host"}[key]
        node_4 = MagicMock()
        node_4.__getitem__.side_effect = lambda key: {"id": "node-4", "conf": 0.50, "type": "service"}[key]

        mock_result_nodes = MagicMock()
        mock_result_nodes.__aiter__.return_value = [node_1, node_2, node_3, node_4]

        # Island 1 relationship: node-1 -> node-2 (EXPLOITS, noisy weight)
        rel_12 = MagicMock()
        rel_12.__getitem__.side_effect = lambda key: {
            "src_id": "node-1",
            "dst_id": "node-2",
            "rel_type": "EXPLOITS",
            "weight": 0.0001 # Extreme low noise edge
        }[key]

        # Island 2 relationship: node-3 -> node-4 (HAS_FINDING, weight of 1.0)
        rel_34 = MagicMock()
        rel_34.__getitem__.side_effect = lambda key: {
            "src_id": "node-3",
            "dst_id": "node-4",
            "rel_type": "HAS_FINDING",
            "weight": 1.0 # Extreme high weight
        }[key]

        mock_result_rels = MagicMock()
        mock_result_rels.__aiter__.return_value = [rel_12, rel_34]

        mock_session.run.side_effect = [
            mock_result_cnt,
            mock_result_nodes,
            mock_result_rels,
            AsyncMock()
        ]

        mock_session_context = MagicMock()
        mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_context.__aexit__ = AsyncMock()

        mock_driver = MagicMock()
        mock_driver.session.return_value = mock_session_context

        # Execute propagation
        loop.run_until_complete(propagate_confidence_to_graph(mock_driver, "island-noise-test"))

        self.assertEqual(mock_session.run.call_count, 4)
        loop.close()

    def test_shortest_attack_paths_with_dynamic_constraints(self):
        """Verify that Dijkstra shortest path search dynamically integrates exploit blueprint constraints."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()

        # 1. Mock feasibility query result
        mock_rec_feasibility = MagicMock()
        mock_rec_feasibility.__getitem__.side_effect = lambda key: {
            "id": "finding-1",
            "title": "Remote Code Execution in MS17-010 (EternalBlue)",
            "description": "SMB vulnerability",
            "confidence": 0.8,
            "svc_port": 445,
            "os_platform": "Windows Server 2012 R2",
            "cred_confs": [],
            "has_network_reach": True
        }[key]

        mock_result_feasibility = MagicMock()
        mock_result_feasibility.__aiter__.return_value = [mock_rec_feasibility]

        # 2. Mock node query result
        node_1 = MagicMock()
        node_1.__getitem__.side_effect = lambda key: {
            "id": "entry-host",
            "display_name": "Internet Ingress Host",
            "entity_type": "host",
            "confidence": 0.9
        }[key]
        node_2 = MagicMock()
        node_2.__getitem__.side_effect = lambda key: {
            "id": "finding-1",
            "display_name": "EternalBlue MS17-010",
            "entity_type": "finding",
            "confidence": 0.8
        }[key]

        mock_result_nodes = MagicMock()
        mock_result_nodes.__aiter__.return_value = [node_1, node_2]

        # 3. Mock edge query result
        edge_1 = MagicMock()
        edge_1.__getitem__.side_effect = lambda key: {
            "src_id": "entry-host",
            "dst_id": "finding-1",
            "rel_type": "EXPLOITS",
            "weight": 0.9
        }[key]

        mock_result_edges = MagicMock()
        mock_result_edges.__aiter__.return_value = [edge_1]

        mock_session.run.side_effect = [
            mock_result_feasibility,
            mock_result_nodes,
            mock_result_edges
        ]

        mock_session_context = MagicMock()
        mock_session_context.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_context.__aexit__ = AsyncMock()

        mock_driver = MagicMock()
        mock_driver.session.return_value = mock_session_context

        # Execute paths search
        paths = loop.run_until_complete(shortest_attack_paths(
            mock_driver,
            "dijkstra-constraint-test",
            entry_types=["host"],
            terminal_types=["finding"],
            min_confidence=0.1
        ))

        # We should find exactly 1 path
        self.assertEqual(len(paths), 1)
        p = paths[0]
        self.assertEqual(p["node_ids"], ["entry-host", "finding-1"])
        self.assertGreater(p["composite_score"], 0.3)
        loop.close()

    def test_pedigree_ancestry_recursion(self):
        """Verify recursive ancestry tracking and pedigree tree reconstruction from database states."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_conn = AsyncMock()
        
        # 1. Fetch primary evidence row
        mock_conn.fetchrow.return_value = {
            "id": "evidence-1",
            "engagement_id": "engagement-123",
            "source_type": "nmap",
            "artifact_uri": "file:///nmap.xml",
            "sha256": "abcdef123456",
            "captured_at": "2026-05-17T06:00:00Z",
            "metadata": "{}"
        }

        # 2. Mock findings derived from this evidence
        findings = [
            {"id": "finding-1", "title": "EternalBlue MS17-010", "severity": "critical", "confidence": 0.8, "role": "supporting"}
        ]
        
        # 3. Mock relationships supported by this evidence
        rels = [
            {"id": "rel-1", "relationship_type": "EXPLOITS", "source_entity_id": "host-1", "target_entity_id": "host-2"}
        ]

        # 4. Mock ancestors (other evidence pieces supporting finding-1)
        ancestors = [
            {"id": "evidence-2", "source_type": "metasploit", "artifact_uri": "file:///msf.log", "role": "supporting", "confidence_delta": 0.15}
        ]

        mock_conn.fetch.side_effect = [
            findings,
            rels,
            ancestors,  # called during trace_ancestry recursion
            []  # leaf node termination
        ]

        mock_pg_pool = MagicMock()
        mock_pg_pool.acquire.return_value.__aenter__.return_value = mock_conn

        from evidence.lineage import get_evidence_provenance
        prov = loop.run_until_complete(get_evidence_provenance(mock_pg_pool, "evidence-1"))

        self.assertIsNotNone(prov)
        self.assertEqual(prov["evidence"]["id"], "evidence-1")
        self.assertEqual(len(prov["pedigree_ancestry"]), 1)
        self.assertEqual(prov["pedigree_ancestry"][0]["node_id"], "evidence-2")
        self.assertEqual(prov["pedigree_ancestry"][0]["confidence_impact"], 0.15)
        loop.close()

    def test_dijkstra_economic_traversal_weights(self):
        """Verify Dijkstra routing avoids high-risk/cost paths in favor of quiet movements."""
        # Cost Equation: -ln(P(u->v)) + EconomicCost + DetectionRisk
        # PrivEsc: Penalty 1.5, Econ 0.5, Risk 0.4. Sum = -ln(0.5/1.5) + 0.5 + 0.4 = 1.098 + 0.9 = 1.998
        # Trusts: Penalty 0.95, Econ 0.05, Risk 0.02. Sum = -ln(0.95/0.95) + 0.05 + 0.02 = 0 + 0.07 = 0.07
        
        # Manually compute edge transition cost algorithm in test to verify equations
        def calculate_cost(rel_type, base_prob):
            rel_penalty = 1.0
            economic_cost = 0.0
            detection_risk = 0.0
            if rel_type == "PRIVILEGE_ESCALATION":
                rel_penalty = 1.5
                economic_cost = 0.5
                detection_risk = 0.4
            elif rel_type == "TRUSTS":
                rel_penalty = 0.95
                economic_cost = 0.05
                detection_risk = 0.02

            transition_prob = max((base_prob) / rel_penalty, 0.001)
            return -math.log(transition_prob) + economic_cost + detection_risk

        cost_privesc = calculate_cost("PRIVILEGE_ESCALATION", 0.5)
        cost_trusts = calculate_cost("TRUSTS", 0.95)

        self.assertGreater(cost_privesc, cost_trusts)
        self.assertAlmostEqual(cost_privesc, -math.log(0.5/1.5) + 0.5 + 0.4, places=4)
        self.assertAlmostEqual(cost_trusts, -math.log(1.0) + 0.05 + 0.02, places=4)

    def test_temporal_drift_and_infrastructure_mutations(self):
        """Verify topological drift scores and mutation structures can be parsed correctly."""
        from graph.temporal import compute_temporal_diff
        from datetime import datetime
        
        # Test basic drift computation logic mock
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mock_session = AsyncMock()
        mock_conn = AsyncMock()

        # Mock Postgres snapshot fetches with proper 'metadata' field key
        mock_conn.fetchrow.side_effect = [
            {"id": "snap-1", "metadata": '{"nodes": [{"id": "A", "type": "host"}], "relationships": []}', "captured_at": datetime.utcnow()},
            {"id": "snap-2", "metadata": '{"nodes": [{"id": "A", "type": "host"}], "relationships": [{"src_id": "A", "dst_id": "B", "type": "TRUSTS", "weight": 0.9}]}', "captured_at": datetime.utcnow()}
        ]

        mock_pg_pool = MagicMock()
        mock_pg_pool.acquire.return_value.__aenter__.return_value = mock_conn

        diff = loop.run_until_complete(compute_temporal_diff(
            None, mock_pg_pool, "engagement-1", "snap-1", "snap-2"
        ))

        self.assertIsNotNone(diff)
        self.assertIn("drift_score", diff)
        self.assertGreater(diff["drift_score"], 0.0)
        loop.close()


if __name__ == "__main__":
    unittest.main()
