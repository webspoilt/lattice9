import { pgTable, uuid, text, timestamp, integer, numeric, pgEnum, boolean, primaryKey, unique, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * ENUMS
 */
export const severityEnum = pgEnum("severity", ["critical", "high", "medium", "low", "info"]);
export const validationStateEnum = pgEnum("validation_state", [
  "unvalidated",
  "candidate",
  "validated",
  "contradicted",
  "expired",
  "accepted_false_positive"
]);

/**
 * CORE OPERATIONAL TABLES
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  openId: text("open_id").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  loginMethod: text("login_method"),
  role: text("role").default("user").notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq_email: unique().on(t.tenantId, t.email),
}));

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  status: text("status").notNull(),
  scopeVersion: integer("scope_version").default(1).notNull(),
  authorizationStatement: text("authorization_statement").notNull(),
  authorizationHash: text("authorization_hash").notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scopeRules = pgTable("scope_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  version: integer("version").notNull(),
  ruleType: text("rule_type", { enum: ["include", "exclude"] }).notNull(),
  targetType: text("target_type", { enum: ["fqdn", "cidr", "asn", "url", "cloud_account"] }).notNull(),
  pattern: text("pattern").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * COLLECTION & EVIDENCE
 */
export const collectionRuns = pgTable("collection_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  collectionProfile: text("collection_profile").notNull(),
  scopeVersion: integer("scope_version").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const toolExecutions = pgTable("tool_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionRunId: uuid("collection_run_id").notNull().references(() => collectionRuns.id),
  toolName: text("tool_name").notNull(),
  toolVersion: text("tool_version").notNull(),
  commandTemplateHash: text("command_template_hash").notNull(),
  containerImageDigest: text("container_image_digest"),
  inputHash: text("input_hash").notNull(),
  exitCode: integer("exit_code"),
  status: text("status").notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
});

export const evidenceItems = pgTable("evidence_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  toolExecutionId: uuid("tool_execution_id").references(() => toolExecutions.id),
  sourceType: text("source_type").notNull(),
  artifactUri: text("artifact_uri").notNull(),
  sha256: text("sha256").notNull(),
  mimeType: text("mime_type"),
  capturedAt: timestamp("captured_at").notNull(),
  redactionState: text("redaction_state").default("none").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
}, (t) => ({
  unq: unique().on(t.engagementId, t.sha256),
}));

/**
 * ENTITIES, OBSERVATIONS, & RELATIONSHIPS
 */
export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  entityType: text("entity_type").notNull(),
  canonicalKey: text("canonical_key").notNull(),
  displayName: text("display_name").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  firstSeenAt: timestamp("first_seen_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to"),
  attributes: jsonb("attributes").default({}).notNull(),
}, (t) => ({
  unq: unique().on(t.engagementId, t.entityType, t.canonicalKey),
}));

export const entityObservations = pgTable("entity_observations", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  entityId: uuid("entity_id").references(() => entities.id),
  candidateType: text("candidate_type").notNull(),
  canonicalValue: text("canonical_value").notNull(),
  parserName: text("parser_name").notNull(),
  parserVersion: text("parser_version").notNull(),
  evidenceId: uuid("evidence_id").notNull().references(() => evidenceItems.id),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  observedAt: timestamp("observed_at").notNull(),
  attributes: jsonb("attributes").default({}).notNull(),
});

export const relationships = pgTable("relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  sourceEntityId: uuid("source_entity_id").notNull().references(() => entities.id),
  targetEntityId: uuid("target_entity_id").notNull().references(() => entities.id),
  relationshipType: text("relationship_type").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  weight: numeric("weight", { precision: 8, scale: 4 }).notNull(),
  sourceRuleId: text("source_rule_id"),
  firstSeenAt: timestamp("first_seen_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to"),
  attributes: jsonb("attributes").default({}).notNull(),
});

export const relationshipEvidence = pgTable("relationship_evidence", {
  relationshipId: uuid("relationship_id").notNull().references(() => relationships.id),
  evidenceId: uuid("evidence_id").notNull().references(() => evidenceItems.id),
  supportType: text("support_type").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.relationshipId, t.evidenceId] }),
}));

/**
 * OFFENSIVE INTELLIGENCE
 */
export const vulnerabilities = pgTable("vulnerabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  vulnKey: text("vuln_key").notNull().unique(),
  vulnType: text("vuln_type").notNull(),
  cve: text("cve"),
  cwe: text("cwe"),
  cvssBase: numeric("cvss_base", { precision: 3, scale: 1 }),
  exploitMaturity: text("exploit_maturity"),
  references: jsonb("references").default([]).notNull(),
});

export const findings = pgTable("findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  affectedEntityId: uuid("affected_entity_id").notNull().references(() => entities.id),
  vulnerabilityId: uuid("vulnerability_id").references(() => vulnerabilities.id),
  title: text("title").notNull(),
  severity: severityEnum("severity").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  validationState: validationStateEnum("validation_state").default("unvalidated").notNull(),
  
  // High-level metadata for UI
  evidence: text("evidence"),
  remediation: text("remediation"),
  sourceTool: text("source_tool"),
  cwe: text("cwe"),
  cvss: numeric("cvss", { precision: 3, scale: 1 }),
  rawRequest: text("raw_request"),
  rawResponse: text("raw_response"),

  environmentalRelevance: numeric("environmental_relevance", { precision: 5, scale: 4 }).default("0.0000").notNull(),
  duplicateClusterId: uuid("duplicate_cluster_id"),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: text("status").default("open").notNull(),
  attributes: jsonb("attributes").default({}).notNull(),
});

