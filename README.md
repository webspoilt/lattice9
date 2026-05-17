<p align="center">
  <img src="https://raw.githubusercontent.com/webspoilt/lattice9/main/assets/lattice9-banner.png" alt="Lattice9" width="600">
</p>

<h1 align="center">Lattice9</h1>
<p align="center"><strong>Multi-Agent Offensive Intelligence Graph Engine</strong></p>

<p align="center">
  <em>Autonomous graph-driven offensive intelligence platform powered by multi-agent reasoning and computational topology</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-9.0.0--RC1-blue" alt="Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/python-3.11+-orange" alt="Python"></a>
  <a href="#"><img src="https://img.shields.io/badge/neo4j-5.x-cyan" alt="Neo4j"></a>
  <a href="#"><img src="https://img.shields.io/badge/proxima-4.1.0--compatible-purple" alt="Proxima"></a>
  <a href="#"><img src="https://img.shields.io/badge/MCP-ready-ff6b35" alt="MCP"></a>
  <a href="#"><img src="https://img.shields.io/badge/arch-x64%20%7C%20arm64-lightgrey" alt="Arch"></a>
</p>

---

## Mission

Infrastructure is a graph. Vulnerabilities are edges. Compromise is a pathfinding problem.

Lattice9 models enterprise infrastructure as a high-dimensional, bitemporally evolving directed multigraph and runs 23 computational intelligence algorithms against it — field theory, topological data analysis, adversarial game theory, attack economics, wave propagation, causal inference, entropy collapse, attractor dynamics, and counterfactual simulation — coordinated by a multi-agent system routed through Proxima's MCP orchestration layer.

It does not scan. It does not dashboard. It computes.

---

## The Problem

Traditional offensive security workflows are broken in specific, measurable ways:

| Failure Mode | Description |
|---|---|
| **Tool Fragmentation** | Nmap, Burp, BloodHound, Responder — each produces isolated data in incompatible formats |
| **Context Collapse** | Findings are evaluated in isolation, ignoring structural relationships |
| **Stateless Operations** | Each engagement starts from zero — no persistent memory of infrastructure topology |
| **Alert Fatigue** | Severity-based prioritization without economic or topological context |
| **AI Hallucination** | LLM agents without graph grounding produce confident but wrong attack paths |
| **Linear Reporting** | PDF reports instead of queryable, stateful intelligence graphs |

Lattice9 replaces each of these failures with a computational system:

- Tool fragmentation → **Graph-native entity resolution** — every finding is a typed node with provenance
- Context collapse → **Topological context** — findings inherit properties from their graph neighborhood
- Stateless operations → **Temporal graph memory** — snapshots, diffs, drifts, evolution tracking
- Alert fatigue → **Attack economics** — paths ranked by utility, ROI, and stealth, not severity
- AI hallucination → **Graph-grounded agents** — every agent response is constrained by graph state
- Linear reporting → **Queryable intelligence** — the graph IS the report

---

## Architecture

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

## Core Concepts

### Graph-Native Intelligence

Lattice9 models the target environment as a typed, directed multigraph:

```
G_t = (V_t, E_t, W_t, C_t, T_t)
```

| Component | Type | Description |
|---|---|---|
| `V_t` | Entity set | Hosts, services, credentials, identities, findings, domains, endpoints |
| `E_t` | Edge set | Typed relationships: `TRUSTS`, `AUTHENTICATES_TO`, `HOSTS`, `EXPLOITS`, `PRIVILEGE_ESCALATION` |
| `W_t` | Weight matrix | Multi-dimensional: traversal cost, detection risk, privilege permeability, resistance |
| `C_t` | Confidence | Bayesian-propagated confidence scores (loopy belief propagation over evidence) |
| `T_t` | Temporal validity | Bitemporal intervals with exponential decay |

### Attack Path as Computation

An attack path is not a suggestion — it's a computation:

```
P_i = ⟨v₀, e₁, v₁, e₂, ..., eₖ, vₖ⟩
```

Where each edge satisfies exploit preconditions and cumulative utility is maximized under uncertainty constraints. The engine computes multiple path families simultaneously:

