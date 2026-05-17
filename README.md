<p align="center">
  <img src="https://raw.githubusercontent.com/webspoilt/lattice9/main/assets/lattice9-banner.png" alt="Lattice9 Architecture Banner" width="100%" />
</p>

<p align="center">
  <strong>
    Graph-native offensive intelligence infrastructure for probabilistic attack-path reasoning,
    temporal topology cognition, and distributed adversarial computation.
  </strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Topology-Graph%20Native-black?style=for-the-badge" alt="Topology: Graph Native"></a>
  <a href="#"><img src="https://img.shields.io/badge/Reasoning-Bayesian-black?style=for-the-badge" alt="Reasoning: Bayesian"></a>
  <a href="#"><img src="https://img.shields.io/badge/Infrastructure-Distributed-black?style=for-the-badge" alt="Infrastructure: Distributed"></a>
  <a href="#"><img src="https://img.shields.io/badge/Model-Temporal-black?style=for-the-badge" alt="Model: Temporal"></a>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-9.0.0--RC1-blue?style=flat-square" alt="Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/python-3.11+-orange?style=flat-square" alt="Python"></a>
  <a href="#"><img src="https://img.shields.io/badge/neo4j-5.x-cyan?style=flat-square" alt="Neo4j"></a>
  <a href="#"><img src="https://img.shields.io/badge/proxima-4.1.0--compatible-purple?style=flat-square" alt="Proxima"></a>
  <a href="#"><img src="https://img.shields.io/badge/MCP-ready-ff6b35?style=flat-square" alt="MCP"></a>
</p>

---

## The Lattice9 Mission

> [!IMPORTANT]
> **Infrastructure is a graph. Vulnerabilities are edges. Compromise is a pathfinding problem.**
> 
> Lattice9 models enterprise networks not as a flat list of assets, but as a high-dimensional, bitemporally evolving directed multigraph. It executes **23 computational intelligence algorithms** across the topology — spanning graph field theory, topological data analysis (TDA), adversarial game theory, attack economics, wave propagation, causal inference, entropy collapse, and counterfactual simulation — to mathematically prioritize lateral path exposure and minimize analyst cognitive load.
> 
> **It does not scan. It does not dashboard. It computes.**

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

## Core System Architecture

Lattice9 partitions and maps target subgraphs to independent traversers, utilizing Redis Streams for non-blocking task synchronization and Neo4j for structural schema relationships.

```
┌─────────────────────────────────────────────────────────────┐
│                        User / Client                         │
│               (CLI · API · WebSocket · MCP Client)           │
└─────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Lattice9 Core                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              FastAPI Orchestration Layer                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │ Exposure  │ │ Intelligence │ │ Evidence │ │ Proxima │   │ │
│  │  │  Router   │ │   Router    │ │  Router  │ │  Router │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Graph Intelligence Engine                   │ │
│  │                                                           │ │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐   │ │
│  │  │  Topological      │  │  Computational               │   │ │
│  │  │  Core             │  │  Intelligence                │   │ │
│  │  │  ┌──────────────┐ │  │  ┌────────────┐ ┌────────┐ │   │ │
│  │  │  │ Neo4j Graph  │ │  │  │ Field      │ │ Wave   │ │   │ │
│  │  │  │ Engine       │ │  │  │ Theory     │ │ Prop.  │ │   │ │
│  │  │  │ Schema       │ │  │  ├────────────┤ ├────────┤ │   │ │
│  │  │  │ Algorithms   │ │  │  │ Resistance  │ │ Game   │ │   │ │
│  │  │  │ Temporal     │ │  │  │ Theory     │ │ Theory │ │   │ │
│  │  │  │ Confidence   │ │  │  ├────────────┤ ├────────┤ │   │ │
│  │  │  │ Evolution    │ │  │  │ Economics   │ │ GNN    │ │   │ │
│  │  │  └──────────────┘ │  │  │ Engine     │ │ Embed  │ │   │ │
│  │  └──────────────────┘  │  ├────────────┤ ├────────┤ │   │ │
│  │                        │  │ Attractor   │ │ Info   │ │   │ │
│  │                        │  │ Theory     │ │ Geom.  │ │   │ │
│  │                        │  └────────────┘ └────────┘ │   │ │
│  │                        └─────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Multi-Agent System                           │ │
│  │                                                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │  Planner │ │  Recon   │ │Correlation│ │  Exploit │   │ │
│  │  │  Agent   │ │  Agent   │ │  Agent    │ │  Agent   │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │ │
│  │  │Verification│ │  Report  │ │  Memory  │                │ │
│  │  │  Agent   │ │  Agent   │ │  Agent   │                │ │
│  │  └──────────┘ └──────────┘ └──────────┘                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Proxima Orchestration Layer                     │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  MCP     │ │  Model   │ │  Tool    │ │  Session  │       │
│  │  Server  │ │  Router  │ │  Registry│ │  Manager  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────┬──────────────────┬──────────────────┬──────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │  Claude  │      │  ChatGPT │      │  Gemini  │
     │(Anthropic)│      │ (OpenAI)  │      │ (Google)  │
     └──────────┘      └──────────┘      └──────────┘
           │                  │                  │
           ▼                  ▼                  ▼
     ┌──────────────────────────────────────────────────────┐
     │               Tools + Attack Surface                   │
     │   Recon · Exploit DBs · CVE Feeds · DNS · CertShim    │
     └──────────────────────────────────────────────────────┘
```

