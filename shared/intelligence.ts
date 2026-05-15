/**
 * HAWK Intelligence Normalized Schema
 * 
 * We move from "Tool Output" to "Intelligence Entities".
 * An IntelligenceEntity is an abstract object (e.g., a "Server") 
 * that can have multiple observations from different tools.
 */

export enum EntityType {
  ASSET = "asset",           // IP, Domain, Host
  IDENTITY = "identity",     // User, Email, Service Account
  CREDENTIAL = "credential", // Key, Password, Hash
  SERVICE = "service",       // Port, Protocol, Application
  VULNERABILITY = "vuln",    // CVE, Misconfig, Exploit
}

export enum RelationshipType {
  REACHES = "reaches",       // Network reachability
  IDENTIFIES = "identifies", // OSINT / Attribution
  AUTHENTICATES = "auths",   // Credential usage
  EXPLOITS = "exploits",     // Vuln mapping
  CONTAINS = "contains",     // Structural relationship
}

export interface IntelligenceEntity {
  id: string; // UUID
  type: EntityType;
  label: string;
  confidence: number; // 0.0 - 1.0
  entropy: number;    // Information uncertainty
  metadata: Record<string, any>;
}

export interface IntelligenceInference {
  id: string;
  sourceId: string; // Entity A
  targetId: string; // Entity B
  type: RelationshipType;
  weight: number;   // Strength of the link
  evidence: string[]; // IDs of raw tool outputs
  reasoning: string;  // Natural language explanation of the inference
}

export interface AttackPath {
  id: string;
  nodes: string[]; // Entity IDs
  edges: string[]; // Inference IDs
  critical_node: string;
  compromise_prob: number;
  summary: string;
}
