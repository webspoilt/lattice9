# Computational Intelligence Modules

## Reference — v9.0.0-RC1

---

## Overview

Lattice9 implements 23 computational intelligence algorithms across 5 categories. Each algorithm alters how paths are ranked, confidence is computed, or the graph is traversed. Every equation has an operational consequence.

### Module Catalog

| # | Module | File | Category |
|---|---|---|---|
| 1 | Attack Pressure Field | `graph/field_theory.py` | Field Theory |
| 2 | Field Gradients | `graph/field_theory.py` | Field Theory |
| 3 | Privilege Diffusion | `graph/field_theory.py` | Field Theory |
| 4 | Edge Resistance | `graph/resistance.py` | Resistance |
| 5 | Resistance Map | `graph/resistance.py` | Resistance |
| 6 | Resistance-Weighted Paths | `graph/resistance.py` | Resistance |
| 7 | Segmentation Conductivity | `graph/resistance.py` | Resistance |
| 8 | Wave Propagation Simulation | `graph/wave_propagation.py` | Wave Dynamics |
| 9 | Propagation Velocity | `graph/wave_propagation.py` | Wave Dynamics |
| 10 | Wave Amplification Regions | `graph/wave_propagation.py` | Wave Dynamics |
| 11 | Minimax Traversal | `reasoning/adversarial_game.py` | Game Theory |
| 12 | Nash Equilibrium | `reasoning/adversarial_game.py` | Game Theory |
| 13 | Adaptive Path Recomputation | `reasoning/adversarial_game.py` | Game Theory |
| 14 | Path Economics | `reasoning/attack_economics.py` | Economics |
| 15 | Stealth-Optimal Paths | `reasoning/attack_economics.py` | Economics |
| 16 | Campaign Economics | `reasoning/attack_economics.py` | Economics |
| 17 | Persistent Homology | `graph/topological_da.py` | Topology |
| 18 | Simplicial Complexes | `graph/topological_da.py` | Topology |
| 19 | Graph Voids | `graph/topological_da.py` | Topology |
| 20 | Node Embeddings | `graph/gnn_reasoning.py` | Graph Learning |
| 21 | Hidden Relationship Prediction | `graph/gnn_reasoning.py` | Graph Learning |
| 22 | Privilege Escalation Prediction | `graph/gnn_reasoning.py` | Graph Learning |
| 23 | Compromise Attractors | `graph/attractor_theory.py` | Attractor Theory |
| 24 | Topological Instability | `graph/attractor_theory.py` | Attractor Theory |
| 25 | Compromise Inevitability | `graph/attractor_theory.py` | Attractor Theory |
| 26 | Geodesic Paths | `graph/information_geometry.py` | Geometry |
| 27 | Manifold Curvature | `graph/information_geometry.py` | Geometry |
| 28 | Gradient Descent | `graph/information_geometry.py` | Geometry |

---

## Field Theory Module (`graph/field_theory.py`)

### Algorithms

#### `compute_field_density(driver, engagement_id)`
Computes $\Phi(v) = \sum \text{Risk}(u) \cdot \text{Trust}(u,v) / d(u,v)^\alpha$ for all nodes. Returns per-node field pressure, gravity wells above threshold $\gamma \cdot \Phi_{\text{max}}$, and field statistics.

```python
result = await compute_field_density(driver, "eng-123")
# result["gravity_wells"] -> [{node_id, name, field_pressure}, ...]
# result["gravity_well_count"] -> 4
# result["field_statistics"] -> {min, max, mean, std}
```

**Complexity:** $O(n \cdot (n + m))$ naive, $O(n \log n)$ with k-hop sampling.

#### `compute_field_gradients(driver, engagement_id, node_id)`
Computes $\nabla\Phi(v)$ at a specific node. Returns gradient components per neighbor, gradient magnitude, and attack flow direction (neighbor with highest positive gradient).

```python
result = await compute_field_gradients(driver, "eng-123", "node-456")
# result["gradient_magnitude"] -> 0.3421
# result["attack_flow_direction"] -> {neighbor_id, gradient_component}
```

#### `compute_privilege_diffusion(driver, engagement_id)`
Computes privilege density $\rho_{\text{priv}}(v)$ for all nodes. Returns density scores, privilege wells (density > 0.7), and well count.

```python
result = await compute_privilege_diffusion(driver, "eng-123")
# result["privilege_wells"] -> [{node_id, privilege_density}, ...]
```

---

## Resistance Theory Module (`graph/resistance.py`)

### Algorithms