---

## High-Dimensional Graph Model

Lattice9 formalizes target infrastructure mathematically as a bitemporally evolving directed multigraph $G_t$:

$$G_t = (V_t, E_t, W_t, \Phi_t)$$

Where:
- $V_t$ is the set of heterogeneous network entities (Hosts, Services, Credentials, Identities, Vulnerabilities, Evidence).
- $E_t$ is the set of typed, directed relationships mapping connectivity and trust privileges (`TRUSTS`, `AUTHENTICATES_TO`, `HOSTS`, `PRIVILEGE_ESCALATION`).
- $W_t$ is the multi-dimensional edge weight matrix defining transition cost, monitoring friction, and target resistance.
- $\Phi_t$ is the dynamic graph field state governing compromise energy propagation.

```mermaid
graph TD
    A[Telemetry Ingest] --> B[Graph Mutation Engine]
    B --> C[Temporal Graph Store]
    C --> D[Bayesian Propagation]
    D --> E[Attack Path Synthesis]
    E --> F[Operational Utility Solver]
    F --> G[Topology Visualization]
```

---

## 23 Computational Intelligence Modules

Every mathematical model in Lattice9 maps to an operational consequence in lateral path computation. There is no decorative mathematics.

```mermaid
graph LR
    subgraph Physics & Fields
    F1[Field Theory] --> W1[Wave Propagation]
    W1 --> A1[Attractor Theory]
    end
    subgraph Geometry & Curves
    I1[Information Geometry] --> R1[Resistance Theory]
    end
    subgraph Decision Science
    E1[Attack Economics] --> G1[Game Theory]
    G1 --> C1[Causal Inference]
    end
```

### 1. Bayesian Belief Propagation
Enterprise telemetry is noisy, conflicting, and dynamic. Instead of treating vulnerability flags as binary absolute truths, Lattice9 runs **Damped loopy Belief Propagation** sweeps to calculate a convergence confidence array $C_i$:

$$m_{i \to j}^{(t)} = (1 - \alpha) \cdot \left( \psi_{ij} \cdot C_0(i) \prod_{k \in N(i) \setminus \{j\}} m_{k \to i}^{(t-1)} \right) + \alpha \cdot m_{i \to j}^{(t-1)}$$

To prevent cyclical positive-feedback loops from inflating confidence values on uncompromised nodes, our sweeps enforce a damping threshold $\alpha$ calibrated against the largest eigenvalue of the graph Laplacian $L$:

$$\alpha > 1 - \frac{1}{\rho_{\text{max}}(L)}$$

