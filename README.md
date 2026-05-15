# Lattice9 — Offensive Intelligence Operating System (v5.0)

> **Status:** Production-Grade Offensive Intelligence Infrastructure  
> **Identity:** Graph-Native Attack Surface Reasoning

Lattice9 is a stateful, graph-driven intelligence engine designed for complex infrastructure analysis and attack-path synthesis. It moves beyond traditional vulnerability scanning into the realm of **Offensive Systems Observability**.

---

## 🏗️ Architecture

Lattice9 is built on a high-density, stateful backend designed for reliability and evidence provenance.

- **Lattice9 Core**: The centralized orchestration layer managing engagement lifecycles and state transitions.
- **Graph Engine (Neo4j)**: A persistent graph layer that models infrastructure relationships, trust boundaries, and probabilistic attack paths.
- **Intelligence Layer (PostgreSQL)**: Normalized entity storage with temporal tracking and versioned exposure snapshots.
- **Evidence Vault (MinIO/S3)**: Immutable artifact storage ensuring every intelligence claim is backed by reproducible technical proof.

---

## 🧠 Graph Intelligence & Reasoning

Most reconnaissance pipelines treat infrastructure as flat lists. **Lattice9 treats infrastructure as a topology.**

### Attack-Path Synthesis
Lattice9 uses graph-theoretic algorithms (Centrality, Spectral Partitioning) to identify chokepoints and lateral movement opportunities. By projecting attack chains onto a persistent graph, the engine can predict exploit diffusion across trust boundaries.

### Temporal Exposure Tracking
Infrastructure is temporally unstable. Lattice9 captures periodic graph snapshots to monitor **Attack Surface Drift**. It identifies:
- New asset emergence
- Entropy spikes in service behavior
- Trust boundary decay
- Historical vulnerability diffing

---

## 🛠️ Operational Workflows

Lattice9 prioritizes **Decision Compression**. The objective is to reduce massive telemetry sets into actionable intelligence narratives.

### Evidence Lineage
The system maintains a strict chain of custody for all findings. A vulnerability is not an AI-synthesized claim; it is a hypothesis validated against immutable evidence artifacts (SHA-256 integrity).

### Analyst Workbench (Operator Console)
The Lattice9 Operator Console provides a dense, tactical environment for intelligence analysis:
- **Reasoning Traces**: Full logical audit trails for every engine conclusion.
- **Topological Visualizations**: High-fidelity infrastructure maps.
- **Temporal Diffs**: Analysis of attack surface evolution over time.

---

## 🚀 Deployment

Lattice9 is designed for enterprise-grade self-hosting.

### Infrastructure Stack
- **PostgreSQL**: Normalized state storage.
- **Neo4j**: Graph-native reasoning.
- **Redis**: Collection orchestration and task queueing.
- **Python Intelligence Worker**: Async reasoning engine.

### Quick Start
```bash
docker-compose up -d
cd server-py && pip install -r requirements.txt
pnpm install && pnpm run dev
```

---

## 📂 Project Identity
- **Lattice9 Graph Engine**: Probabilistic topology reasoning.
- **Lattice9 Intelligence Layer**: Stateful entity normalization.
- **Lattice9 Operator Console**: Tactical analyst environment.

---

**License:** MIT  
**Author:** Built by security engineers for operators who prioritize signal over noise.
