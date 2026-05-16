"""
Evidence Lineage — Immutable chain tracking, provenance graphs, and replay system.

Core capabilities:
- Immutable evidence chain: every evidence item tracks its source, tool, execution
- Provenance graph: which evidence led to which finding/relationship
- Replay metadata: full context for reproducing findings
- Validation state machine: track lifecycle of evidence → finding → validation
"""

import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("lattice9-graph-engine")


async def create_evidence_chain(pg_pool, engagement_id: str,
                                 source_type: str, artifact_uri: str,
                                 content: str, metadata: dict = None) -> dict:
    """
    Create an evidence chain entry.
    Returns the evidence record with SHA256 fingerprint.
    """
    import hashlib

    sha256 = hashlib.sha256(content.encode()).hexdigest()
    evidence_id = str(uuid.uuid4())

    async with pg_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO evidence_items
                (id, engagement_id, source_type, artifact_uri, sha256,
                 captured_at, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (engagement_id, sha256) DO UPDATE SET
                captured_at = EXCLUDED.captured_at
            """,
            evidence_id, engagement_id, source_type, artifact_uri,
            sha256, datetime.utcnow(),
            json.dumps(metadata or {}),
        )

    return {
        "id": evidence_id,
        "sha256": sha256,
        "source_type": source_type,
        "artifact_uri": artifact_uri,
    }


async def get_evidence_provenance(pg_pool, evidence_id: str) -> dict:
    """
    Get the full provenance chain for an evidence item.
    Traces: evidence → findings → entities → relationships.
    """
    async with pg_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM evidence_items WHERE id = $1",
            evidence_id,
        )
        if not row:
            return {"error": "Evidence not found"}

        # Findings derived from this evidence
        findings = await conn.fetch(
            """
            SELECT f.id, f.title, f.severity, f.confidence, fe.role
            FROM finding_evidence fe
            JOIN findings f ON fe.finding_id = f.id
            WHERE fe.evidence_id = $1
            """,
            evidence_id,
        )

        # Relationships supported by this evidence
        rels = await conn.fetch(
            """
            SELECT r.id, r.relationship_type, r.source_entity_id, r.target_entity_id
            FROM relationship_evidence re
            JOIN relationships r ON re.relationship_id = r.id
            WHERE re.evidence_id = $1
            """,
            evidence_id,
        )

        return {
            "evidence": dict(row),
            "derived_findings": [dict(f) for f in findings],
            "supported_relationships": [dict(r) for r in rels],
        }


async def get_finding_evidence_chain(pg_pool, finding_id: str) -> dict:
    """
    Get the complete evidence chain leading to a finding.
    Returns all evidence items with their roles and confidence impacts.
    """
    async with pg_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT ei.id, ei.source_type, ei.artifact_uri, ei.sha256,
                   ei.captured_at, ei.metadata,
                   fe.role, fe.confidence_delta
            FROM finding_evidence fe
            JOIN evidence_items ei ON fe.evidence_id = ei.id
            WHERE fe.finding_id = $1
            ORDER BY ei.captured_at ASC
            """,
            finding_id,
        )

        supporting = []
        contradicting = []
        for row in rows:
            entry = {
                "id": row["id"],
                "source_type": row["source_type"],
                "sha256": row["sha256"][:12] + "...",
                "captured_at": row["captured_at"].isoformat() if hasattr(row["captured_at"], "isoformat") else str(row["captured_at"]),
                "confidence_delta": float(row["confidence_delta"]),
            }
            if row["role"] == "supporting":
                supporting.append(entry)
            else:
                contradicting.append(entry)

        return {
            "finding_id": finding_id,
            "supporting_evidence": supporting,
            "contradicting_evidence": contradicting,
            "total_supporting": len(supporting),
            "total_contradicting": len(contradicting),
            "net_confidence": sum(e["confidence_delta"] for e in supporting) - sum(e["confidence_delta"] for e in contradicting),
        }


async def record_evidence_derivation(pg_pool, finding_id: str,
                                      evidence_id: str, role: str,
                                      confidence_delta: float = 0.1):
    """
    Record that a finding was derived from an evidence item.
    Creates the finding_evidence link with role metadata.
    """
    async with pg_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO finding_evidence
                (finding_id, evidence_id, role, confidence_delta)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (finding_id, evidence_id, role) DO UPDATE SET
                confidence_delta = EXCLUDED.confidence_delta
            """,
            finding_id, evidence_id, role,
            str(confidence_delta),
        )


async def record_relationship_evidence(pg_pool, relationship_id: str,
                                        evidence_id: str, support_type: str):
    """Record evidence supporting a relationship."""
    async with pg_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO relationship_evidence
                (relationship_id, evidence_id, support_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (relationship_id, evidence_id) DO NOTHING
            """,
            relationship_id, evidence_id, support_type,
        )


async def get_engagement_evidence_lineage(pg_pool, engagement_id: str) -> dict:
    """
    Get the complete evidence lineage for an engagement.
    Shows the full provenance graph of all evidence → finding chains.
    """
    async with pg_pool.acquire() as conn:
        evidence_count = await conn.fetchval(
            "SELECT COUNT(*) FROM evidence_items WHERE engagement_id = $1",
            engagement_id,
        )
        finding_count = await conn.fetchval(
            "SELECT COUNT(*) FROM findings WHERE engagement_id = $1",
            engagement_id,
        )
        links = await conn.fetch(
            """
            SELECT fe.finding_id, fe.evidence_id, fe.role
            FROM finding_evidence fe
            JOIN findings f ON fe.finding_id = f.id
            WHERE f.engagement_id = $1
            """,
            engagement_id,
        )

        return {
            "engagement_id": engagement_id,
            "total_evidence": evidence_count,
            "total_findings": finding_count,
            "evidence_finding_links": [dict(l) for l in links],
        }
