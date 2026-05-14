import asyncio
import socket
import json
import os
import dns.resolver
import ipaddress
import logging
import math
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Tuple, Set
from fastapi import FastAPI, HTTPException, Request, Depends, Header, BackgroundTasks
from pydantic import BaseModel, HttpUrl, Field
import httpx
from scrapling import StealthyFetcher
import networkx as nx
import numpy as np
from scipy import stats, linalg

# --- Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("hawk-engine")

app = FastAPI(
    title="HAWK Engine",
    description="Pentest intelligence engine with graph analysis and probabilistic scoring.",
    version="3.5.1"
)

# --- Core Types ---

class AssetType(str, Enum):
    DOMAIN = "domain"
    IP = "ip"
    SERVICE = "service"
    ENDPOINT = "endpoint"

class EvidenceSource(str, Enum):
    DET = "deterministic"
    HEU = "heuristic"
    STAT = "statistical"
    OBS = "observation"

class FindingEvidence(BaseModel):
    source: EvidenceSource
    name: str
    confidence: float
    variance: float
    data: Any

class ReasoningStep(BaseModel):
    step_id: int
    observation: str
    inference: str
    confidence_impact: float

class Finding(BaseModel):
    title: str
    asset: str
    confidence: float = 0.0
    uncertainty: float = 0.0
    triage_priority: str = "LOW" # Calculated from graph centrality
    evidence_chain: List[FindingEvidence] = []
    reasoning_trace: List[ReasoningStep] = []
    next_action: Optional[str] = None

class AttackPath(BaseModel):
    id: str
    path: List[str]
    confidence: float
    summary: str
    critical: bool = False

# --- Engine Logic ---

class AnalysisEngine:
    @staticmethod
    def fuse_evidence(prior: float, evidence: List[FindingEvidence]) -> Tuple[float, float]:
        """
        Bayesian Evidence Fusion with Uncertainty Propagation.
        Updates confidence (P) and variance (V).
        """
        p = prior
        v = 0.05 # Initial variance
        
        for e in evidence:
            # Simple Bayesian Update
            # Likelihood ratio based on evidence confidence
            lr = e.confidence / (1 - e.confidence + 1e-6)
            p = (p * lr) / (p * lr + (1 - p))
            
            # Variance propagation (simplified)
            v = (v * e.variance) / (v + e.variance + 1e-6)
            
        return round(p, 4), round(v, 4)

class EngineCore:
    def __init__(self, target_id: int, domain: str):
        self.target_id = target_id
        self.domain = domain
        self.logs = []
        self.findings = []
        self.graph = nx.Graph()

    def log(self, msg: str):
        self.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
        logger.info(f"Target {self.target_id}: {msg}")

    async def run(self):
        self.log(f"Initiating adversarial reasoning for {self.domain}")
        
        # 1. Evidence Collection (Simulated for Prototype)
        e1 = FindingEvidence(
            source=EvidenceSource.DET, 
            name="X-Powered-By Header", 
            confidence=0.95, 
            variance=0.01, 
            data={"value": "Laravel"}
        )
        e2 = FindingEvidence(
            source=EvidenceSource.STAT, 
            name="Response Timing Anomaly", 
            confidence=0.72, 
            variance=0.08, 
            data={"latency": "450ms", "deviation": "2.1 sigma"}
        )
        
        # 2. Reasoning Trace Generation
        trace = [
            ReasoningStep(
                step_id=1, 
                observation="Detected 'X-Powered-By: Laravel' in response headers.", 
                inference="Target infrastructure confirmed as Laravel-based. Establishing framework-specific exploit priors.",
                confidence_impact=0.45
            ),
            ReasoningStep(
                step_id=2, 
                observation="Significant timing deviation (2.1 sigma) detected at /api/v1.", 
                inference="Anomalous response behavior suggests unoptimized debug mode or internal middleware exposure.",
                confidence_impact=0.25
            )
        ]

        # 3. Probabilistic Fusion
        conf, unc = AnalysisEngine.fuse_evidence(0.1, [e1, e2])
        
        # 4. Finding Triage (Graph Centrality Simulation)
        # In a real run, this would be derived from the actual asset graph
        priority = "CRITICAL" if conf > 0.8 else "HIGH"

        f1 = Finding(
            title="Laravel Debug Mode Exposure",
            asset=self.domain,
            confidence=conf,
            uncertainty=unc,
            triage_priority=priority,
            evidence_chain=[e1, e2],
            reasoning_trace=trace,
            next_action="RECON_DIRECTORY_BRUTEFORCE"
        )
        
        self.findings.append(f1)

        # 5. Path Optimization (Decision Compression)
        path = AttackPath(
            id="PATH_01",
            path=[self.domain, "laravel_debug", "rce_transition"],
            confidence=conf,
            summary="High-confidence path to compromise via Laravel debug mode. Requires directory enumeration to confirm endpoint exposure.",
            critical=True
        )

        # Store Results
        jobs[self.target_id]["analysis"] = {
            "paths": [path.dict()],
            "findings": [f.dict() for f in self.findings],
            "logs": self.logs
        }
        jobs[self.target_id]["status"] = "completed"
        self.log("Adversarial reasoning completed. Results compressed.")

# --- API ---

HAWK_API_KEY = os.getenv("HAWK_ENGINE_KEY", "hawk-secret-key")
jobs = {}

async def auth(key: str = Header(None)):
    if key != HAWK_API_KEY:
        raise HTTPException(status_code=401)

class RunRequest(BaseModel):
    domain: str
    target_id: int

@app.post("/run", dependencies=[Depends(auth)])
async def start_run(req: RunRequest, tasks: BackgroundTasks):
    jobs[req.target_id] = {"status": "running", "start": datetime.now().isoformat()}
    core = EngineCore(req.target_id, req.domain)
    tasks.add_task(core.run)
    return {"status": "ok"}

@app.get("/status/{target_id}")
async def get_status(target_id: int):
    return jobs.get(target_id, {"error": "not_found"})

@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.5.1"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