export const findingEvidence = pgTable("finding_evidence", {
  findingId: uuid("finding_id").notNull().references(() => findings.id),
  evidenceId: uuid("evidence_id").notNull().references(() => evidenceItems.id),
  role: text("role").notNull(), // supporting, contradicting, validation, context
  confidenceDelta: numeric("confidence_delta", { precision: 6, scale: 4 }).default("0.0000").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.findingId, t.evidenceId, t.role] }),
}));

export const attackPaths = pgTable("attack_paths", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  snapshotId: uuid("snapshot_id"),
  objectiveEntityId: uuid("objective_entity_id").references(() => entities.id),
  entryEntityId: uuid("entry_entity_id").references(() => entities.id),
  title: text("title").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  feasibility: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  impact: numeric("impact", { precision: 5, scale: 4 }).notNull(),
  priority: numeric("priority", { precision: 8, scale: 4 }).notNull(),
  state: text("state").default("candidate").notNull(),
  reasoningTrace: jsonb("reasoning_trace").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attackPathSteps = pgTable("attack_path_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  attackPathId: uuid("attack_path_id").notNull().references(() => attackPaths.id),
  stepIndex: integer("step_index").notNull(),
  sourceEntityId: uuid("source_entity_id").references(() => entities.id),
  relationshipId: uuid("relationship_id").references(() => relationships.id),
  targetEntityId: uuid("target_entity_id").references(() => entities.id),
  findingId: uuid("finding_id").references(() => findings.id),
  ruleId: text("rule_id").notNull(),
  confidenceDelta: numeric("confidence_delta", { precision: 6, scale: 4 }).notNull(),
  explanation: text("explanation").notNull(),
  evidenceIds: uuid("evidence_ids").array().default([]).notNull(),
}, (t) => ({
  unq: unique().on(t.attackPathId, t.stepIndex),
}));

/**
 * TEMPORAL & MEMORY
 */
export const graphSnapshots = pgTable("graph_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  graphVersion: text("graph_version").notNull(),
  snapshotType: text("snapshot_type").notNull(),
  capturedAt: timestamp("captured_at").notNull(),
  entityCount: integer("entity_count").notNull(),
  relationshipCount: integer("relationship_count").notNull(),
  artifactUri: text("artifact_uri"),
  metadata: jsonb("metadata").default({}).notNull(),
});

export const temporalDiffs = pgTable("temporal_diffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  fromSnapshotId: uuid("from_snapshot_id").references(() => graphSnapshots.id),
  toSnapshotId: uuid("to_snapshot_id").references(() => graphSnapshots.id),
  diffType: text("diff_type").notNull(),
  affectedEntityId: uuid("affected_entity_id").references(() => entities.id),
  affectedRelationshipId: uuid("affected_relationship_id").references(() => relationships.id),
  driftScore: numeric("drift_score", { precision: 8, scale: 4 }).notNull(),
  explanation: text("explanation").notNull(),
  evidenceIds: uuid("evidence_ids").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const validationRuns = pgTable("validation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  findingId: uuid("finding_id").references(() => findings.id),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  validatorId: text("validator_id").notNull(),
  safetyPolicyVersion: text("safety_policy_version").notNull(),
  status: text("status").notNull(),
  resultState: validationStateEnum("result_state"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  metadata: jsonb("metadata").default({}).notNull(),
});

export const annotations = pgTable("annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  authorId: uuid("author_id").notNull().references(() => users.id),
  subjectType: text("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  messages: text("messages").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id").notNull().references(() => engagements.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  findingIds: jsonb("finding_ids").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const owaspKnowledge = pgTable("owasp_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  examples: text("examples"), // JSON string
  checklist: text("checklist"), // JSON string
  references: text("references"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RELATIONS
 */
export const tenantRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  engagements: many(engagements),
  auditEvents: many(auditEvents),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  engagements: many(engagements),
  collectionRuns: many(collectionRuns),
  validationRuns: many(validationRuns),
  annotations: many(annotations),
}));

export const engagementRelations = relations(engagements, ({ one, many }) => ({
  tenant: one(tenants, { fields: [engagements.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [engagements.createdBy], references: [users.id] }),
  scopeRules: many(scopeRules),
  collectionRuns: many(collectionRuns),
  evidenceItems: many(evidenceItems),
  entities: many(entities),
  findings: many(findings),
  attackPaths: many(attackPaths),
}));

export const findingRelations = relations(findings, ({ one, many }) => ({
  engagement: one(engagements, { fields: [findings.engagementId], references: [engagements.id] }),
  affectedEntity: one(entities, { fields: [findings.affectedEntityId], references: [entities.id] }),
  vulnerability: one(vulnerabilities, { fields: [findings.vulnerabilityId], references: [vulnerabilities.id] }),
  evidence: many(findingEvidence),
}));

export const attackPathRelations = relations(attackPaths, ({ one, many }) => ({
  engagement: one(engagements, { fields: [attackPaths.engagementId], references: [engagements.id] }),
  steps: many(attackPathSteps),
}));

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Engagement = typeof engagements.$inferSelect;
export type Finding = typeof findings.$inferSelect;
export type CollectionRun = typeof collectionRuns.$inferSelect;
export type EvidenceItem = typeof evidenceItems.$inferSelect;