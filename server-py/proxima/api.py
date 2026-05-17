"""
Proxima Orchestration — REST API for multi-agent execution via the Proxima layer.

Endpoints:
  POST /proxima/health           — Check Proxima connectivity
  POST /proxima/agents/run       — Run a specific agent on a task
  POST /proxima/pipeline/run     — Execute full intelligence pipeline
  POST /proxima/debate           — Multi-agent debate
  GET  /proxima/agents           — List available agents
  GET  /proxima/models           — List available models from Proxima
"""

import logging
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from proxima import (
    ProximaClient, MultiAgentOrchestrator, ToolRegistry,
    OrchestrationStrategy, AgentMessage,
)
from proxima.agents import AgentFactory, EngagementPipeline

logger = logging.getLogger("lattice9-orchestration")

# Singleton instances
_proxima_client: Optional[ProximaClient] = None
_orchestrator: Optional[MultiAgentOrchestrator] = None
_tool_registry: Optional[ToolRegistry] = None

router = APIRouter(prefix="/proxima", tags=["proxima"])


def get_client() -> ProximaClient:
    global _proxima_client
    if _proxima_client is None:
        _proxima_client = ProximaClient()
    return _proxima_client


def get_tools() -> ToolRegistry:
    global _tool_registry
    if _tool_registry is None:
        _tool_registry = ToolRegistry(proxima_client=get_client())
    return _tool_registry


def get_orchestrator() -> MultiAgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        client = get_client()
        tools = get_tools()
        _orchestrator = MultiAgentOrchestrator(proxima_client=client)
        agents = AgentFactory.create_all(client, tools)
        for name, agent in agents.items():
            _orchestrator.register(agent)
    return _orchestrator


@router.get("/health")
async def health():
    """Check Proxima backend connectivity."""
    client = get_client()
    alive = await client.health()
    if alive:
        models = await client.list_models()
        return {
            "status": "connected",
            "proxima_version": "4.1.0",
            "available_models": models,
        }
    return {"status": "disconnected", "message": "Proxima backend not reachable"}


@router.get("/models")
async def list_models():
    """List all available models through Proxima."""
    client = get_client()
    models = await client.list_models()
    return {"models": models, "provider": "proxima"}


@router.get("/agents")
async def list_agents():
    """List all registered agents."""
    orch = get_orchestrator()
    agents = orch.agent_names()
    return {
        "agents": agents,
        "count": len(agents),
        "orchestration_strategies": [s.value for s in OrchestrationStrategy],
    }


@router.post("/agents/run")
async def run_agent(
    agent_name: str = Query(..., description="Agent name: planner, recon, correlation, exploit, verification, report, memory"),
    task: str = Query(..., description="Task description for the agent"),
):
    """Run a single agent on a task."""
    orch = get_orchestrator()
    agent = orch.get(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    try:
        response = await agent.run(task)
        return {
            "agent": agent_name,
            "response": response.content,
            "status": "completed",
        }
    except Exception as e:
        logger.error(f"Agent {agent_name} failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/run")
async def run_pipeline(
    objective: str = Query(..., description="Engagement objective"),
):
    """Execute the full multi-agent intelligence pipeline."""
    client = get_client()
    tools = get_tools()
    agents = AgentFactory.create_all(client, tools)
    pipeline = EngagementPipeline(agents)
    try:
        results = await pipeline.run(objective)
        return {
            "objective": objective,
            "pipeline_complete": True,
            "phases": list(results.keys()),
            "results": results,
        }
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debate")
async def debate(
    topic: str = Query(..., description="Debate topic"),
    agent_a: str = Query("planner", description="First agent"),
    agent_b: str = Query("exploit", description="Second agent"),
    rounds: int = Query(2, description="Number of debate rounds"),
):
    """Multi-agent debate on a security topic."""
    orch = get_orchestrator()
    if not orch.get(agent_a) or not orch.get(agent_b):
        raise HTTPException(status_code=404, detail="One or both agents not found")
    try:
        results = await orch.run_debate(
            task=topic,
            agent_names=[agent_a, agent_b],
            rounds=rounds,
        )
        return {
            "topic": topic,
            "agents": [agent_a, agent_b],
            "rounds": rounds,
            "results": results,
        }
    except Exception as e:
        logger.error(f"Debate failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
