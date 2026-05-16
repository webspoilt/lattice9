# Lattice9: Offensive Intelligence OS — Transformation Plan

> **Architectural Directive:** Transform from "AI-flavored pentest dashboard" into "stateful offensive intelligence operating system."

**Core Philosophy:** Reasoning over summaries. Signal over volume. Graph computation over graph visualization. Temporal intelligence over scan snapshots. Deterministic intelligence over AI hype.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    OPERATOR UX                          │
│  Dense layouts · Graph-centric · Keyboard-native        │
│  Evidence-first · Temporal timelines · Compact panels   │
├─────────────────────────────────────────────────────────┤
│                 OFFENSIVE REASONING ENGINE               │
│  Bayesian inference · Confidence propagation            │
│  Exploit chaining · Feasibility scoring                 │
│  Contextual prioritization · Entropy ranking            │
├─────────────────────────────────────────────────────────┤
│                 GRAPH INTELLIGENCE ENGINE                │
│  Weighted traversal · PageRank · Centrality             │
│  Shortest attack path · Blast radius · Trust prop.     │
│  Dijkstra/BFS/DFS · Temporal graph diffing             │
├───────────────────┬──────────────────┬──────────────────┤
│   TEMPORAL INTEL  │ EVIDENCE LINEAGE │  FALSE POSITIVE  │
│   Snapshots ·     │ Immutable chains │  SUPPRESSION     │
│   Drift detection │ Provenance graph │  Bayesian filter │
│   Mutation track  │ Replay metadata  │  Context scoring │
├───────────────────┴──────────────────┴──────────────────┤
│                 DATA OWNERSHIP LAYER                     │
│  Normalized schemas · Typed relationships               │
│  Temporal records · Infrastructure models               │
├─────────────────────────────────────────────────────────┤
│                 COLLECTION ORCHESTRATION                 │
│  Distributed workers · Redis queues · Event streams     │
│  Rate-aware · Replayable · Sandboxed execution          │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Graph Foundation (Current Sprint)

The system cannot reason without a proper graph. The current Neo4j schema uses a single `L9Entity` label for everything — no type hierarchy, no relationship metadata, no graph algorithms.

### Deliverables

| # | Component | Status |
|---|---|---|
| 1.1 | Multi-label Neo4j schema (typed nodes + relationships) | Pending |
| 1.2 | Graph algorithm engine (Dijkstra, BFS/DFS, PageRank, centrality) | Pending |
| 1.3 | Temporal intelligence (snapshots, diffs, drift detection) | Pending |
| 1.4 | Relationship write-back (Neo4j → PostgreSQL) | Pending |
| 1.5 | Bayesian confidence propagation | Pending |
| 1.6 | Evidence lineage system | Pending |
| 1.7 | Exposure diffusion / blast radius modeling | Pending |
| 1.8 | Privilege chain synthesis | Pending |

## Phase 2: Reasoning & Intelligence

| # | Component | Status |
|---|---|---|
| 2.1 | Offensive reasoning engine (deterministic) | Pending |
| 2.2 | False positive suppression (Bayesian filter) | Pending |
| 2.3 | Attack path inference (weighted multi-path) | Pending |
| 2.4 | Exploit dependency mapping | Pending |
| 2.5 | Environmental relevance scoring | Pending |
| 2.6 | LLM integration (interpretation-only, scoped) | Pending |

## Phase 3: Collection & Operations

| # | Component | Status |
|---|---|---|
| 3.1 | Distributed collection with Redis queue orchestration | Pending |
| 3.2 | Event-driven collection triggers | Pending |
| 3.3 | Sandboxed execution environment | Pending |
| 3.4 | Replayable execution pipelines | Pending |
| 3.5 | Operational workflow system | Pending |

## Phase 4: UX & Documentation

| # | Component | Status |
|---|---|---|
| 4.1 | Dense operational UI redesign | Pending |
| 4.2 | Graph-centric navigation | Pending |
| 4.3 | Evidence-first interface | Pending |
| 4.4 | Operator keyboard shortcuts | Pending |
| 4.5 | Research-grade README/documentation | Pending |
| 4.6 | Security hardening audit | Pending |

## Graph Schema Design

### Neo4j Node Labels (Multi-Label)

```
(L9:Asset:Host { ... })
(L9:Asset:Service { ... })
(L9:Asset:Endpoint { ... })
(L9:Identity { ... })
(L9:Credential { ... })
(L9:Vulnerability { ... })
(L9:Finding { ... })
(L9:Evidence { ... })
(L9:TrustZone { ... })
(L9:Objective { ... })
```

All nodes carry the `L9` prefix label for global queries.

### Relationship Types

| Type | Direction | Semantics | Weight Default |
|---|---|---|---|
| `RESOLVES_TO` | Domain → IP | DNS resolution | 0.7 |
| `HOSTS` | Host → Service | Service binding | 0.8 |
| `DEPENDS_ON` | Service → Service | Dependency edge | 0.6 |
| `AUTHENTICATES_TO` | Credential → Service | Auth mechanism | 0.9 |
| `HAS_FINDING` | Entity → Finding | Finding attachment | 1.0 |
| `EXPLOITS` | Vulnerability → Service | Exploitability | variable |
| `TRUSTS` | Entity → Entity | Trust relationship | variable |
| `PRIVILEGE_ESCALATION` | Identity → Identity | Priv esc path | variable |
| `DATA_FLOW` | Service → Service | Data movement | 0.5 |
| `NETWORK_REACH` | Host → Host | Network access | 0.4 |

### Attack Path Scoring

```python
path_score(P) = Π(node.confidence for node in P)
                * Σ(edge.weight for edge in P) / len(P)
                * blast_radius(P[last])
                * (1 - entropy(P))
```
