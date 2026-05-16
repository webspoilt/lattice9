from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AnalysisRequest(BaseModel):
    run_id: str
    profile: str = "full_offensive"

class EntityRow(BaseModel):
    id: str
    entity_type: str
    canonical_key: str
    display_name: str
    confidence: str
    first_seen_at: Any
    last_seen_at: Any
    valid_from: Any
    valid_to: Optional[Any]
    attributes: Optional[str]

class FindingRow(BaseModel):
    id: str
    title: str
    severity: str
    confidence: Optional[str]
    validation_state: str
    cwe: Optional[str]
    affected_entity_id: Optional[str]
    first_seen_at: Any
    last_seen_at: Any
    entity_name: Optional[str]
    entity_key: Optional[str]
    evidence: Optional[str]
    source_tool: Optional[str]
    remediation: Optional[str]

class EvidenceRow(BaseModel):
    id: str
    source_type: str
    artifact_uri: str
    sha256: str
    captured_at: Any
    metadata: Optional[str]
