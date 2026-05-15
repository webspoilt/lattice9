# HAWK — Sovereign Offensive Intelligence OS (v5.0)

> **Status:** Production-Ready Intelligence Infrastructure
> Built to solve cognitive exhaustion and evidence decay in offensive security.

---

# HAWK

Modern reconnaissance is fundamentally broken. Fragmentation, noise, and ephemeral states lead to "observational debris"—millions of lines of unvalidated garbage that operators are expected to manually compress.

**HAWK v5.0** is the evolution of offensive security from *tool execution* toward *stateful infrastructure reasoning*.

It is no longer just a scanner; it is a **Sovereign Offensive Intelligence Operating System** that treats reconnaissance as a persistent graph problem.

Instead of asking "What vulnerabilities exist?", HAWK asks:
- "What relationships matter?"
- "What evidence converges?"
- "What infrastructure behaves anomalously?"
- "How has the attack surface mutated since the last run?"

---

# Core Philosophy: Decision Compression

The purpose of HAWK is not to generate more data. It is to compress massive observation sets into:
- **High-Confidence Exploit Narratives**
- **Infrastructure Relationships**
- **Trust-Boundary Models**
- **Probabilistic Attack Paths**
- **Operator-Relevant Intelligence**

---

# 🏗️ Architectural Model (Sovereign OS)

```ascii
                    [ ENGAGEMENT ]
                          |
           +--------------+--------------+
           |              |              |
    [ SCOPE ENGINE ] [ AUTH GATE ] [ STATE MACHINE ]
           |              |              |
           +--------------+--------------+
                          |
                  [ COLLECTION RUNS ]
                          |
           +--------------+--------------+
           |                             |
    [ RECON LAYER ]               [ TOOL EXECUTORS ]
           |                             |
           +--------------+--------------+
                          |
                 [ EVIDENCE PROVENANCE ]
               (SHA-256 Immutable Artifacts)
                          |
           +--------------+--------------+
           |                             |
   [ POSTGRES: STATE ]          [ NEO4J: GRAPH ]
   (Normalized Entities)        (Temporal Reasoning)
           |                             |
           +--------------+--------------+
                          |
               [ ANALYST WORKBENCH ]
             (Reasoning Traces & Diffs)
```

---

# 🧠 Intelligence Engine

### 1. Graph-Native Reasoning (Neo4j)
Infrastructure is not a list; it is a relationship. Assets exist inside trust systems, shared auth domains, and deployment pipelines. HAWK uses **Neo4j** to compute:
- **Graph Centrality**: Identifying chokepoint assets.
- **Spectral Partitions**: Mapping infrastructure segmentation.
- **Attack-Path Diffusion**: Probabilistically calculating how a single compromise spreads.

### 2. Bayesian Evidence Fusion
A finding is a hypothesis. HAWK uses Bayesian propagation to determine the probability of an exploit:
```math
P(H|E)=\frac{P(E|H)\cdot P(H)}{P(E)}
```
Confidence decays or converges based on cross-tool evidence, headers, and behavioral fingerprints.

### 3. Temporal Drift Tracking
Infrastructure mutates. HAWK stores historical graph snapshots to identify:
- **Attack Surface Mutation**: What new assets appeared?
- **Entropy Spikes**: Which systems are behaving unstable compared to baseline?
- **Evidence Decay**: When does a previously validated finding become stale?

---

# 🖥️ The Analyst Workbench

The HAWK Dashboard has been replaced by a high-density **Analyst Workbench** designed for adversarial systems observability.

- **Reasoning Traces**: Every major inference answers *why* the engine believes a claim, mapping back to raw evidence.
- **Immutable Evidence Browser**: Audit the SHA-256 hashed proof behind every vulnerability.
- **Decision Compression Canvas**: Visual priority queue of attack paths ranked by graph centrality and feasibility.

---

# 🚀 Infrastructure Requirements

HAWK v5.0 is stateful. It requires:
- **PostgreSQL**: Unified source of truth for normalized entities and findings.
- **Neo4j**: Graph database for relational reasoning.
- **Redis**: High-throughput task queueing and collection orchestration.
- **MinIO/S3**: Immutable artifact storage for evidence provenance.

---

# 🛠️ Running the OS

### 1. Backend Infrastructure
```bash
docker-compose up -d
```

### 2. Intelligence Engine
```bash
cd server-py
pip install -r requirements.txt
python main.py
```

### 3. Workbench Interface
```bash
pnpm install
pnpm run dev
```

---

# 📂 Project Roadmap
- [x] v5.0: Stateful Graph-Native Architecture
- [x] Analyst Workbench & Evidence Provenance
- [ ] Autonomous Exploit Validation
- [ ] Episodic Infrastructure Memory
- [ ] Latent-Space Infrastructure Embeddings

---

**License:** MIT  
**Status:** Sovereign Offensive Intelligence OS  
**Author:** Built for operators who care about ground truth over observational debris.
