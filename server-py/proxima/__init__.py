"""
Proxima Integration Layer — Provider-Agnostic Model Routing & Multi-Agent Orchestration.

Architecture:
  Lattice9 Agent System
       ↓
  Provider Abstraction Layer  ← ─ ─ ─  Proxima (MCP-compatible orchestration backend)
       ↓
  Model Runtimes (OpenAI / Claude / Gemini / Perplexity / Local)
       ↓
  MCP Tool Registry

Design Principles:
  - Proxima is a PLUGGABLE backend, NOT a hard dependency
  - The provider abstraction allows swapping Proxima for any OpenAI-compatible endpoint
  - Agent definitions are protocol-agnostic (works via REST, WebSocket, or MCP)
  - Tool execution is proxied through MCP, with local fallback
"""

import logging
import json
import asyncio
import time
from typing import List, Dict, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("lattice9-proxima")

# ---------------------------------------------------------------------------
# Provider Abstraction Layer
# ---------------------------------------------------------------------------

class ProviderType(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    PERPLEXITY = "perplexity"
    LOCAL = "local"
    PROXIMA = "proxima"  # Meta-provider routing through Proxima


@dataclass
class ModelConfig:
    """Provider-agnostic model configuration."""
    provider: ProviderType
    model_name: str
    temperature: float = 0.3
    max_tokens: int = 4096
    timeout_s: int = 60
    api_base: Optional[str] = None
    api_key: Optional[str] = None


@dataclass
class AgentMessage:
    """Unified message format across all providers."""
    role: str  # "system", "user", "assistant", "tool"
    content: str
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None
    metadata: Optional[Dict] = field(default_factory=dict)


@dataclass
class ToolDefinition:
    """MCP-compatible tool definition."""
    name: str
    description: str
    input_schema: Dict
    handler: Optional[Callable[..., Awaitable[str]]] = None


class ProviderClient:
    """
    Abstract base for all provider clients.
    ProximaClient is the primary implementation; others exist for direct API fallback.
    """
    async def chat(self, messages: List[AgentMessage],
                   config: ModelConfig) -> AgentMessage:
        raise NotImplementedError

    async def chat_stream(self, messages: List[AgentMessage],
                          config: ModelConfig):
        raise NotImplementedError

    async def list_models(self) -> List[str]:
        raise NotImplementedError


class ProximaClient(ProviderClient):
    """
    Proxima-backed provider client.
    Routes through Proxima's OpenAI-compatible REST API at localhost:3210.
    Supports multi-model queries (single provider or "all").
    """
    def __init__(self, base_url: str = "http://127.0.0.1:3210"):
        self.base_url = base_url
        self._provider_map = {
            "openai": "chatgpt",
            "anthropic": "claude",
            "google": "gemini",
            "perplexity": "perplexity",
        }

    def _to_proxima_model(self, config: ModelConfig) -> str:
        if config.provider == ProviderType.PROXIMA:
            return config.model_name  # Already a Proxima model identifier
        return self._provider_map.get(config.provider.value, "claude")

    async def chat(self, messages: List[AgentMessage],
                   config: ModelConfig) -> AgentMessage:
        import aiohttp
        model = self._to_proxima_model(config)
        payload = {
            "model": model,
            "message": messages[-1].content if messages else "",
        }
        if config.temperature:
            payload["temperature"] = config.temperature

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=config.timeout_s),
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise RuntimeError(f"Proxima API error {resp.status}: {text}")
                data = await resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return AgentMessage(role="assistant", content=content)

    async def chat_stream(self, messages: List[AgentMessage],
                          config: ModelConfig):
        import aiohttp
        model = self._to_proxima_model(config)
        payload = {
            "model": model,
            "message": messages[-1].content if messages else "",
            "stream": True,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=config.timeout_s),
            ) as resp:
                async for line in resp.content:
                    if line.startswith(b"data: "):
                        chunk = line[6:]
                        if chunk.strip() == b"[DONE]":
                            break
                        try:
                            data = json.loads(chunk)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def list_models(self) -> List[str]:
        import aiohttp
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/v1/models",
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return [m["id"] for m in data.get("data", [])]
        except Exception as e:
            logger.warning(f"Proxima model list failed: {e}")
        return ["chatgpt", "claude", "gemini", "perplexity"]

    async def health(self) -> bool:
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/status",
                    timeout=aiohttp.ClientTimeout(total=3),
                ) as resp:
                    return resp.status == 200
        except Exception:
            return False


# ---------------------------------------------------------------------------
# Tool Execution Layer
# ---------------------------------------------------------------------------