### 2. Constraint-Aware Dijkstra Traversals
Attack paths are not simple shortest-paths. Lattice9 filters paths deterministically by evaluating physical preconditions (operating systems, ingress port states, credential access privileges) during edge relaxation. If a prerequisite gate is closed, the edge cost evaluates to $\infty$, routing path synthesis strictly around impossible vectors.

### 3. Probabilistic Attack Economics
The planning traverser prioritizes pathways by maximizing **Attacker ROI/Utility** $\mathcal{U}(P)$:

$$\mathcal{U}(P) = \frac{\sum_{v \in P} \text{Gain}(v) \cdot \prod_{e \in P} P_{\text{traverse}}(e)}{\text{Risk}_{\text{detection}}(P) \cdot \sum_{e \in P} \text{Cost}_{\text{operational}}(e)}$$

Paths are dynamically ranked, highlighting stealth-optimal routes (minimizing detection visibility) vs speed-optimal routes (minimizing execution complexity).

### 4. Graph Field Theory
Lattice9 models threat attraction wells by calculating the **Attack Pressure Field** $\Phi(v)$ generated by high-value, highly vulnerable assets:

$$\Phi(v) = \sum_{u \in V \setminus \{v\}} \frac{\text{Risk}(u) \cdot \text{Trust}(u, v)}{d(u, v)^\gamma}$$

Where $d(u,v)$ is the geodesic distance on the topology, and $\gamma$ is our field spatial decay factor. This highlights natural gravity wells where credential compromise propagates fastest.

### 5. Temporal Cognition & Exponential Decay
Trust structures and credentials decay in validity over time. Lattice9 applies a temporal half-life decay function to edge weights and finding confidences:

$$C_t(e) = C_0(e) \cdot e^{-\lambda (t - t_{\text{update}})}$$

This automatically decays the validity of aged or inactive credentials, simulating natural environmental drift.

### 6. Summary Matrix of Intelligence Modules

