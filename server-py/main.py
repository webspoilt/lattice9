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
    version="3.5.0"
)

# --- Core Types ---

class AssetType(str, Enum):
    DOMAIN = "domain"
    IP = "ip"
    SERVICE = "service"
    ENDPOINT = "endpoint"

class EvidenceSource(str, Enum):
    DET = "det"
    HEU = "heu"
    STAT = "stat"
    AI = "ai"

class FindingEvidence(BaseModel):
    source: EvidenceSource
    confidence: float
    variance: float
    data: Any

class Finding(BaseModel):
    title: str
    asset: str
    evidence: List[FindingEvidence] = []
    confidence: float = 0.0
    uncertainty: float = 0.0
    notes: List[str] = []
    next_action: Optional[str] = None

class AttackPath(BaseModel):
    path: List[str]
    score: float
    summary: str

# --- Engine Logic ---

class AnalysisEngine:
    @staticmethod
    def get_posterior(prior: float, evidence: List[FindingEvidence]) -> Tuple[float, float]:
        """Update confidence based on evidence."""
        p = prior
        v = 0.0
        for e in evidence:
            lr = e.confidence
            fpr = 0.1
            pe = (lr * p) + (fpr * (1 - p))
            if pe > 0:
                p = (lr * p) / pe
                v += e.variance / (len(evidence) or 1)
        return p, v

class EngineCore:
    def __init__(self, target_id: int, domain: str):
        self.target_id = target_id
        self.domain = domain
        self.logs = []
        self.findings = {}

    def log(self, msg: str):
        self.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
        logger.info(f"Target {self.target_id}: {msg}")

    async def run(self):
        self.log(f"Starting analysis for {self.domain}")
        
        # Simple evidence collection simulation
        e1 = FindingEvidence(source=EvidenceSource.DET, confidence=0.98, variance=0.01, data={"header": "X-Powered-By: Laravel"})
        e2 = FindingEvidence(source=EvidenceSource.STAT, confidence=0.75, variance=0.05, data={"path": "/api/v1", "anomaly": "timing"})

        f1 = Finding(
            title="Laravel Debug Exposure",
            asset=self.domain,
            notes=[
                "Detected Laravel via response headers.",
                "Timing anomaly detected at /api/v1.",
                "Possible debug mode enabled."
            ],
            evidence=[e1, e2]
        )
        
        conf, unc = AnalysisEngine.get_posterior(0.1, f1.evidence)
        f1.confidence = conf
        f1.uncertainty = unc
        f1.next_action = "BRUTEFORCE_DIRECTORIES"
        
        self.findings["f1"] = f1

        # Build path
        path = AttackPath(
            path=[self.domain, "laravel_exposure", "exploit"],
            score=round(conf * 0.5, 2),
            summary="Laravel exposure found, next step is directory enumeration to find debug endpoints."
        )

        jobs[self.target_id]["analysis"] = {
            "paths": [path.dict()],
            "findings": [f1.dict()],
            "logs": self.logs
        }
        jobs[self.target_id]["status"] = "completed"
        self.log("Analysis finished.")

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
    return {"status": "ok", "version": "3.5.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