class ToolRegistry:
    """Registry for MCP-compatible tools with local and Proxima-backed execution."""

    def __init__(self, proxima_client: Optional[ProximaClient] = None):
        self._tools: Dict[str, ToolDefinition] = {}
        self._proxima = proxima_client

    def register(self, tool: ToolDefinition):
        self._tools[tool.name] = tool

    def get_schema(self) -> List[Dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.input_schema,
                },
            }
            for t in self._tools.values()
        ]

    def get(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list(self) -> List[str]:
        return list(self._tools.keys())

    async def execute(self, name: str, **kwargs) -> str:
        tool = self._tools.get(name)
        if tool and tool.handler:
            return await tool.handler(**kwargs)
        raise ValueError(f"Tool '{name}' not found or has no local handler")


# ---------------------------------------------------------------------------
# Agent Runtime
# ---------------------------------------------------------------------------

class BaseAgent:
    """
    Protocol-agnostic agent runtime.

    Each agent has:
    - A system prompt defining its role and reasoning style
    - Access to the provider client for LLM calls
    - A tool registry for executing actions
    - Memory of its conversation history
    """

    def __init__(self, name: str, system_prompt: str,
                 provider_client: ProviderClient,
                 tool_registry: ToolRegistry,
                 model_config: Optional[ModelConfig] = None):
        self.name = name
        self.system_prompt = system_prompt
        self.client = provider_client
        self.tools = tool_registry
        self.model_config = model_config or ModelConfig(
            provider=ProviderType.PROXIMA,
            model_name="claude",
        )
        self._messages: List[AgentMessage] = [
            AgentMessage(role="system", content=system_prompt)
        ]

    async def run(self, task: str, context: Optional[Dict] = None) -> AgentMessage:
        """Execute the agent on a given task."""
        user_msg = task
        if context:
            user_msg = f"{task}\n\n<context>\n{json.dumps(context, indent=2)}\n</context>"
        self._messages.append(AgentMessage(role="user", content=user_msg))

        response = await self.client.chat(self._messages, self.model_config)
        self._messages.append(response)

        # Truncate history to prevent context overflow
        if len(self._messages) > 50:
            self._messages = [self._messages[0]] + self._messages[-40:]

        return response

    async def stream(self, task: str, context: Optional[Dict] = None):
        """Stream the agent's response."""
        user_msg = task
        if context:
            user_msg = f"{task}\n\n<context>\n{json.dumps(context, indent=2)}\n</context>"
        self._messages.append(AgentMessage(role="user", content=user_msg))

        full_content = ""
        async for chunk in self.client.chat_stream(self._messages, self.model_config):
            full_content += chunk
            yield chunk

        self._messages.append(AgentMessage(role="assistant", content=full_content))

    def reset(self):
        """Reset conversation history (keep system prompt)."""
        self._messages = [self._messages[0]]

    @property
    def history(self) -> List[AgentMessage]:
        return self._messages[1:]  # Exclude system prompt


# ---------------------------------------------------------------------------
# Multi-Agent Orchestrator
# ---------------------------------------------------------------------------

class OrchestrationStrategy(str, Enum):
    SEQUENTIAL = "sequential"      # Run agents one after another
    PARALLEL = "parallel"          # Run agents simultaneously
    DEBATE = "debate"              # Agents debate, then synthesize
    PIPELINE = "pipeline"          # Feed each agent's output as next's input
    ROUND_ROBIN = "round_robin"    # Cycle through agents until convergence


class MultiAgentOrchestrator:
    """
    Orchestrates multiple agents using configurable strategies.

    Uses Proxima-style multi-model queries when available,
    falls back to sequential single-model execution.
    """

    def __init__(self, proxima_client: Optional[ProximaClient] = None):
        self._agents: Dict[str, BaseAgent] = {}
        self._proxima = proxima_client

    def register(self, agent: BaseAgent):
        self._agents[agent.name] = agent

    def get(self, name: str) -> Optional[BaseAgent]:
        return self._agents.get(name)

    async def run_sequential(self, task: str,
                              agent_names: List[str],
                              context: Optional[Dict] = None) -> Dict[str, Any]:
        """Run agents sequentially, feeding context forward."""
        results = {}
        current_context = context or {}
        for name in agent_names:
            agent = self._agents.get(name)
            if not agent:
                continue
            response = await agent.run(task, current_context)
            results[name] = response.content
            current_context[f"{name}_result"] = response.content
        return results

    async def run_parallel(self, task: str,
                            agent_names: List[str],
                            context: Optional[Dict] = None) -> Dict[str, Any]:
        """Run agents in parallel."""
        async def _run(name: str) -> tuple:
            agent = self._agents.get(name)
            if not agent:
                return name, None
            response = await agent.run(task, context)
            return name, response.content

        tasks = [_run(name) for name in agent_names if name in self._agents]
        results_list = await asyncio.gather(*tasks)
        return {name: content for name, content in results_list}

    async def run_debate(self, task: str,
                          agent_names: List[str],
                          rounds: int = 2) -> Dict[str, Any]:
        """Agents debate by reviewing each other's responses."""
        # Round 1: all agents respond independently
        results = await self.run_parallel(
            f"Analyze this problem and state your position: {task}",
            agent_names,
        )

        # Subsequent rounds: agents review and respond to each other
        for round_num in range(1, rounds):
            debate_context = {
                "round": round_num,
                "previous_responses": results,
                "task": task,
            }
            round_results = {}
            for name in agent_names:
                agent = self._agents.get(name)
                if not agent:
                    continue
                review_prompt = (
                    f"Round {round_num + 1}. Review the other agents' positions "
                    f"and refine your analysis. Address counterarguments."
                )
                response = await agent.run(review_prompt, debate_context)
                round_results[name] = response.content
            results = round_results

        # Synthesize final answer
        synthesis_agent = self._agents.get("planner") or self._agents.get("report")
        if synthesis_agent:
            synthesis = await synthesis_agent.run(
                f"Synthesize the following agent debate into a final analysis: {task}",
                {"debate_results": results},
            )
            return {
                "debate_rounds": results,
                "synthesis": synthesis.content,
            }

        return {"debate_rounds": results}

    async def run_pipeline(self, input_data: Dict,
                            pipeline: List[str]) -> Dict[str, Any]:
        """Pipeline execution: each agent transforms the output."""
        current = input_data
        for name in pipeline:
            agent = self._agents.get(name)
            if not agent:
                continue
            response = await agent.run(
                "Process the following data according to your role.",
                current,
            )
            current[f"{name}_output"] = response.content
        return current

    def agent_names(self) -> List[str]:
        return list(self._agents.keys())
