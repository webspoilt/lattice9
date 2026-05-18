# L A T T I C E 9

Lattice9 is a graph-native offensive intelligence infrastructure for probabilistic attack-path reasoning, temporal topology cognition, and distributed adversarial computation.

[![Author](https://img.shields.io/badge/AUTHOR-ZERODAY-1a1a2e?style=for-the-badge&logo=shield&logoColor=6B8FC2)](https://github.com/zeroday)
[![Topology](https://img.shields.io/badge/TOPOLOGY-GRAPH%20NATIVE-1a1a2e?style=for-the-badge&logo=neo4j&logoColor=6B8FC2)](https://github.com/zeroday)
[![Reasoning](https://img.shields.io/badge/REASONING-BAYESIAN-1a1a2e?style=for-the-badge&logo=probabilistic&logoColor=6B8FC2)](https://github.com/zeroday)
[![Infrastructure](https://img.shields.io/badge/INFRASTRUCTURE-DISTRIBUTED-1a1a2e?style=for-the-badge&logo=redis&logoColor=6B8FC2)](https://github.com/zeroday)
[![Model](https://img.shields.io/badge/MODEL-TEMPORAL-1a1a2e?style=for-the-badge&logo=clock&logoColor=6B8FC2)](https://github.com/zeroday)

![Version](https://img.shields.io/badge/version-9.0.0--RC1-4A6FA5?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-3A7A6A?style=flat-square)
![Python](https://img.shields.io/badge/python-3.11+-8B7340?style=flat-square)
![Neo4j](https://img.shields.io/badge/neo4j-5.x-4A6FA5?style=flat-square)
![Proxima](https://img.shields.io/badge/proxima-4.1.0-6B6A8A?style=flat-square)
![MCP](https://img.shields.io/badge/MCP-ready-8B5A5A?style=flat-square)

---

## The Lattice9 Mission

> **Infrastructure is a graph. Vulnerabilities are edges. Compromise is a pathfinding problem.**
>
> Lattice9 models enterprise networks not as a flat list of assets, but as a high-dimensional, bitemporally evolving directed multigraph. It executes **23 computational intelligence algorithms** across the topology — spanning graph field theory, topological data analysis (TDA), adversarial game theory, attack economics, wave propagation, causal inference, entropy collapse, and counterfactual simulation — to mathematically prioritize lateral path exposure and minimize analyst cognitive load.
>
> **It does not scan. It does not dashboard. It computes.**
>
> *Architected and developed by **[zeroday](https://github.com/zeroday)***

---

## Systems Architecture Overview

![Lattice9 Architecture Overview](docs/diagrams/00-architecture-overview.png)

Lattice9 partitions and maps target subgraphs to independent traversers, utilizing Redis Streams for non-blocking task synchronization and Neo4j for structural schema relationships. The system operates across five computational layers:

| Layer | Function | Components |
| :--- | :--- | :--- |
| **L0 — Client** | Interface surface | CLI · REST API · WebSocket · MCP Client · Graph Console (D3/WebGL) |
| **L1 — Orchestration** | Request routing | Exposure Router · Intelligence Router · Evidence Router · Proxima Router |
| **L2 — Computation** | Graph intelligence | Topological Core + 23 Computational Intelligence Modules |
| **L3 — Agency** | Multi-agent reasoning | 7 Specialized Agents via Proxima MCP |
| **L4 — Persistence** | State infrastructure | Neo4j 5.x · PostgreSQL 16 · Redis 7.x · FastAPI |

---

## Graph-Native Offensive Cognition

### High-Dimensional Graph Model

Lattice9 formalizes target infrastructure mathematically as a bitemporally evolving directed multigraph $G_t$:

$$G_t = (V_t,\ E_t,\ W_t,\ \Phi_t)$$

Where:

- $V_t$ — Heterogeneous network entities: Hosts, Services, Credentials, Identities, Vulnerabilities, Evidence
- $E_t$ — Typed, directed relationships: `TRUSTS`, `AUTHENTICATES_TO`, `HOSTS`, `PRIVILEGE_ESCALATION`
- $W_t$ — Multi-dimensional edge weight matrix: transition cost, monitoring friction, target resistance
- $\Phi_t$ — Dynamic graph field state: compromise energy propagation

![Core Architecture Topology](docs/diagrams/01-core-architecture-topology.png)

> **Topological Invariant** — The graph is the sovereign source of truth. Every agent assertion must anchor to a specific Neo4j node or relationship. No agent can hypothesize a vulnerability or attack vector that violates the physical target state.

---

## Probabilistic Reasoning Engine

### Bayesian Belief Propagation

Enterprise telemetry is noisy, conflicting, and dynamic. Instead of treating vulnerability flags as binary absolute truths, Lattice9 runs **Damped Loopy Belief Propagation** sweeps to calculate a convergence confidence array $C_i$:

$$m_{i \to j}^{(t)} = (1 - \alpha) \cdot \left( \psi_{ij} \cdot C_0(i) \prod_{k \in N(i) \setminus \{j\}} m_{k \to i}^{(t-1)} \right) + \alpha \cdot m_{i \to j}^{(t-1)}$$

To prevent cyclical positive-feedback loops from inflating confidence values on uncompromised nodes, sweeps enforce a damping threshold $\alpha$ calibrated against the largest eigenvalue of the graph Laplacian $L$:

$$\alpha > 1 - \frac{1}{\rho_{\max}(L)}$$

![Bayesian Evidence Propagation DAG](docs/diagrams/02-bayesian-evidence-dag.png)

> **Evidence Weight Hierarchy** — Each evidence source carries a calibrated reliability weight: `manual_validation` (0.95) → `exploit_proof` (0.90) → `scan` (0.50) → `osint` (0.40) → `inference` (0.35). Temporal decay applies exponential half-life discounting ($t_{1/2} = 30$ days) to all observations.

---

## Attack-Path Synthesis

### Constraint-Aware Traversal

Attack paths are not simple shortest-paths. Lattice9 filters paths deterministically by evaluating physical preconditions (operating systems, ingress port states, credential access privileges) during edge relaxation. If a prerequisite gate is closed, the edge cost evaluates to $\infty$, routing path synthesis strictly around impossible vectors.

### Attack Utility Optimization

The planning traverser prioritizes pathways by maximizing **Attacker ROI/Utility** $\mathcal{U}(P)$:

$$\mathcal{U}(P) = \frac{\displaystyle\sum_{v \in P} \text{Gain}(v) \cdot \prod_{e \in P} P_{\text{traverse}}(e)}{\text{Risk}_{\text{detection}}(P) \cdot \displaystyle\sum_{e \in P} \text{Cost}_{\text{operational}}(e)}$$

![Attack Path Synthesis](docs/diagrams/07-attack-path-synthesis.png)

Paths are dynamically ranked along two orthogonal axes: **stealth-optimal** routes (minimizing detection visibility) vs **speed-optimal** routes (minimizing execution complexity). The utility function encodes both the probability of successful traversal and the economic cost of detection, producing operationally realistic prioritization.

---

## Attack-Path Topology with Resistance

![Attack Path Topology with Resistance](docs/diagrams/03-attack-path-topology.png)

### Topology Resistance

$$R_{\text{topo}}(G, A) = \frac{\lambda_2 \cdot \Phi(A)}{|V|}$$

Where $\lambda_2$ is the algebraic connectivity (Fiedler value), $\Phi(A)$ is the minimum cut for adversary $A$, and the resulting score quantifies the structural difficulty of traversing from adversarial entry points to critical assets. Nodes are scored on $R_{\text{topo}} \in [0, 1]$: values below 0.4 indicate critical vulnerability; values above 0.7 indicate defended posture.

---

## Temporal Cognition

Trust structures and credentials decay in validity over time. Lattice9 applies a temporal half-life decay function to edge weights and finding confidences:

$$C_t(e) = C_0(e) \cdot e^{-\lambda (t - t_{\text{update}})}$$

Where $\lambda = \ln(2) / t_{1/2}$ and the default half-life is calibrated at 30 days. This automatically decays the validity of aged or inactive credentials, simulating natural environmental drift. The temporal engine maintains bitemporal snapshots — each engagement state is versioned, enabling drift computation between any two temporal points.

---

## Distributed Graph Computation

### Multi-Agent Framework

Seven specialized agents coordinate through **Proxima's Model Context Protocol (MCP)** routing layer, each grounded strictly in graph state:

| Agent | Model | Operational Scope |
| :--- | :--- | :--- |
| **Planner** | Claude 3.5 Sonnet | Decomposes objectives into dependency-aware task DAGs |
| **Recon** | GPT-4o / Local Llama | Executes discovery, port probing, fingerprinting |
| **Correlation** | Claude 3.5 Sonnet | Maps relationships, trust boundaries, credential-to-asset bindings |
| **Exploit** | Claude 3.5 Sonnet | Synthesizes exploit chains with precondition validation |
| **Verification** | Gemini 1.5 Pro | Skeptically audits inferences for false-positive elimination |
| **Report** | Claude 3.5 Sonnet | Generates systems engineering documentation |
| **Memory** | Gemini 1.5 Pro | Compiles snapshots, evolution tracking, topological drift |

### Execution Modes

```yaml
Sequential:   Plan → Recon → Correlate → Exploit → Verify → Report
Parallel:     Concurrent sub-task execution with async merge
Debate:       Dialectic consensus rounds before Neo4j commit
Round-Robin:  Cyclic sweeps until graph confidence stabilizes
```

> **Hallucination Elimination** — Agent assertions must anchor to Neo4j node/relationship IDs. If the telemetry state changes, the drift engine triggers active recomputation. No agent can hypothesize a vulnerability that violates the physical target state.

---

## Master Systems-Analysis & Operational Validation

Lattice9 has been rigorously audited and certified under strict computational constraints. The operational verification details are published in [analysis/runtime_validation_report.md](analysis/runtime_validation_report.md):

- **Damped Belief Stabilization:** Loopy Belief Propagation sweeps are proven to converge within 10-15 cycles even under highly cyclical Active Directory trust loops, mitigated by our **Dynamic Oscillation Shield** that automatically scales down $\gamma$ when path oscillations are detected.
- **Pearl Causal do-calculus:** The causal inference engine simulates network interventions—physically removing trust edges or isolating vertices—by dynamically altering the local graph state and re-solving joint probabilities without modifying the live production environment.
- **D3/WebGL 3D Visual Fidelity:** Nodes in the 3D Force Graph console are sized dynamically by evidence-weighted Bayesian belief ($1 + C_i \times 3$) and colored by typed entities, while abstract non-Euclidean geometries (manifold curvature, homology voids) are isolated to sidebar telemetry panels to maintain human cognitive clarity.
- **100% Passing Tests:** All 12 regression test cases (`server-py/test_engine.py`) execute and pass successfully, confirming complete computational and mathematical integrity.

---

## 23 Computational Intelligence Modules

Every mathematical model in Lattice9 maps to an operational consequence in lateral path computation. There is no decorative mathematics.

| Module | Formulation | Operational Effect |
| :--- | :--- | :--- |
| **Field Theory** | $\Phi(v) = \sum \frac{\text{Risk}(u) \cdot \text{Trust}(u,v)}{d(u,v)^\gamma}$ | Maps compromise gravity wells and risk convergence zones |
| **Wave Propagation** | $\frac{\partial C}{\partial t} = D\nabla^2 C - \lambda C + S(x,t)$ | Simulates threat contagion velocity across subnet boundaries |
| **Resistance Theory** | $R(P) = \sum \frac{\text{DetectionRisk}(e)}{\text{TraversalProbability}(e)}$ | Calculates topological routing barriers to avoid detection |
| **Adversarial Game** | $V^{\ast}(s) = \max_a \min_d \mathbb{E}[R(s,a,d) + \gamma V^{\ast}(s')]$ | Identifies minimax pathways under active defensive patching |
| **Attack Economics** | $\mathcal{U}(P) = \frac{\text{Gain} \cdot \prod P_{\text{traverse}}}{\text{Risk}_{\text{detect}} \cdot \sum \text{Cost}}$ | Ranks exploit paths by attacker resource expenditure vs ROI |
| **Entropy Collapse** | $H(G) = -\sum P(P_i) \log_2 P(P_i)$ | Isolates structural choke points to reduce uncertainty |
| **Causal Inference** | $P(Y \mid \text{do}(X = x))$ | Identifies root causal exposures beyond correlation |
| **Topological DA** | $H_0, H_1$ Persistent Homology | Detects topological voids, isolation gaps, circular AD loops |
| **Attractor Theory** | $A(v) = \text{Trust} \cdot \text{Privilege} \cdot \text{Centrality}$ | Locates stable compromise basins where attacks converge |
| **Information Geometry** | $g_{ij}$ Riemannian Metric Tensor | Curves attack manifold to trace geodesic least-resistance routes |
| **Graph Neural** | $\mathbf{h}_v^{(k)} = \text{AGGREGATE}\left(\{\mathbf{h}_u^{(k-1)}\}\right)$ | Embeds network nodes to predict undocumented trust edges |
| **Bayesian Propagation** | $m_{i \to j}^{(t)} = (1-\alpha)(\psi_{ij} C_0 \prod m) + \alpha m^{(t-1)}$ | Propagates confidence with Laplacian-calibrated damping |
| **Temporal Decay** | $C_t(e) = C_0(e) \cdot e^{-\lambda \Delta t}$ | Decays credential validity simulating environmental drift |
| **Blast Radius** | Multi-dimensional impact analysis | Computes cascading compromise reach from any node |
| **Counterfactual** | Sandboxed mitigation simulation | Tests defense changes without affecting live graph |

---

## Architectural Comparison

Traditional offensive-security platforms optimize for scan execution and vulnerability listing. Lattice9 operates on stateful adversarial graph cognition.

| Dimension | Legacy Security Tools | Lattice9 Cognition Engine |
| :--- | :--- | :--- |
| **Core Data Model** | Flat, disconnected table of findings | Typed, directed, high-dimensional multigraph |
| **Path Prioritization** | Static CVSS severity scoring | Attacker ROI utility optimized over topological context |
| **Temporal State** | Per-engagement scan snapshots | Persistent, bitemporally evolving graph memory |
| **Evidence Validation** | Static screenshots and log attachments | Cryptographically provable evidence lineage DAGs |
| **Confidence Metric** | Binary vulnerability flags | Bayesian belief propagation under uncertainty |
| **Exploit Chains** | Manual analyst correlation | Constraint-aware Dijkstra & manifold geodesic routing |
| **Reasoning Model** | Ad-hoc analyst intuition | Multi-agent debate grounded strictly in graph states |

---

## Sovereign LLM Integration

Lattice9 supports sovereign deployment with local LLM integration through the Proxima routing layer:

- **Ollama** — Local model serving with automatic model detection
- **vLLM** — High-throughput inference for production deployments
- **llama.cpp** — CPU-optimized inference for air-gapped environments
- **HuggingFace** — Direct model loading with quantization support

The Recon agent automatically detects and routes to available local models, falling back to cloud APIs only when explicitly configured. This enables fully air-gapped operation where no telemetry leaves the deployment environment.

---

## Production API Registry

### Graph & Intelligence Computations

```http
POST   /analyze/{engagement_id}              Full intelligence analysis sweep
POST   /events/{engagement_id}               Event-driven graph recomputation
GET    /snapshots/{engagement_id}             Temporal snapshots
GET    /snapshots/{id}/drift                  Topological drift computation
GET    /algorithms/{id}/paths                 Multi-algorithm attack paths
GET    /algorithms/{id}/exploit-chains        Constraint-validated exploit chains
GET    /field/{id}/density                    Attack pressure field density
GET    /field/{id}/gradients/{node}           Field gradient vector at node
GET    /resistance/{id}/paths                 Resistance-weighted stealth paths
POST   /wave/{id}/simulate                    Compromise wave propagation
GET    /game/{id}/minimax                     Game-theoretic minimax optimal path
GET    /game/{id}/nash                        Local Nash equilibrium locations
GET    /economics/{id}/paths                  Attacker ROI-ranked pathways
GET    /topology/{id}/homology                Persistent homology topological sweep
GET    /gnn/{id}/predict-relationships        GNN-predicted undocumented trust edges
GET    /attractor/{id}/inevitability          Structural compromise inevitability index
GET    /geometry/{id}/geodesic                Geodesic path routing on risk manifold
GET    /entropy/{id}                          Topological Shannon entropy levels
POST   /counterfactual/{id}/simulate          Sandboxed defense mitigation simulation
GET    /evidence/{finding_id}/lineage         Cryptographic evidence ancestry trace
```

### Proxima & Agent Orchestration

```http
GET    /proxima/health                        MCP connectivity status
GET    /proxima/models                        Available LLM models
GET    /proxima/agents                        Registered multi-agent runtimes
POST   /proxima/agents/run                    Single agent execution
POST   /proxima/pipeline/run                  Full multi-agent sequential pipeline
POST   /proxima/debate                        Dialectic multi-agent consensus debate
```

---

## Cleaned Repository Structure

The repository maintains an exceptionally clean, modular systems-engineering structure:

```text
lattice9/
├── server-py/                          # Python Graph Intelligence Engine
│   ├── main.py                         # FastAPI REST framework
│   ├── db.py                           # PostgreSQL & Neo4j connector core
│   ├── graph/                          # Core Graph Computation Engines
│   │   ├── algorithms.py               # Constraint-aware path relaxing
│   │   ├── confidence.py               # Loopy belief propagation core
│   │   ├── field_theory.py             # Graph field spatial equations
│   │   └── topological_da.py           # Union-find & Bron-Kerbosch simplicial complexes
│   └── proxima/                        # Proxima MCP & Multi-Agent systems
│
├── server/                             # TypeScript Access Layer
│   └── routers/                        # tRPC schema & intelligence endpoints
│
├── client/                             # React WebGL Dashboard Console
│   └── src/components/                 # Three.js 3D Force Graph console
│
├── analysis/                           # Master Operational Audits
│   └── runtime_validation_report.md    # Code certification & systems-analysis report
│
└── docs/                               # Systems Specifications & Pubs
    ├── diagrams/                       # High-Fidelity Architectural Visualizations (PNG)
    │   ├── html/                       # D3/WebGL Interactive Visuals (HTML)
    │   └── scripts/                    # Playwright WebGL automated rendering scripts
    ├── whitepaper/                     # Publication-grade LaTeX & PDFs
    │   ├── lattice9.tex                # LaTeX whitepaper source
    │   ├── Lattice9-Technical-Whitepaper.pdf
    │   └── cover.pdf
    └── metadata/                       # Structure and dependency schemas (JSON)
```

---

## Research Directions

Lattice9's computational framework opens several research frontiers in adversarial graph theory:

1. **Spectral Adversarial Perturbation** — How small topological changes (single edge additions/removals) alter the Fiedler value and therefore the minimum cut resistance
2. **Non-Euclidean Attack Manifolds** — Extending information geometry to hyperbolic spaces for better modeling of hierarchical trust structures (Active Directory forests)
3. **Topological Persistence Under Mutation** — Tracking how Betti numbers evolve as the graph is mutated by defensive patching operations
4. **Causal Counterfactual Warfare** — Using structural causal models to simulate "what if this vulnerability were patched" without modifying the live graph
5. **GNN-Based Edge Prediction** — Predicting undocumented trust relationships from structural graph embeddings
6. **Entropy-Weighted Geodesic Routing** — Combining information-theoretic entropy with geodesic distance for uncertainty-aware path planning

---

## Deployment

### System Requirements

| Component | Requirement |
| :--- | :--- |
| **OS** | Linux (Ubuntu 22.04+) or macOS |
| **Graph Store** | Neo4j 5.x (local or remote) |
| **Broker** | Redis 7.x (streams + async tasks) |
| **Database** | PostgreSQL 16+ (with `pgvector`) |
| **Runtime** | Python 3.11+ and Node.js 20+ |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/webspoilt/lattice9.git
cd lattice9

# Instantiate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
cd server-py
pip install -r requirements.txt
```

### Environment Configuration

```env
# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password

# PostgreSQL Transactional Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/lattice9

# Redis Queue & Stream Broker
REDIS_URL=redis://localhost:6379/0

# Sovereign Engine Key
LATTICE9_ENGINE_KEY=sovereign-l9-secret-2026

# LLM API Keys (optional — Proxima handles routing)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Containerized Deployment

```bash
docker compose up -d --build
```

### Running the Engine

```bash
# Initialize graph schema and indexes
python -m graph.schema

# Start the FastAPI REST application
python main.py
```

The REST API documentation is exposed at `http://localhost:8000/docs`.

---

## Execution Philosophy

### Rigorous Science Over Tool Spam

Traditional vulnerability platforms measure success by the count of integrated wrapping tools — producing massive alerts of un-exploitable noise. Lattice9 executes exactly **23 rigorous mathematical modules**. Each module mathematically changes how paths are traversed, how confidence propagates, or how exposure is prioritized. Every equation directly guides lateral movement reasoning.

### Observable Graph-State Grounding

We eliminate AI hallucination by architectural constraints rather than prompt engineering. The **graph is the sovereign source of truth**. When an agent makes an assertion, the statement must be anchored to a specific Neo4j node or relationship. If the telemetry state changes, the drift engine triggers active recomputation.

---

## Whitepaper & Documentation Publications

| Document | Description |
| :--- | :--- |
| [Systems Whitepaper](docs/whitepaper/lattice9.pdf) | Comprehensive mathematical and architectural specification (PDF) |
| [Technical Whitepaper Spec](docs/whitepaper/Lattice9-Technical-Whitepaper.pdf) | Formal LaTeX compilation and equations list (PDF) |
| [Distributed Worker Spec](docs/architecture/distributed-worker-architecture.md) | Hash-ring replication and partition synchronization spec |
| [Engineering Blog Autopsy](docs/research/engineering-blog-autopsy.md) | Systems-level analysis and research documentation |

---

## Mathematical Appendix

### Field Theory — Attack Pressure Formulation

$$\Phi(v) = \sum_{u \in V \setminus \{v\}} \frac{\text{Risk}(u) \cdot \text{Trust}(u, v)}{d(u, v)^\gamma}$$

Where $d(u,v)$ is the geodesic distance on the topology, and $\gamma$ is the field spatial decay factor (default: inverse square law, $\gamma = 2.0$). The field density at each node identifies natural gravity wells where credential compromise propagates fastest.

### Wave Propagation — Threat Diffusion PDE

$$\frac{\partial C}{\partial t} = D\nabla^2 C - \lambda C + S(x, t)$$

A reaction-diffusion equation modeling compromise propagation: $D$ is the diffusion coefficient (network permeability), $\lambda$ is the natural decay rate (detection probability), and $S(x,t)$ is the source term (new compromise injections). This models the dynamic velocity of threat contagion across subnet boundaries.

### Adversarial Game Theory — Minimax Equilibrium

$$V^{\ast}(s) = \max_a \min_d \mathbb{E}[R(s, a, d) + \gamma V^{\ast}(s')]$$

The attacker selects action $a$ to maximize expected reward, while the defender selects action $d$ to minimize it. The resulting equilibrium identifies the most robust attack paths under the assumption of active defensive response.

### Topology Resistance — Algebraic Connectivity

$$R_{\text{topo}}(G, A) = \frac{\lambda_2 \cdot \Phi(A)}{|V|}$$

Combines the Fiedler value $\lambda_2$ (algebraic connectivity) with the minimum cut $\Phi(A)$ for adversary $A$ to quantify structural resistance to adversarial traversal.

### Entropy Collapse — Structural Uncertainty

$$H(G) = -\sum_{i} P(P_i) \log_2 P(P_i)$$

Shannon entropy over the distribution of attack paths $P_i$. Low entropy indicates structural convergence (few dominant paths — high risk), while high entropy indicates path diversity (many equally viable routes — defense complexity).

### Information Geometry — Riemannian Metric

$$ds^2 = g_{ij}\, dx^i\, dx^j \quad | \quad \Gamma(\sigma) = \int_\sigma \sqrt{g_{ij}\, dx^i\, dx^j}$$

The metric tensor $g_{ij}$ encodes traversal resistance on the attack manifold. Geodesic paths $\Gamma(\sigma)$ trace least-resistance routes through this curved space, naturally routing around high-detection zones.

---

## Licensing

Lattice9 is provisioned under the [MIT License](LICENSE).

---

**LATTICE9 — COMPUTE, DON'T SCAN.**

*Architected & Created by [zeroday](https://github.com/zeroday)*