#### `compute_edge_resistance(driver, engagement_id, source_id, target_id, rel_type)`
Computes $R(e) = \text{DF}(e) / \text{TP}(e)$ for a single edge. Returns all component factors: base resistance, detection friction, EDR suppression, traversal probability, resistance, conductivity.

#### `compute_resistance_map(driver, engagement_id)`
Computes resistance for all edges. Returns complete map with statistics (mean, min, max, median), low-resistance corridors ($R < 0.5 \cdot \bar{R}$), and high-resistance barriers ($R > 1.5 \cdot \bar{R}$).

```python
result = await compute_resistance_map(driver, "eng-123")
# result["low_resistance_corridors"] -> stealth routes
# result["high_resistance_barriers"] -> segmentation
# result["statistics"] -> {mean_resistance, min_resistance, max_resistance}
```

#### `resistance_weighted_paths(driver, engagement_id, source_id, target_id)`
Finds lowest-resistance attack paths using Dijkstra with $R(e)$ as cost. Returns paths ranked by total resistance with per-step breakdown.

#### `compute_segmentation_conductivity(driver, engagement_id)`
Measures inter-segment connectivity. Returns conductivity matrix between network segments.

---

## Wave Propagation Module (`graph/wave_propagation.py`)

### Algorithms

#### `simulate_wave_propagation(driver, engagement_id, source_node_ids, steps=50)`
Simulates $\partial C/\partial t = D \nabla^2 C - \lambda C + S$ over the graph. Returns propagation history, final wave front, velocity, amplification zones, damping zones, containment estimate.

```python
result = await simulate_wave_propagation(driver, "eng-123", source_node_ids=["node-1"])
# result["propagation_velocity"] -> 0.34 (nodes per time step)
# result["containment_estimate"] -> 0.67 (fraction uncompromised)
# result["amplification_zones"] -> [{node_id, name, growth}]
# result["damping_zones"] -> [{name, concentration, decay_rate}]
```

**Numerical stability:** CFL condition $\Delta t \leq 1/\deg_{\text{max}}$ enforced. Convergence when $\Delta \text{infected} / n < 0.001$.

#### `compute_propagation_velocity(driver, engagement_id)`
Computes average velocity across multiple source nodes. Returns per-source velocities, global average, fastest/slowest propagation.

#### `compute_wave_amplification_regions(driver, engagement_id)`
Identifies nodes where compromise waves amplify. Amplification factor = $\text{base} \cdot (1 + \text{connectivity} \cdot 0.1)$.

---

## Adversarial Game Theory Module (`reasoning/adversarial_game.py`)

### Algorithms

