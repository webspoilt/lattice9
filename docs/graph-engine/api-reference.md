# Lattice9 API Reference

## REST Endpoints & tRPC Procedures

---

## REST API (`server-py/main.py`)

### Graph & Topology

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/graph/analyze` | Build and analyze graph |
| GET | `/api/v1/graph/status` | Graph status endpoint |
| GET | `/api/v1/graph/{engagement_id}` | Get graph by engagement |
| GET | `/api/v1/graph/{engagement_id}/paths` | List attack paths |
| GET | `/api/v1/graph/{engagement_id}/paths/optimal` | Optimal attack paths |
| GET | `/api/v1/graph/{engagement_id}/blast-radius` | Blast radius analysis |
| GET | `/api/v1/graph/{engagement_id}/field-density` | Attack pressure field |
| GET | `/api/v1/graph/{engagement_id}/field-gradients/{node_id}` | Field gradients |
| GET | `/api/v1/graph/{engagement_id}/privilege-diffusion` | Privilege density |
| GET | `/api/v1/graph/{engagement_id}/resistance-map` | Edge resistance |
| GET | `/api/v1/graph/{engagement_id}/wave-propagation` | Wave propagation |
| GET | `/api/v1/graph/{engagement_id}/persistent-homology` | Topological persistence |
| GET | `/api/v1/graph/{engagement_id}/simplicial-complexes` | Simplicial complexes |
| GET | `/api/v1/graph/{engagement_id}/graph-voids` | Topological voids |
| GET | `/api/v1/graph/{engagement_id}/node-embeddings` | Node embeddings |
| GET | `/api/v1/graph/{engagement_id}/hidden-relationships` | Hidden relationship prediction |
| GET | `/api/v1/graph/{engagement_id}/privilege-escalation-prediction` | PrivEsc prediction |
| GET | `/api/v1/graph/{engagement_id}/attractors` | Compromise attractors |
| GET | `/api/v1/graph/{engagement_id}/instability` | Topological instability |
| GET | `/api/v1/graph/{engagement_id}/inevitability` | Compromise inevitability |
| GET | `/api/v1/graph/{engagement_id}/manifold-curvature` | Manifold curvature |
| POST | `/api/v1/graph/{engagement_id}/geodesic-path` | Geodesic path computation |
| POST | `/api/v1/graph/{engagement_id}/gradient-descent` | Gradient descent path |

### Reasoning

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/reasoning/{engagement_id}/minimax-path/{source_id}/{target_id}` | Minimax path |
| GET | `/api/v1/reasoning/{engagement_id}/nash-equilibrium` | Nash equilibrium |
| GET | `/api/v1/reasoning/{engagement_id}/path-economics/{path_id}` | Path economics |
| GET | `/api/v1/reasoning/{engagement_id}/ranked-paths` | Ranked paths by utility |
| GET | `/api/v1/reasoning/{engagement_id}/stealth-paths` | Stealth-optimal paths |
| GET | `/api/v1/reasoning/{engagement_id}/causal-inference` | Causal inference |
| GET | `/api/v1/reasoning/{engagement_id}/counterfactuals/{node_id}` | Counterfactual analysis |

### Evals

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/evals/evaluate-run` | Evaluate a run |
| POST | `/api/v1/evals/compare-runs` | Compare two runs |
| GET | `/api/v1/evals/metrics` | Get evaluation metrics |

### Proxima (Agent System)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/proxima/execute` | Execute agent task |
| GET | `/api/v1/proxima/tasks` | List tasks |
| GET | `/api/v1/proxima/tasks/{task_id}` | Get task status |
| POST | `/api/v1/proxima/agents/route` | Route to specific agent |
| GET | `/api/v1/proxima/agents` | List agents |

---

## tRPC API (`server/routers/intelligence.ts`)

### Attack Paths

| Procedure | Input | Output |
|---|---|---|
| `attackPaths.list` | `{engagementId}` | Path[] |
| `attackPaths.optimal` | `{engagementId}` | Path[] |
| `attackPaths.evolution` | `{engagementId}` | Evolution |

### Blast Radius

| Procedure | Input | Output |
|---|---|---|
| `blastRadius.compute` | `{engagementId, nodeId}` | BlastRadiusResult |
| `blastRadius.analyze` | `{engagementId}` | BlastRadiusAnalysis |

### Causal

| Procedure | Input | Output |
|---|---|---|
| `causal.inference` | `{engagementId}` | CausalGraph |
| `causal.counterfactuals` | `{engagementId, nodeId}` | CounterfactualResult |

### Field Theory

| Procedure | Input | Output |
|---|---|---|
| `fieldTheory.density` | `{engagementId}` | FieldDensityResult |
| `fieldTheory.gradients` | `{engagementId, nodeId}` | FieldGradientsResult |
| `fieldTheory.privilegeDiffusion` | `{engagementId}` | PrivilegeDiffusionResult |

### Resistance

| Procedure | Input | Output |
|---|---|---|
| `resistance.map` | `{engagementId}` | ResistanceMap |
| `resistance.weightedPaths` | `{engagementId, sourceId, targetId}` | WeightedPathsResult |
| `resistance.segmentation` | `{engagementId}` | SegmentationResult |

### Wave Propagation

| Procedure | Input | Output |
|---|---|---|
| `wavePropagation.simulate` | `{engagementId, sourceNodeIds}` | WavePropagationResult |
| `wavePropagation.velocity` | `{engagementId}` | VelocityResult |
| `wavePropagation.amplification` | `{engagementId}` | AmplificationResult |

### Game Theory

| Procedure | Input | Output |
|---|---|---|
| `gameTheory.minimax` | `{engagementId, sourceId, targetId}` | MinimaxResult |
| `gameTheory.nashEquilibrium` | `{engagementId}` | NashResult |

### Economics

| Procedure | Input | Output |
|---|---|---|
| `economics.pathEconomics` | `{engagementId, pathId}` | PathEconomicsResult |
| `economics.rankPaths` | `{engagementId}` | RankedPathsResult |
| `economics.stealthPaths` | `{engagementId}` | StealthPathsResult |

### Topology

| Procedure | Input | Output |
|---|---|---|
| `topology.persistentHomology` | `{engagementId}` | PersistentHomologyResult |
| `topology.simplicialComplexes` | `{engagementId}` | SimplicialComplexResult |
| `topology.graphVoids` | `{engagementId}` | GraphVoidsResult |

### Graph Learning

| Procedure | Input | Output |
|---|---|---|
| `graphLearning.embeddings` | `{engagementId}` | NodeEmbeddingsResult |
| `graphLearning.hiddenRelationships` | `{engagementId}` | HiddenRelationshipsResult |
| `graphLearning.privilegeEscalation` | `{engagementId}` | PrivilegeEscalationPredictionResult |

### Attractor Theory

| Procedure | Input | Output |
|---|---|---|
| `attractorTheory.attractors` | `{engagementId}` | AttractorResult |
| `attractorTheory.instability` | `{engagementId}` | InstabilityResult |
| `attractorTheory.inevitability` | `{engagementId}` | InevitabilityResult |

### Information Geometry

| Procedure | Input | Output |
|---|---|---|
| `informationGeometry.geodesic` | `{engagementId, sourceId, targetId}` | GeodesicResult |
| `informationGeometry.curvature` | `{engagementId}` | CurvatureResult |
| `informationGeometry.gradientDescent` | `{engagementId, sourceId, objective}` | GradientDescentResult |
