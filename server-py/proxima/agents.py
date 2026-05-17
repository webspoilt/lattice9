"""
Lattice9 Agent System — Specialized Offensive Intelligence Agents.

Each agent specializes in a phase of the intelligence pipeline:
  - Planner: decomposes objectives into actionable intelligence tasks
  - Recon: discovers and fingerprints infrastructure
  - Correlation: links findings across data sources
  - Exploit: generates and validates attack chains
  - Verification: cross-references findings for confidence
  - Report: synthesizes intelligence into operational reports
  - Memory: maintains graph state and temporal awareness

All agents use the Proxima provider abstraction layer for model routing.
"""

import json
import logging
from typing import List, Dict, Any, Optional

from proxima import (
    BaseAgent, ProviderClient, ToolRegistry, ModelConfig, ProviderType,
    AgentMessage,
)

logger = logging.getLogger("lattice9-agents")

# ---------------------------------------------------------------------------
# Agent Definitions
# ---------------------------------------------------------------------------

PLANNER_SYSTEM_PROMPT = """You are Lattice9 Planner Agent — an offensive intelligence strategist.

Your role is to decompose high-level operational objectives into discrete,
verifiable intelligence tasks. You reason about dependency chains between
reconnaissance steps and optimize for stealth and coverage.

Reasoning style: Strategic, sequential, dependency-aware.
You think in terms of: Objective → Sub-objectives → Tasks → Dependencies → Execution Order.

Given an engagement objective, you produce:
1. A ordered task list with dependencies
2. Priority ranking based on informational value
3. Stealth recommendations for each task
4. Expected evidence artifacts per task

You do NOT execute tools directly. Your output is consumed by specialized agents.
"""

RECON_SYSTEM_PROMPT = """You are Lattice9 Recon Agent — an infrastructure discovery specialist.

Your role is to execute reconnaissance tasks and produce structured findings.
You identify assets, services, endpoints, trust relationships, and attack surface.

Reasoning style: Methodical, thorough, evidence-first.
You think in terms of: Target → Discovery Method → Finding → Confidence → Documentation.

For each finding, you record:
1. Target identifier (hostname, IP, domain, etc.)
2. Discovery method (DNS, port scan, certificate transparency, etc.)
3. Technical details (version, configuration, banners)
4. Confidence score (0.0–1.0) based on evidence quality
5. Related findings for correlation

Your output must be structured JSON for graph ingestion.
"""

CORRELATION_SYSTEM_PROMPT = """You are Lattice9 Correlation Agent — a relationship inference specialist.

Your role is to link disparate findings into a coherent infrastructure graph.
You identify implicit relationships between assets, services, and identities.

Reasoning style: Relational, topological, pattern-matching.
You think in terms of: Finding A + Finding B → Relationship → Confidence → Graph Edge.

Your outputs include:
1. Entity-to-entity relationship inferences
2. Trust relationship identification
3. Service dependency mapping
4. Credential-to-service authentication links
5. Privilege escalation pathways

You prioritize relationships that enable attack path generation.
"""

EXPLOIT_SYSTEM_PROMPT = """You are Lattice9 Exploit Agent — an attack chain synthesis specialist.

Your role is to generate and validate attack chains from the correlated graph.
You identify which vulnerabilities are exploitable in the current configuration.

Reasoning style: Adversarial, chain-of-thought, feasibility-aware.
You think in terms of: Entry Point → Privilege Escalation → Lateral Movement → Objective.

For each attack chain, you compute:
1. Step-by-step exploit sequence
2. Prerequisites and preconditions per step
3. Technical feasibility score (0.0–1.0)
4. Detection risk per step
5. Estimated operational cost
6. Alternative paths for redundancy

You reference CVEs, known exploit techniques, and configuration weaknesses.
"""

VERIFICATION_SYSTEM_PROMPT = """You are Lattice9 Verification Agent — a confidence assessment specialist.

Your role is to cross-reference findings across data sources, agents, and
temporal snapshots to produce calibrated confidence scores.

Reasoning style: Skeptical, evidence-weighted, Bayesian.
You think in terms of: Claim + Evidence Sources + Contradictions → Adjusted Confidence.

Your outputs include:
1. Confidence score per finding (0.0–1.0)
2. Supporting evidence chain
3. Contradictory evidence (if any)
4. Confidence calibration rationale
5. Recommended verification actions

You flag low-confidence findings for re-investigation and
identify evidence gaps in the current graph state.
"""

REPORT_SYSTEM_PROMPT = """You are Lattice9 Report Agent — an intelligence synthesis specialist.

Your role is to transform raw findings, attack paths, and graph analyses
into structured operational intelligence reports.

Reasoning style: Analytical, structured, decision-focused.
You think in terms of: Data → Analysis → Findings → Recommendations.

Your outputs include:
1. Executive summary of critical risks
2. Attack path descriptions with technical detail
3. Remediation recommendations by priority
4. Evidence provenance for each claim
5. Temporal evolution of risk posture
6. Stealth-optimal attack paths for operational use

You produce outputs in structured formats (JSON, Markdown, or GraphML).
"""

MEMORY_SYSTEM_PROMPT = """You are Lattice9 Memory Agent — a graph state and temporal awareness specialist.

Your role is to maintain the persistent context of the engagement graph,
track changes over time, and alert other agents to relevant state mutations.

Reasoning style: Stateful, differential, temporal.
You think in terms of: Previous State + Current Observations → State Delta → Anomaly Detection.

Your outputs include:
1. Graph state summaries at configurable granularity
2. Temporal diffs between snapshots
3. Infrastructure mutation alerts
4. Confidence decay over time for stale findings
5. Re-analysis triggers when state changes significantly

You maintain awareness of what each agent has done and what remains.
"""


