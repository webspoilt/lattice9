# Lattice9 Agent System

## Multi-Agent Orchestrator Architecture

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Main Orchestrator                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │             Controller Agent                      │   │
│  │  - Task decomposition & agent dispatch            │   │
│  │  - Result synthesis & conflict resolution         │   │
│  │  - Priority queue management                      │   │
│  └──────────────────────────────────────────────────┘   │
│                            │                             │
│    ┌───────────────────────┼───────────────────────┐     │
│    ▼                       ▼                       ▼     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │Recon    │  │Vuln     │  │Exploit  │  │Persistence│  │
│  │Agent    │  │Analysis │  │Agent    │  │Agent     │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │Lateral  │  │Exfil    │  │Evasion  │  │Reporting│   │
│  │Movement │  │Agent    │  │Agent    │  │Agent    │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 2. Agent Specifications

### Controller Agent
- **Role:** Orchestrator — breaks user tasks into subtasks, dispatches to specialized agents, synthesizes results.
- **Tools:** agent_create, agent_message, task_status
- **Safety:** monitors for destructive operations, requires confirmation
- **Trigger:** Every interaction

### Reconnaissance Agent
- **Role:** Passive and active reconnaissance
- **System Prompt Emphasis:** Stealth-first approach, detect before touching, never port-scan without authorization, use OSINT before active scanning

### Vulnerability Analysis Agent
- **Role:** Categorize and correlate findings
- **System Prompt Emphasis:** Map CVEs to attack surface, contextualize severity within graph state

### Exploit Agent
- **Role:** Path generation, payload matching
- **System Prompt Emphasis:** Legal boundaries, proof-of-concept only, never execute without explicit authorization

### Persistence Agent
- **Role:** Backdoor analysis, persistence mechanism detection
- **System Prompt Emphasis:** Forensic mindset, detect rather than deploy

### Lateral Movement Agent
- **Role:** Privilege escalation pathing, trust relationship analysis
- **System Prompt Emphasis:** Map every path, quantify difficulty, never suggest actual movement

### Exfiltration Agent
- **Role:** Data flow analysis, sensitivity mapping
- **System Prompt Emphasis:** Identify data at risk, never exfiltrate actual data

### Evasion Agent
- **Role:** Detection surface analysis
- **System Prompt Emphasis:** Predict detection probability, suggest stealth adjustments

### Reporting Agent
- **Role:** Synthesize findings, generate reports
- **System Prompt Emphasis:** Evidence provenance, confidence calibration, actionable recommendations

## 3. Provider Abstraction

```
AgentProvider (abstract)
├── OpenAIProvider
│   ├── model: gpt-4o / o1 / o3-mini
│   └── api_key: str
├── AnthropicProvider
│   ├── model: claude-sonnet-4-20250514
│   └── api_key: str
└── OllamaProvider
    ├── model: codellama / llama3 / mistral
    ├── base_url: str
    └── (optional) api_key: str
```

Default provider is loaded from configuration or falls back to a local model. Providers implement `generate(messages, system_prompt, max_tokens, temperature)` for unified invocation.

## 4. Task Execution Flow

1. **User submits request** → Controller agent
2. **Controller decomposes** → subtask objects with dependencies
3. **Subtask queue populated** → parallel execution where possible
4. **Agent produces** → structured result with confidence, evidence, recommendations
5. **Controller synthesizes** → coherent response from all agent outputs
6. **Conflict resolution** → majority vote or confidence-weighted arbitration
7. **Result returned** → with traceability back to contributing agents

## 5. Confidence Calibration

Each agent's output confidence is calibrated against historical accuracy:

```python
calibrated = raw_confidence * (1 - overconfidence_penalty(agent_id))
overconfidence_penalty = max(0, agent_avg_confidence - agent_accuracy)
```

Agents with systematic overconfidence are penalized automatically. The calibration database stores per-agent performance across task types.