#### `compute_minimax_traversal(driver, engagement_id, source_id, target_id)`
Computes $V^*(s) = \max_a \min_d \mathbb{E}[R + \gamma V(s')]$ using value iteration over the graph state space. Returns minimax-optimal path with defender reaction at each step.

```python
result = await compute_minimax_traversal(driver, "eng-123", "node-1", "node-10")
# result["minimax_path"] -> [{from, to, rel_type, state_value, defender_counter}]
# result["source_value"] -> 0.72 (game value at start)
```

**Defender actions:** edr_block, network_isolation, credential_rotation, patch_deployment, mfa_enforcement, segmentation, logging_escalation, honeytoken_deploy.

#### `approximate_nash_equilibrium(driver, engagement_id)`
Builds payoff matrix over critical nodes, computes mixed-strategy Nash equilibrium via proportional allocation. Returns attacker and defender probability distributions.

```python
result = await approximate_nash_equilibrium(driver, "eng-123")
# result["attacker_strategy"] -> [{node, type, probability}]
# result["defender_strategy"] -> [{node, type, probability}]
# result["game_value"] -> 3.42
```

#### `adaptive_attack_path_recomputation(driver, engagement_id, source_id)`
Simulates defender adaptation: each successful edge traversal increases detection probability on remaining edges by 20%.

---

## Attack Economics Module (`reasoning/attack_economics.py`)

### Algorithms

#### `compute_path_economics(driver, engagement_id, path_id)`
Computes $\mathcal{U}(P)$ for a single path. Returns per-step economics (privilege gain, persistence, detection risk, operational cost, stealth, step utility) and path-level aggregates.

```python
result = await compute_path_economics(driver, "eng-123", "path-456")
# result["economics"] -> {total_privilege_gain, path_utility, path_roi, stealth_rating}
# result["step_economics"] -> [{step, step_utility}, ...]
```

#### `rank_paths_by_utility(driver, pg_pool, engagement_id)`
Ranks all paths by economic utility. Returns ranked list with utility, ROI, stealth rating, cost.

```python
result = await rank_paths_by_utility(driver, pg_pool, "eng-123")
# result["top_paths"] -> [{title, utility, roi, stealth_rating, total_operational_cost}]
# result["economics_statistics"] -> {max_utility, min_utility, mean_utility}
```

#### `compute_stealth_optimal_paths(driver, pg_pool, engagement_id)`
Re-ranks paths by stealth rating: $\text{SR}(P) = \frac{1}{|P|} \sum \text{SA}(v)$.

---

## Topological Data Analysis Module (`graph/topological_da.py`)

### Algorithms

#### `compute_persistent_homology(driver, engagement_id)`
Computes H0 (connected components) and H1 (cycles) persistence over a filtration by edge weight. Returns component evolution, cycle detection with birth/death times.

```python
result = await compute_persistent_homology(driver, "eng-123")
# result["h0_features"] -> {initial_components, final_components, merge_events}
# result["h1_features"] -> {total_cycles, cycles: [{birth, death, cycle_length}]}
```

**Filtration:** edges sorted by weight ascending. H0 death = component merge. H1 birth = cycle creation. Uses Union-Find for H0 and DFS for H1.

#### `compute_simplicial_complexes(driver, engagement_id)`
Computes all cliques up to size 5 using Bron-Kerbosch with pivot. Returns simplex counts by dimension and maximal simplices.

```python
result = await compute_simplicial_complexes(driver, "eng-123")
# result["simplex_counts"] -> { "1-simplex": 47, "2-simplex": 12, ... }
# result["maximal_simplices"] -> [[node1, node2, node3], ...]
```

#### `detect_graph_voids(driver, engagement_id)`
Detects topological voids — nodes farther than 2 hops from any monitoring/EDR node. Returns void list with distance to monitor and void ratio.

---

## Graph Neural Reasoning Module (`graph/gnn_reasoning.py`)

### Algorithms

#### `compute_node_embeddings(driver, engagement_id)`
Generates Node2Vec-style embeddings via biased random walks ($p=0.5, q=1.5$). Co-occurrence matrix PPMI-weighted, truncated spectral decomposition to 32 dimensions. Returns embeddings and high-similarity pairs.

```python
result = await compute_node_embeddings(driver, "eng-123")
# result["node_embeddings"] -> [{id, name, type, embedding: [8 dims]}]
# result["high_similarity_pairs"] -> [{node_a, node_b, similarity}]
```

**Walk parameters:** length=20, walks/node=10, window=5.

#### `predict_hidden_relationships(driver, engagement_id)`
Finds node pairs with cosine similarity > 0.8 but no existing edge. Predicts likely relationship type based on entity types.

#### `compute_privilege_escalation_prediction(driver, engagement_id)`
Finds credential nodes with embedding similarity > 0.6 to privilege/service nodes. Returns predicted escalation paths with probability.

---

## Attractor Theory Module (`graph/attractor_theory.py`)

### Algorithms

#### `compute_compromise_attractors(driver, engagement_id)`
Computes $A(v) = 0.4 \cdot \text{inflow} + 0.35 \cdot \rho_{\text{priv}} + 0.25 \cdot \text{centrality}$. Returns attractor-ranked nodes and concentration ratio.

#### `compute_attractor_instability(driver, engagement_id)`
Computes $\sigma(v) = |\Phi(v) - \bar{\Phi}_{N(v)}|$ for all nodes. Returns unstable regions and instability statistics.

#### `compute_compromise_inevitability(driver, engagement_id)`
Computes $\iota(v) = \min(1, \Phi_{\text{norm}} \cdot \text{PG}_{\text{norm}} \cdot 1.5)$. Returns inevitability scores and inevitable nodes.

---

## Information Geometry Module (`graph/information_geometry.py`)

### Algorithms

#### `compute_geodesic_paths(driver, engagement_id, source_id, target_id)`
Computes weighted shortest path in 4D manifold space. Uses Dijkstra with Manhattan distance in manifold coordinates as edge weight.

```python
result = await compute_geodesic_paths(driver, "eng-123", "node-1", "node-10")
# result["geodesic_distance"] -> 1.2345
# result["path_steps"] -> [{from_coords, to_coords, segment_distance}, ...]
```

#### `compute_manifold_curvature(driver, engagement_id)`
Computes local curvature as normalized variance of neighbor confidence scores. Returns curvature per node and high-curvature regions (> 0.6).

#### `compute_gradient_descent_path(driver, engagement_id, source_id, objective)`
Computes steepest-ascent path from source toward maximum privilege, risk, or pressure. Returns path nodes with objective values at each step.