| Core Module | Mathematical Formulation | Target Operational Utility |
| :--- | :--- | :--- |
| **Field Theory** | $\Phi(v) = \sum \frac{\text{Risk}(u) \cdot \text{Trust}(u,v)}{d(u,v)^\gamma}$ | Maps high-density compromise attractors and risk gravity wells |
| **Resistance Theory** | $R(P) = \sum \frac{\text{DetectionRisk}(e)}{\text{TraversalProbability}(e)}$ | Calculates topological routing barriers to avoid detection thresholds |
| **Wave Propagation** | $\frac{\partial C}{\partial t} = D \nabla^2 C - \lambda C + S(x, t)$ | Simulates the dynamic velocity of threat contagion across subnet bounds |
| **Adversarial Game** | $V^*(s) = \max_a \min_d \mathbb{E}[R(s,a,d) + \gamma V^*(s')]$ | Identifies minimax pathways under active defensive patching scenarios |
| **Attack Economics** | $\text{Utility} = \frac{\text{Gain} \cdot \prod P_{\text{traverse}}}{\text{Risk}_{\text{detect}} \cdot \sum \text{Cost}}$ | Ranks exploit paths based on attacker resource expenditures vs ROI |
| **Entropy Collapse** | $H(G) = -\sum P(P_i) \log_2 P(P_i)$ | Isolates structural choke points to systematically reduce uncertainty |
| **Causal Inference** | $P(Y \mid \text{do}(X = x))$ | Identifies root causal exposures bypassing simple correlation lists |
| **Topological DA** | $H_0, H_1$ Persistent Homology | Detects topological voids, isolation gaps, and circular AD loops |
| **Attractor Theory** | $A(v) = \text{Trust} \cdot \text{Privilege} \cdot \text{Centrality}$ | Locates stable compromise basins where multi-hop attacks converge |
| **Info Geometry** | $g_{ij}$ Riemannian Metric Tensor | Curvatures attack manifold to trace geodesic least-resistance routes |
| **Graph Neural** | $\mathbf{h}_v^{(k)} = \text{AGGREGATE}\left(\{\mathbf{h}_u^{(k-1)}\}\right)$ | Embeds network nodes to predict missing or undocumented trust edges |

---

## Specialized Multi-Agent Framework

Seven specialized agents coordinate through **Proxima's Model Context Protocol (MCP)** routing layer. 

```
                          [ Planner Agent ]
                                  │
         ┌──────────────┬─────────┴─────────┬──────────────┐
         ▼              ▼                   ▼              ▼
  [ Recon Agent ] [ Correlate Agent ] [ Exploit Agent ] [ Verify Agent ]
         │              │                   │              │
         └──────────────┼───────────────────┴──────────────┘
                        ▼
                 [ Memory Agent ]
                        │
                        ▼
                [ Report Agent ]
```

- **Sequential Mode**: Standard linear feed-forward pipeline (Plan $\to$ Recon $\to$ Correlate $\to$ Exploit $\to$ Verify $\to$ Report).
- **Parallel Mode**: Concurrent execution of sub-tasks with analytical results merged asynchronously.
- **Debate Mode**: Dialectic model sweeps where agents challenge finding validity over round-based iterations before committing to Neo4j.
- **Round-Robin Mode**: Cyclic sweeps matching execution patterns until graph confidence updates stabilize.

| Agent | Target Model | Scope of Responsibility |
| :--- | :--- | :--- |
| **Planner** | Claude 3.5 Sonnet | Decomposes high-level objectives into dependency-aware task DAGs |
| **Recon** | GPT-4o / Local Llama | Executes target discovery, port probing, and fingerprinting tasks |
| **Correlation** | Claude 3.5 Sonnet | Maps relationships, trust boundaries, and credentials to assets |
| **Exploit** | Claude 3.5 Sonnet | Synthesizes exploit chains, path preconditions, and custom exploit logic |
| **Verification** | Gemini 1.5 Pro | skeptically audits inferences, checking for false-positives |
| **Report** | Claude 3.5 Sonnet | Generates clean executive autopsies and system engineering files |
| **Memory** | Gemini 1.5 Pro | Compiles snapshot metrics, evolution tracking, and topological drift |

---

## Directory Hierarchy

```text
lattice9/
├── server-py/                      # Python graph intelligence engine
│   ├── main.py                     # FastAPI application + REST routers
│   ├── config.py                   # Environment configuration
│   ├── db.py                       # PostgreSQL client connection
│   ├── models.py                   # Pydantic schema validation models
│   │
│   ├── graph/                      # Core graph computation modules
│   │   ├── schema.py               # Neo4j schema definitions + indexes
│   │   ├── engine.py               # Transactional CRUD operations
│   │   ├── algorithms.py           # Hardened constraint Dijkstra traversals
│   │   ├── temporal.py             # Snapshot generation + drift calculation
│   │   ├── confidence.py           # Bayesian confidence propagation & damping
│   │   ├── evolution.py            # Instability & entropy metric tracking
│   │   ├── field_theory.py         # Attack pressure gravity well calculations
│   │   ├── resistance.py           # Topological monitoring friction maps
│   │   ├── wave_propagation.py     # Threat wave diffusion simulators
│   │   ├── topological_da.py       # Persistent homology & Betti numbers
│   │   ├── gnn_reasoning.py        # Node2Vec random walk structural embeddings
│   │   ├── attractor_theory.py     # Stable compromise convergence basins
│   │   ├── information_geometry.py # Geodesic path routing on risk manifolds
│   │   └── blast.py                # Multi-dimensional blast radius analysis
│   │
│   ├── reasoning/                  # Analytical path planning
│   │   ├── attack_paths.py         # Multiclass shortest attack path planners
│   │   ├── exploit_chains.py       # Exploit prerequisite dependency solvers
│   │   ├── prioritization.py       # Contextual node prioritization matrices
│   │   ├── counterfactual.py       # Sandboxed mitigation simulations
│   │   ├── entropy.py              # Path uncertainty collapse metrics
│   │   ├── causal.py               # Structural Causal Models & do-calculus
│   │   ├── adversarial_game.py     # Minimax game equilibrium calculators
│   │   └── attack_economics.py     # Attacker ROI financial scoring models
│   │
│   ├── evidence/                   # Evidence and provenance
│   │   └── lineage.py              # Recursive cryptographic provenance tracing
│   │
│   └── proxima/                    # Proxima MCP & agent execution layer
│       ├── __init__.py             # Agent protocols + provider interfaces
│       ├── agents.py               # Multi-agent system definitions
│       └── api.py                  # Agent run & debate endpoints
│
├── server/                         # TypeScript Access Layer
│   ├── routers/
│   │   ├── vulnerability.ts        # Exposure tRPC routers
│   │   └── intelligence.ts         # Graph intelligence tRPC routers
│   └── routers.ts                  # tRPC router entrypoint
│
├── client/                         # React Frontend Interface
│   └── src/components/
│       ├── IntelligencePanel.tsx   # Dense, cold tactical operator interface
│       └── CorrelationGraph3D.tsx  # D3 & WebGL 3D graph visualizer
│
└── docs/                           # Publication-Grade Specifications
    ├── whitepaper/
    │   ├── lattice9-whitepaper.md  # Comprehensive systems whitepaper
    │   └── operational-deployment.md# Hardening, tuning, & air-gapped setup
    ├── architecture/
    │   └── distributed-worker-architecture.md # Hash-ring replication spec
    └── research/
        └── engineering-blog-autopsy.md # Systems blog autopsy
```

---

## Production API Registry

### Graph & Intelligence Computations

```text
POST   /analyze/{engagement_id}         # Run the full intelligence analysis sweep
POST   /events/{engagement_id}          # Trigger event-driven graph recomputation
GET    /snapshots/{engagement_id}       # Retrieve all temporal snapshots
GET    /snapshots/{id}/drift            # Compute multidimensional topological drift
GET    /algorithms/{id}/paths           # Compute multi-algorithm attack paths
GET    /algorithms/{id}/exploit-chains  # Generate constraint-validated exploit chains
GET    /field/{id}/density              # Compute graph field attack pressure density
GET    /field/{id}/gradients/{node}     # Compute field gradient vector at specific node
GET    /resistance/{id}/paths           # Generate resistance-weighted stealth paths
POST   /wave/{id}/simulate              # Execute compromise wave propagation simulation
GET    /game/{id}/minimax               # Compute game-theoretic minimax optimal path
GET    /game/{id}/nash                  # Calculate local Nash equilibrium locations
GET    /economics/{id}/paths            # Rank pathways based on Attacker ROI metrics
GET    /topology/{id}/homology          # Execute persistent homology topological sweeps
GET    /gnn/{id}/predict-relationships  # Run GNN to predict undocumented trust edges
GET    /attractor/{id}/inevitability    # Compute structural compromise inevitability index
GET    /geometry/{id}/geodesic          # Generate geodesic path routing on risk manifold
GET    /entropy/{id}                    # Measure topological Shannon entropy levels
POST   /counterfactual/{id}/simulate    # Simulate defense mitigations in sandboxed Neo4j
GET    /evidence/{finding_id}/lineage   # Recursively trace cryptographic evidence ancestry
```

### Proxima & Agent Orchestration

```text
GET    /proxima/health                  # Verify Proxima MCP connectivity status
GET    /proxima/models                  # List available LLM models on the routing gate
GET    /proxima/agents                  # List registered multi-agent runtimes
POST   /proxima/agents/run              # Execute a single agent on a targeted task
POST   /proxima/pipeline/run            # Execute full multi-agent sequential pipeline
POST   /proxima/debate                  # Trigger dialectic multi-agent consensus debate
```

---

## Example Multi-Agent Workflow

```text
1. OBJECTIVE: Analyze exposure of target subnet `10.100.0.0/16`.
   │
2. PLANNER decomposes into task DAG:
   ├── Task 1: CIDR network discovery & port scan
   ├── Task 2: Fingerprint exposed web & AD services
   ├── Task 3: Map credential configurations & trust boundaries
   └── Task 4: Trace exploit path and compute Attacker ROI
   │
3. RECON executes scans via MCP:
   ├── Identified 14 active hosts (host_0 to host_13)
   ├── Discovered open ports: host_3 (Nginx 1.24), host_7 (MS-RPC)
   └── Logged CVE-2024-24989 vulnerability on host_3 Nginx service
   │
4. CORRELATION maps topological relations:
   ├── host_3 (Nginx) RESOLVES_TO 10.100.2.14
   ├── host_3 HOSTS user session for `domain_backup_user`
   └── `domain_backup_user` HAS_PRIVILEGE on Domain Controller (host_10)
   │
5. EXPLOIT synthesizes constraint exploit chains:
   ├── Path A: CVE-2024-24989 (host_3) -> RCE -> Dump `domain_backup_user` -> DC (host_10)
   └── Validated preconditions: Target Nginx version matches; target port 443 open.
   │
6. VERIFICATION skeptic audits findings:
   ├── CVE-2024-24989: Confirmed via banner matching (Confidence: 0.92)
   └── AD Trust path: Checked session active state (Confidence: 0.81)
   │
7. REPORT compiles systems summary:
   ├── Ranks Path A as highest utility due to minimal stealth cost
   └── Computes overall Attack Pressure Field highlighting host_3 as gravity well
   │
8. MEMORY commits snapshots to database:
   ├── Creates Neo4j versioned snapshot `snapshot_v9_04`
   └── Triggers Redis stream event `stream:graph:mutations` to update engine caches
```

---

## Deployment & Getting Started

### System Requirements
- **OS**: Linux (Ubuntu 22.04+ recommended) or macOS
- **Graph Store**: Neo4j 5.x (local or remote instance)
- **Broker**: Redis 7.x (required for stream processing and async tasks)
- **Database**: PostgreSQL 16+ (with `pgvector` extension)
- **Runtime**: Python 3.11+ and Node.js 20+

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/webspoilt/lattice9.git
cd lattice9

# Instantiate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
cd server-py
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file inside `server-py/` referencing your backend credentials:

```env
# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password

# PostgreSQL Transactional Database
DATABASE_URL=postgresql://postgres:postgres_password@localhost:5432/lattice9

# Redis Queue & Stream Broker
REDIS_URL=redis://localhost:6379/0

# Sovereign Engine Key
LATTICE9_ENGINE_KEY=sovereign-l9-secret-2026

# Fallback LLM API keys (if Proxima is bypassed)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Containerized Deployment (Docker Compose)
To launch all services (Neo4j, Redis, PostgreSQL, FastAPI Engine) in containerized isolation:

```bash
docker compose up -d --build
```

### 4. Running the Engine Locally

```bash
# Run database schema migrations and indexing
python -m graph.schema

# Start the FastAPI REST application
python main.py
```
The REST API documentation is exposed at `http://localhost:8000/docs`.

---

## Execution Philosophy

### 1. Rigorous Science Over Tool Spam
Traditional vulnerability platforms measure success by the count of integrated wrapping tools—"over 500 scanners supported!"—producing massive alerts of un-exploitable noise. 

Lattice9 executes exactly **23 rigorous mathematical modules**. Each module mathematically changes how paths are traversed, how confidence propagates, or how exposure is prioritized. Every equation directly guides lateral movement reasoning.

### 2. Observable Graph-State Grounding
We eliminate AI hallucination by architectural constraints rather than prompt engineering. The **Graph is the Sovereign Source of Truth**. 

When an agent makes an assertion, the statement must be anchored to a specific Neo4j node or relationship. If the telemetry state changes, the drift engine triggers active recomputation. No agent can hypothesize a vulnerability or attack vector that violates the physical target state.

---

## Licensing
Lattice9 is provisioned under the [MIT License](LICENSE).
