"""
Lattice9 Graph Schema — Multi-Label Neo4j Schema

Node Labels:
  (L9)                          — Base label for all graph entities
  (L9:Asset:Host)               — Host/Server infrastructure
  (L9:Asset:Service)            — Network service (port, protocol)
  (L9:Asset:Endpoint)           — URL/API endpoint
  (L9:Identity)                 — User, service account, role
  (L9:Credential)               — Key, password, token, hash
  (L9:Vulnerability)            — CVE, weakness class
  (L9:Finding)                  — Instance of a vulnerability on an entity
  (L9:Evidence)                 — Raw observation artifact
  (L9:TrustZone)                — Network trust boundary
  (L9:Objective)                — Attack goal / crown jewel

Relationship Types:
  RESOLVES_TO     (Domain → IP)          DNS resolution
  HOSTS           (Host → Service)       Service binding
  DEPENDS_ON      (Service → Service)    Dependency
  AUTHENTICATES_TO (Cred → Service)      Auth mechanism
  HAS_FINDING     (Entity → Finding)     Finding attachment
  EXPLOITS        (Vuln → Service)       Exploitability
  TRUSTS          (Entity → Entity)      Trust relationship
  PRIVILEGE_ESCALATION (Id → Id)        Priv esc path
  DATA_FLOW       (Service → Service)    Data movement
  NETWORK_REACH   (Host → Host)          Network access
  ATTACK_STEP     (Step in path)         Attack path edge
  DERIVED_FROM    (Finding → Evidence)   Evidence lineage
  OBSERVED_AT     (Evidence → Entity)    Observation context
"""

import logging
from typing import List

logger = logging.getLogger("lattice9-graph-engine")

ENTITY_LABEL_MAP = {
    "host": ["Asset", "Host"],
    "service": ["Asset", "Service"],
    "endpoint": ["Asset", "Endpoint"],
    "identity": ["Identity"],
    "credential": ["Credential"],
    "vulnerability": ["Vulnerability"],
    "finding": ["Finding"],
    "evidence": ["Evidence"],
    "trust_zone": ["TrustZone"],
    "objective": ["Objective"],
}

RELATIONSHIP_TYPES = {
    "RESOLVES_TO": {"default_weight": 0.7, "description": "DNS resolution"},
    "HOSTS": {"default_weight": 0.8, "description": "Service binding"},
    "DEPENDS_ON": {"default_weight": 0.6, "description": "Service dependency"},
    "AUTHENTICATES_TO": {"default_weight": 0.9, "description": "Auth mechanism"},
    "HAS_FINDING": {"default_weight": 1.0, "description": "Finding attachment"},
    "EXPLOITS": {"default_weight": 0.5, "description": "Exploitability"},
    "TRUSTS": {"default_weight": 0.5, "description": "Trust relationship"},
    "PRIVILEGE_ESCALATION": {"default_weight": 0.7, "description": "Privilege escalation"},
    "DATA_FLOW": {"default_weight": 0.5, "description": "Data movement"},
    "NETWORK_REACH": {"default_weight": 0.4, "description": "Network access"},
    "ATTACK_STEP": {"default_weight": 0.8, "description": "Attack path step"},
    "DERIVED_FROM": {"default_weight": 1.0, "description": "Evidence lineage"},
    "OBSERVED_AT": {"default_weight": 0.9, "description": "Observation context"},
}

CONSTRAINTS_CYPHER = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (n:L9) REQUIRE (n.engagement_id, n.entity_type, n.canonical_key) IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (n:L9) REQUIRE n.id IS UNIQUE",
    "CREATE INDEX IF NOT EXISTS FOR (n:L9) ON (n.engagement_id)",
    "CREATE INDEX IF NOT EXISTS FOR (n:L9) ON (n.entity_type)",
    "CREATE INDEX IF NOT EXISTS FOR (n:L9) ON (n.confidence)",
    "CREATE INDEX IF NOT EXISTS FOR (n:Asset) ON (n.engagement_id)",
    "CREATE INDEX IF NOT EXISTS FOR (n:Finding) ON (n.severity)",
    "CREATE INDEX IF NOT EXISTS FOR (n:Finding) ON (n.validation_state)",
    "CREATE INDEX IF NOT EXISTS FOR ()-[r:HAS_FINDING]-() ON (r.confidence)",
    "CREATE INDEX IF NOT EXISTS FOR ()-[r:RESOLVES_TO]-() ON (r.confidence)",
]


async def ensure_constraints(driver):
    """Create all Neo4j constraints and indexes."""
    if not driver:
        return
    async with driver.session(database="neo4j") as session:
        for cypher in CONSTRAINTS_CYPHER:
            try:
                await session.run(cypher)
            except Exception as e:
                logger.warning(f"Constraint/index creation skipped: {e}")
    logger.info("Graph schema constraints verified")


def get_labels(entity_type: str) -> List[str]:
    """Get Neo4j labels for an entity type. Always includes L9 base label."""
    labels = ENTITY_LABEL_MAP.get(entity_type, [])
    return ["L9"] + labels