- **Shortest path** (lowest hop count)
- **Lowest resistance** (stealth-optimal)
- **Highest utility** (economic optimal)
- **Minimax** (game-theoretic optimal under defense)
- **Geodesic** (manifold-shortest in information space)
- **Gradient descent** (follows field pressure gradient)

### Evidence Lineage

Every finding carries a provable ancestry. Confidence is not assigned — it is computed:

```
P(finding | evidence) = P(evidence | finding) × P(finding) / P(evidence)
```

Evidence chains form directed acyclic graphs. Contradicting evidence reduces confidence. Confirming evidence propagates. Expired evidence decays.

---

## Key Features

### Multi-Agent Orchestration

Seven specialized agents coordinate through Proxima's MCP layer:

| Agent | Model Preference | Responsibility |
|---|---|---|
| **Planner** | Claude (strategic) | Decomposes objectives into dependency-aware task DAGs |
| **Recon** | ChatGPT (fast) | Executes discovery and fingerprinting operations |
| **Correlation** | Claude (analytical) | Infers relationships between findings |
| **Exploit** | Claude (technical) | Synthesizes attack chains from correlated graph |
| **Verification** | Gemini (skeptical) | Cross-references findings for confidence calibration |
| **Report** | Claude (structured) | Produces operational intelligence reports |
| **Memory** | Gemini (stateful) | Maintains temporal graph state and mutation tracking |

Agents can execute in:
- **Sequential** mode — feed-forward pipeline (Plan → Recon → Correlate → Exploit → Verify → Report)
- **Parallel** mode — concurrent analysis with result aggregation
- **Debate** mode — multi-agent dialectic with round-based refinement
- **Round-robin** — cycling agents until convergence on contested findings

### Graph Memory System

The temporal graph engine captures infrastructure state at configurable intervals:

- **Snapshots** — complete graph serialization with versioning
- **Diffs** — edge/node-level mutations between snapshots
- **Drift detection** — statistical significance of topology changes
- **Evolution metrics** — surface entropy, trust drift, credential spread, topology instability
- **Replay** — step-through attack path execution against historical snapshots

### Attack Path Generation

Multiple algorithms operate on the same graph simultaneously:

| Algorithm | Cost Function | Use Case |
|---|---|---|
| Dijkstra (shortest path) | Hop count | Baseline connectivity |
| Resistance-weighted | Σ DetectionRisk / TraversalProb | Stealth-optimal |
| Economic utility | PrivilegeGain × Persistence / (DetectionRisk × Cost) | ROI-optimal |
| Minimax | max_a min_d E[R + γV(s')] | Defense-aware |
| Geodesic | Manifold distance | Information-theoretic shortest |
| Gradient descent | ∇Φ(v) | Natural flow under no resistance |
| Counterfactual | In-memory mutation + recompute | What-if simulation |
| Causal chain | Bayesian network inference | Root cause attribution |

### CVE Intelligence

Findings are enriched against vulnerability intelligence through:
- CVE-to-affected-version matching against discovered technologies
- Exploit availability checking (public PoC, Metasploit modules, exploit-DB)
- CVSS temporal score incorporation into confidence propagation
- Known exploit chain templates for common vulnerability classes

### Computational Intelligence Modules

| Module | Model | Function |
|---|---|---|
| **Field Theory** | Φ(v) = Σ Risk(u) × Trust(u,v) / d(u,v)^α | Identifies attack gravity wells |
| **Resistance Theory** | R(e) = DetectionFriction / TraversalProb | Maps stealth corridors and barriers |
| **Wave Propagation** | ∂C/∂t = D∇²C − λC + S | Simulates compromise spread dynamics |
| **Game Theory** | V*(s) = max_a min_d E[R + γV(s')] | Computes optimal attack/defense strategies |
| **Economics** | Utility = PrivilegeGain × Persistence / (DetectionRisk × Cost) | Ranks paths by operational ROI |
| **Entropy Collapse** | H(G) = -Σ P(path) log P(path) | Measures uncertainty and inevitability |
| **Causal Inference** | P(exposure \| compromise, trust) | Identifies root causes of propagation |
| **Topological DA** | H₀/H₁ persistent homology | Detects hidden trust clusters and voids |
| **Attractor Theory** | A(v) = trust × privilege × centrality | Predicts compromise convergence points |
| **Information Geometry** | Riemannian geodesics on risk manifold | Computes curvature and gradient flow |
| **Graph Neural** | Node2Vec random walk embeddings | Predicts undocumented relationships |

### Provider Abstraction

All model interactions go through a provider-agnostic abstraction layer:

```
Agent → ProviderClient.chat(messages, ModelConfig) → Response
```

Supported provider backends:
- **Proxima** (primary) — OpenAI-compatible local gateway supporting Claude, ChatGPT, Gemini, Perplexity
- **OpenAI API** — direct GPT-4 / GPT-4o access
- **Anthropic API** — direct Claude access
- **Google AI** — direct Gemini access
- **Local** — Ollama, vLLM, or any OpenAI-compatible local endpoint

Swapping providers requires only changing the `ModelConfig`.

### MCP Integration

Lattice9 agents can execute tools through Proxima's MCP server, which provides 45+ tools:

- `security_audit` — static code analysis for vulnerabilities
- `chain_query` — sequential multi-AI pipeline with state passing
- `debate` — multi-provider argumentation
- `verify` — cross-provider answer verification with confidence scoring
- `search` — web, code, academic, and threat intelligence search
- Code generation, review, optimization, and conversion tools

### Async Pipelines

The intelligence pipeline is fully asynchronous:

```
1. Plan     ──┐
2. Recon    ──┤── parallel ──▶ Graph merge ──▶ 3. Correlate ──▶ 4. Exploit
               │                                            │
               └── background (non-blocking) ──────────────┘
```

Each phase can be:
- Executed independently (on-demand single agent)
- Chained in sequence (full pipeline)
- Distributed across workers (Redis-backed task queue)
- Re-triggered by graph mutation events

---

## Agent System

### Agent Interface

```python
class BaseAgent:
    """Protocol-agnostic agent runtime."""

    async def run(self, task: str, context: Optional[Dict] = None) -> AgentMessage:
        """Execute the agent on a given task with optional context."""

    async def stream(self, task: str, context: Optional[Dict] = None):
        """Stream agent response token by token."""

    def reset(self):
        """Reset conversation history (keep system prompt)."""
```

Each agent has:
- A **system prompt** defining its role, reasoning style, and output format
- Access to the **provider client** for model inference
- A **tool registry** for executing MCP-backed actions
- **Conversation memory** (truncated at 50 messages to prevent context overflow)

### Orchestration Strategies

```python
class OrchestrationStrategy(str, Enum):
    SEQUENTIAL = "sequential"      # Feed-forward execution
    PARALLEL = "parallel"          # Concurrent execution
    DEBATE = "debate"              # Multi-agent dialectic
    PIPELINE = "pipeline"          # Transform chain
    ROUND_ROBIN = "round_robin"    # Iterative convergence
```

### Full Pipeline Execution

```python
pipeline = EngagementPipeline(agents)
results = await pipeline.run(
    objective="Assess external attack surface of acme.corp",
)
# Returns: {plan, recon, correlation, exploit, verification, report, memory}
```

---

## Proxima Integration

Proxima serves as the model routing and MCP tool execution layer for Lattice9 agents. It is a **pluggable backend**, not a hard dependency.

### Why Proxima

- **Multi-provider routing** — single endpoint for Claude, ChatGPT, Gemini, and Perplexity
- **No API keys required** — uses existing browser sessions
- **MCP-native** — 45+ tools available out of the box
- **OpenAI-compatible API** — drop-in replacement for any OpenAI SDK
- **Local execution** — runs on `127.0.0.1`, no data leaves the machine

### Integration Architecture

```
Lattice9 Agent System
    │
    ▼
ProviderClient (abstraction)
    │
    ├── ProximaClient (primary) → http://127.0.0.1:3210/v1/chat/completions
    ├── OpenAIClient (fallback) → api.openai.com
    ├── AnthropicClient         → api.anthropic.com
    └── LocalClient             → localhost:11434 (Ollama)
```

### Not a Hard Dependency

If Proxima is not running, Lattice9 falls back to:
1. Direct API calls to configured providers (OpenAI, Anthropic, Google)
2. Local models via Ollama or vLLM
3. Fully offline mode using deterministic graph algorithms only (no LLM agents)

The provider abstraction ensures that swapping orchestration backends requires changing only the connection URL and authentication method.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **API Server** | FastAPI (Python 3.11+) |
| **Graph Database** | Neo4j 5.x |
| **Cache / Queue** | Redis + async workers |
| **Vector Storage** | pgvector (PostgreSQL) |
| **Orchestration** | Proxima MCP Server |
| **AI Providers** | Claude · ChatGPT · Gemini · Perplexity · Local (Ollama) |
| **Agent Runtime** | Custom async agent framework |
| **Tool Protocol** | MCP (Model Context Protocol) |
| **CLI** | Typer + rich |
| **Container** | Docker + Docker Compose |
| **Documentation** | Mermaid diagrams · OpenAPI 3.x |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Neo4j 5.x (local or remote)
- Redis 7.x (optional, for async pipelines)
- Proxima 4.x (optional, for multi-agent orchestration)
- Docker (optional, for containerized deployment)

### Local Installation

```bash
# Clone the repository
git clone https://github.com/webspoilt/lattice9.git
cd lattice9

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
cd server-py
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Neo4j credentials and provider settings
```

### Docker Deployment

```bash
docker compose up -d
```

### Proxima Setup (Optional)

```bash
# Install and start Proxima
git clone https://github.com/Zen4-bit/Proxima.git
cd Proxima
npm install
npm start

# Proxima runs at http://127.0.0.1:3210
# Log into your AI providers in the Proxima UI (one-time setup)
# Enable REST API in Settings
```

### Environment Configuration

```env
# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/lattice9

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Proxima (optional — fallback to direct API)
PROXIMA_URL=http://127.0.0.1:3210
LATTICE9_ENGINE_KEY=your_engine_key

# Direct API fallbacks (if Proxima is unavailable)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Quick Start

```bash
# Start the intelligence engine
python main.py

# The API is available at http://localhost:8000
# API docs at http://localhost:8000/docs

# Run a single agent
curl -X POST "http://localhost:8000/proxima/agents/run?agent_name=planner&task=Assess%20external%20attack%20surface"

# Run the full pipeline
curl -X POST "http://localhost:8000/proxima/pipeline/run?objective=Assess%20external%20attack%20surface%20of%20target.org"

# Check Proxima connectivity
curl "http://localhost:8000/proxima/health"

# Compute field density
curl "http://localhost:8000/field/{engagement_id}/density"

# Run counterfactual simulation
curl -X POST "http://localhost:8000/counterfactual/{engagement_id}/comprehensive"

# Get attack path economics
curl "http://localhost:8000/economics/{engagement_id}/paths"
```

---

## Example Workflow

### Full Pipeline Execution

```
1.  OBJECTIVE: Assess external attack surface of acme.corp
    │
2.  ↓ PLANNER decomposes into tasks:
    ├── Task 1: Subdomain enumeration
    ├── Task 2: Technology fingerprinting
    ├── Task 3: Certificate transparency review
    ├── Task 4: DNS zone analysis
    └── Task 5: CVE correlation
    │
3.  ↓ RECON executes discovery:
    ├── Found 47 subdomains (DNS + CertShim)
    ├── Fingerprinted 23 services (Nginx 1.24, Apache 2.4.57, etc.)
    ├── Detected 3 WAF instances (Cloudflare, AWS Shield, ModSecurity)
    └── Identified 2 exposed admin panels
    │
4.  ↓ CORRELATION infers relationships:
    ├── sub.acme.corp → 203.0.113.5 → Nginx 1.24
    ├── CVE-2024-24989 → Nginx 1.24 → exploitable
    ├── admin.acme.corp → basic-auth → credential brute-force surface
    └── vpn.acme.corp → OpenVPN → trust relationship to internal
    │
5.  ↓ EXPLOIT generates attack chains:
    ├── Path A: CVE-2024-24989 → RCE → internal pivot → AD enumeration → domain admin
    ├── Path B: admin panel brute-force → credential reuse → VPN access → internal
    ├── Path C: subdomain takeover → XSS → session hijacking → API access → data exfil
    └── Each path scored by: feasibility, detection risk, operational cost, privilege gain
    │
6.  ↓ VERIFICATION cross-references:
    ├── CVE-2024-24989: 3 evidence sources → confidence 0.87
    ├── Admin panel exposure: 2 sources → confidence 0.73
    ├── VPN trust relationship: inferred (no direct evidence) → confidence 0.42
    └── Flagged low-confidence items for re-investigation
    │
7.  ↓ REPORT synthesizes:
    ├── 3 critical attack paths with step-by-step instructions
    ├── 6 CVEs confirmed exploitable in current configuration
    ├── Credential cascade risk: 4 services reachable from 1 compromised credential
    ├── Field pressure: admin panel identified as gravity well (Φ = 0.83)
    └── Economic ranking: Path C (stealth-optimal) vs Path A (speed-optimal)
    │
8.  ↓ MEMORY persists graph state:
    ├── 47 new host nodes with confidence scores
    ├── 89 new relationship edges with temporal validity
    ├── 23 finding nodes with evidence provenance chains
    └── Snapshot created for future drift detection
    │
9.  GRAPH IS NOW QUERYABLE
    ├── "Show all paths with privilege escalation"
    ├── "What changes if we patch CVE-2024-24989?"
    ├── "Which credential has the widest blast radius?"
    └── "Plot exposure evolution over the last 7 days"
```

---

## Graph Schema

### Node Types

| Type | Description | Key Properties |
|---|---|---|
| `host` | Network host (IP, domain) | canonical_key, confidence, first_seen, last_seen |
| `service` | Network service | port, protocol, version, banner |
| `credential` | Authentication secret | credential_type, validity_period |
| `identity` | User or service account | authority, privilege_level |
| `finding` | Security observation | severity, cwe, cvss, validation_state |
| `evidence` | Raw intelligence artifact | source_type, sha256, artifact_uri |
| `vulnerability` | CVE or weakness | cve_id, cvss_score, exploit_available |
| `trust_zone` | Network segment | zone_type, isolation_level |

### Relationship Types

| Type | Description | Weight |
|---|---|---|
| `RESOLVES_TO` | DNS resolution | 0.4 |
| `HOSTS` | Service hosting | 0.6 |
| `AUTHENTICATES_TO` | Credential → service | 0.7 |
| `TRUSTS` | Trust relationship | 0.8 |
| `PRIVILEGE_ESCALATION` | Priv esc path | 0.9 |
| `EXPLOITS` | Exploit applicability | 0.8 |
| `HAS_FINDING` | Entity → finding | 0.5 |
| `NETWORK_REACH` | Network connectivity | 0.4 |
| `DEPENDS_ON` | Service dependency | 0.6 |
| `DATA_FLOW` | Data transfer path | 0.5 |
| `ATTACK_PATH` | Computed attack path | 0.85 |

---

## Project Structure

```
lattice9/
├── server-py/                      # Python intelligence engine
│   ├── main.py                     # FastAPI application + all endpoints
│   ├── config.py                   # Environment configuration
│   ├── db.py                       # PostgreSQL connection
│   ├── models.py                   # Pydantic models
│   │
│   ├── graph/                      # Graph intelligence core
│   │   ├── schema.py               # Neo4j schema + constraints
│   │   ├── engine.py               # CRUD operations
│   │   ├── algorithms.py           # Graph algorithms (Dijkstra, PageRank, etc.)
│   │   ├── temporal.py             # Snapshot + drift detection
│   │   ├── confidence.py           # Bayesian confidence propagation
│   │   ├── evolution.py            # Temporal evolution metrics
│   │   ├── field_theory.py         # Attack pressure field computation
│   │   ├── resistance.py           # Topological resistance mapping
│   │   ├── wave_propagation.py     # Compromise diffusion simulation
│   │   ├── topological_da.py       # Persistent homology + voids
│   │   ├── gnn_reasoning.py        # Node2Vec embeddings
│   │   ├── attractor_theory.py     # Compromise attractors + inevitability
│   │   ├── information_geometry.py # Geodesics + manifold curvature
│   │   └── blast.py                # Blast radius v2
│   │
│   ├── reasoning/                  # Reasoning engines
│   │   ├── attack_paths.py         # Attack path generation
│   │   ├── exploit_chains.py       # Exploit chain synthesis
│   │   ├── prioritization.py       # Contextual prioritization
│   │   ├── counterfactual.py       # What-if simulation
│   │   ├── entropy.py              # Entropy collapse
│   │   ├── causal.py               # Causal inference
│   │   ├── adversarial_game.py     # Game theory
│   │   └── attack_economics.py     # Attack economics
│   │
│   ├── evidence/                   # Evidence management
│   │   └── lineage.py              # Evidence provenance + ancestry
│   │
│   └── proxima/                    # Proxima integration layer
│       ├── __init__.py             # Provider abstraction + agent runtime
│       ├── agents.py               # Specialized agent definitions
│       └── api.py                  # Orchestration REST API
│
├── server/                         # TypeScript backend
│   ├── routers/
│   │   ├── vulnerability.ts        # Exposure + graph tRPC procedures
│   │   └── intelligence.ts         # Computational intelligence tRPC procedures
│   └── routers.ts                  # Router aggregation
│
├── client/                         # React frontend
│   └── src/components/
│       ├── IntelligencePanel.tsx   # Multi-tab operational UI
│       └── CorrelationGraph3D.tsx  # 3D graph visualization
│
└── docs/                           # Documentation
    ├── architecture.md
    ├── graph-engine.md
    └── agent-system.md
```

---

## API Overview

### Intelligence Endpoints

```
POST   /analyze/{id}                    Run full intelligence pipeline
POST   /events/{id}                     Event-driven re-analysis
GET    /snapshots/{id}                  List temporal snapshots
GET    /snapshots/{id}/drift            Compute graph drift
GET    /algorithms/{id}                 Run graph algorithm
GET    /algorithms/{id}/paths           Get attack paths
GET    /algorithms/{id}/exploit-chains  Get exploit chains

GET    /field/{id}/density              Field pressure density
GET    /field/{id}/gradients/{node}     Field gradient at node
GET    /field/{id}/privilege-diffusion  Privilege energy density
GET    /resistance/{id}/map             Edge resistance map
GET    /resistance/{id}/paths           Resistance-weighted paths
GET    /resistance/{id}/segmentation    Segmentation conductivity
POST   /wave/{id}/simulate              Wave propagation simulation
GET    /wave/{id}/velocity              Propagation velocity
GET    /wave/{id}/amplification         Wave amplification zones
GET    /game/{id}/minimax               Minimax-optimal path
GET    /game/{id}/nash                  Nash equilibrium
GET    /game/{id}/adaptive              Adaptive path recomputation
GET    /economics/{id}/paths            Path utility ranking
GET    /economics/{id}/stealth          Stealth-optimal paths
GET    /economics/{id}/campaign         Campaign economics
GET    /topology/{id}/homology          Persistent homology
GET    /topology/{id}/simplices         Simplicial complexes
GET    /topology/{id}/voids             Topological voids
GET    /gnn/{id}/embeddings             Node embeddings
GET    /gnn/{id}/predict-relationships  Undocumented relationship predictions
GET    /attractor/{id}                  Compromise attractors
GET    /attractor/{id}/instability      Topological instability
GET    /attractor/{id}/inevitability    Compromise inevitability
GET    /geometry/{id}/geodesic          Geodesic path
GET    /geometry/{id}/curvature         Manifold curvature
GET    /geometry/{id}/gradient-descent  Gradient descent path

GET    /evolution/{id}                  Temporal evolution metrics
POST   /counterfactual/{id}/...         What-if simulations
GET    /entropy/{id}                    Entropy collapse
POST   /causal/{id}/...                 Causal inference
GET    /blast/{id}/{node}               Blast radius v2
GET    /evidence/{id}/lineage           Evidence provenance
```

### Proxima/Agent Endpoints

```
GET    /proxima/health                  Check Proxima connectivity
GET    /proxima/models                  List available models
GET    /proxima/agents                  List registered agents
POST   /proxima/agents/run              Execute single agent
POST   /proxima/pipeline/run            Execute full pipeline
POST   /proxima/debate                  Multi-agent debate
GET    /intelligence/{id}/all           Unified intelligence query
```

---

## Roadmap

### Q3 2026

- [ ] **Distributed Agent Clusters** — deploy agents across multiple workers with Redis-backed task queue
- [ ] **Autonomous Recon Scheduling** — cron-driven re-discovery with drift-triggered re-analysis
- [ ] **Graph Analytics Dashboard** — native Neo4j Bloom-style visualization of attack paths
- [ ] **Exploit Simulation Sandbox** — isolated environment for safe exploit validation

### Q4 2026

- [ ] **Reinforcement Learning Loops** — agents learn optimal attack strategies from simulation outcomes
- [ ] **Stealth Execution Profiles** — configurable opsec profiles that constrain agent behavior
- [ ] **SOC Intelligence Mode** — defender perspective with detection coverage mapping
- [ ] **Real-time Collaboration** — multi-user engagement coordination with conflict resolution

### 2027

- [ ] **Federated Graph Intelligence** — cross-organization threat graph sharing with privacy preservation
- [ ] **Automated Report Generation** — structured PDF/HTML reports from graph state
- [ ] **Continuous Authorization** — credential lifecycle management with automatic rotation detection
- [ ] **Adversarial ML** — GAN-based attack path generation against learned defender models

---

## Philosophy

### Reasoning Over Tool Spam

Most offensive platforms measure value in tool count — "200+ tools integrated!" — as if running more scanners produces better intelligence. It doesn't. Tool spam generates noise. Noise wastes analyst hours.

Lattice9 runs exactly **23 computational intelligence algorithms** — each one changes how paths are ranked, how confidence is computed, or how the graph is traversed. Every equation has an operational consequence. There is no decorative mathematics.

### Intelligence Over Automation Hype

Full autonomy in offensive security is a vendor fantasy. Infrastructure is too heterogeneous, networks too dynamic, adversaries too adaptive. Lattice9 does not claim AGI. It does not replace human judgment.

What it does: **compress infrastructure topology into actionable intelligence** by applying graph-native computation where traditional tools apply severity tags. It surfaces the paths an analyst should examine, quantifies the uncertainty at each step, and provides provable evidence ancestry for every finding.

### Graph-State Awareness

The single most important architectural decision: **the graph is the source of truth**.

When an agent makes a claim, it must be grounded in a graph node. When a path is computed, every edge carries a confidence score and temporal validity. When the infrastructure changes, the drift detector alerts every agent that depends on the mutated state.

This eliminates the hallucination problem not by prompt engineering — but by architecture. Agents cannot invent findings that don't exist in the graph. They compute over what is there.

### Observable AI Systems

Every agent invocation produces:
- The exact prompt sent
- The model configuration used
- The response received
- The context consumed
- The tools called
- The latency

There is no hidden reasoning. No black-box scoring. Every intelligence output is reproducible by re-running the same query against the same graph snapshot.

### Deterministic at Decision Boundaries

Probabilistic inference for uncertainty quantification. Deterministic computation for actionable outputs. The two are not in conflict:

- Path ranking is probabilistic (confidence-weighted)
- Path validation is deterministic (precondition check)
- Evidence propagation is probabilistic (Bayesian)
- Graph mutation is deterministic (exactly-specified CRUD)
- Agent responses are probabilistic (model inference)
- Tool execution is deterministic (verifiable outcome)

This separation ensures that uncertainty is bounded and decisions are auditable.

---

## Comparison

| Dimension | Traditional Tools | Lattice9 |
|---|---|---|
| **Data model** | Flat list of findings | Typed directed multigraph |
| **Prioritization** | CVSS severity | Economic utility × topological context |
| **State** | Per-engagement, stateless | Persistent temporal graph memory |
| **Evidence** | Manual screenshots | Automated provenance chains |
| **Confidence** | Static CVSS | Bayesian propagated |
| **Paths** | Manual chaining | 8 simultaneous algorithms |
| **Reasoning** | Analyst intuition | Multi-agent debate + graph grounding |
| **Reporting** | PDF | Queryable graph |
| **Scalability** | Per-scanner limits | Incremental graph updates |
| **Extensibility** | Plugin architecture | 23+ computational modules |

---

## License

MIT

---

<p align="center">
  <strong>Lattice9</strong> — Infrastructure is a graph. Compromise is a pathfinding problem.
</p>