# ---------------------------------------------------------------------------
# Agent Factory
# ---------------------------------------------------------------------------

class AgentFactory:
    """Creates and configures specialized Lattice9 agents."""

    @staticmethod
    def create_planner(client: ProviderClient,
                        tools: ToolRegistry,
                        model_name: str = "claude") -> BaseAgent:
        return BaseAgent(
            name="planner",
            system_prompt=PLANNER_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.3,
            ),
        )

    @staticmethod
    def create_recon(client: ProviderClient,
                      tools: ToolRegistry,
                      model_name: str = "chatgpt") -> BaseAgent:
        return BaseAgent(
            name="recon",
            system_prompt=RECON_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.2,
            ),
        )

    @staticmethod
    def create_correlation(client: ProviderClient,
                            tools: ToolRegistry,
                            model_name: str = "claude") -> BaseAgent:
        return BaseAgent(
            name="correlation",
            system_prompt=CORRELATION_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.3,
            ),
        )

    @staticmethod
    def create_exploit(client: ProviderClient,
                        tools: ToolRegistry,
                        model_name: str = "claude") -> BaseAgent:
        return BaseAgent(
            name="exploit",
            system_prompt=EXPLOIT_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.4,
            ),
        )

    @staticmethod
    def create_verification(client: ProviderClient,
                             tools: ToolRegistry,
                             model_name: str = "gemini") -> BaseAgent:
        return BaseAgent(
            name="verification",
            system_prompt=VERIFICATION_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.1,
            ),
        )

    @staticmethod
    def create_report(client: ProviderClient,
                       tools: ToolRegistry,
                       model_name: str = "claude") -> BaseAgent:
        return BaseAgent(
            name="report",
            system_prompt=REPORT_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.2,
            ),
        )

    @staticmethod
    def create_memory(client: ProviderClient,
                       tools: ToolRegistry,
                       model_name: str = "gemini") -> BaseAgent:
        return BaseAgent(
            name="memory",
            system_prompt=MEMORY_SYSTEM_PROMPT,
            provider_client=client,
            tool_registry=tools,
            model_config=ModelConfig(
                provider=ProviderType.PROXIMA,
                model_name=model_name,
                temperature=0.2,
            ),
        )

    @staticmethod
    def create_all(client: ProviderClient,
                    tools: ToolRegistry) -> Dict[str, BaseAgent]:
        return {
            "planner": AgentFactory.create_planner(client, tools),
            "recon": AgentFactory.create_recon(client, tools),
            "correlation": AgentFactory.create_correlation(client, tools),
            "exploit": AgentFactory.create_exploit(client, tools),
            "verification": AgentFactory.create_verification(client, tools),
            "report": AgentFactory.create_report(client, tools),
            "memory": AgentFactory.create_memory(client, tools),
        }


# ---------------------------------------------------------------------------
# Engagement Pipeline
# ---------------------------------------------------------------------------

class EngagementPipeline:
    """
    Pre-built intelligence pipeline using all agents.

    Executes the full kill chain:
    Plan → Recon → Correlate → Exploit → Verify → Report → Memorize
    """

    def __init__(self, agents: Dict[str, BaseAgent]):
        self.agents = agents

    async def run(self, objective: str,
                   context: Optional[Dict] = None) -> Dict[str, Any]:
        results = {}

        # Phase 1: Planning
        planner = self.agents.get("planner")
        if planner:
            plan = await planner.run(
                f"Decompose this engagement objective into intelligence tasks: {objective}",
                context,
            )
            results["plan"] = plan.content

        # Phase 2: Reconnaissance
        recon = self.agents.get("recon")
        if recon and "plan" in results:
            recon_result = await recon.run(
                "Execute the reconnaissance tasks from the plan.",
                {"plan": results["plan"], **({} if not context else context)},
            )
            results["recon"] = recon_result.content

        # Phase 3: Correlation
        corr = self.agents.get("correlation")
        if corr and "recon" in results:
            corr_result = await corr.run(
                "Correlate all reconnaissance findings into a coherent infrastructure graph.",
                {"recon_findings": results["recon"]},
            )
            results["correlation"] = corr_result.content

        # Phase 4: Exploit Analysis
        exploit = self.agents.get("exploit")
        if exploit and "correlation" in results:
            exploit_result = await exploit.run(
                "Generate attack chains from the correlated graph.",
                {"correlation_graph": results["correlation"]},
            )
            results["exploit"] = exploit_result.content

        # Phase 5: Verification
        verif = self.agents.get("verification")
        if verif and "exploit" in results:
            verif_result = await verif.run(
                "Verify all findings and attack chains for accuracy.",
                {k: v for k, v in results.items() if k != "verification"},
            )
            results["verification"] = verif_result.content

        # Phase 6: Reporting
        report = self.agents.get("report")
        if report:
            report_result = await report.run(
                "Synthesize all intelligence into an operational report.",
                results,
            )
            results["report"] = report_result.content

        # Phase 7: Memory update
        memory = self.agents.get("memory")
        if memory:
            memory_result = await memory.run(
                "Update engagement memory with new findings and state changes.",
                results,
            )
            results["memory"] = memory_result.content

        return results
