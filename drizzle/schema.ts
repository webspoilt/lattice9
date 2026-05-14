import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Targets represent the organizations or domains being tested.
 */
export const targets = mysqlTable("targets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  domain: varchar("domain", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["idle", "active", "completed", "archived"]).default("idle").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Target Scope (Normalized)
 */
export const targetScopes = mysqlTable("targetScopes", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  pattern: varchar("pattern", { length: 255 }).notNull(), // e.g. "*.example.com"
  type: mysqlEnum("type", ["include", "exclude"]).default("include").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Ethical Permission Logs (The Legal Shield)
 */
export const ethicalPermissionLogs = mysqlTable("ethicalPermissionLogs", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  userId: int("userId").notNull().references(() => users.id),
  statement: text("statement").notNull(), 
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  signature: text("signature"), // Base64 or Hex signature
  signedAt: timestamp("signedAt").defaultNow().notNull(),
});

/**
 * Reconnaissance Results (Normalized)
 */
export const reconSubdomains = mysqlTable("reconSubdomains", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  subdomain: varchar("subdomain", { length: 255 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  isLive: boolean("isLive").default(true),
  source: varchar("source", { length: 64 }), // e.g. "subfinder", "crtsh"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reconTechStack = mysqlTable("reconTechStack", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  name: varchar("name", { length: 128 }).notNull(), // e.g. "React", "Nginx"
  version: varchar("version", { length: 64 }),
  category: varchar("category", { length: 64 }), // e.g. "Frontend Framework", "Web Server"
  confidence: int("confidence").default(100),
  evidence: text("evidence"), // Marker found
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reconPorts = mysqlTable("reconPorts", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  port: int("port").notNull(),
  protocol: varchar("protocol", { length: 10 }).default("tcp").notNull(),
  service: varchar("service", { length: 64 }),
  state: varchar("state", { length: 20 }), // open, closed, filtered
  rawData: text("rawData"), // e.g. banner grab
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Vulnerability Findings
 */
export const findings = mysqlTable("findings", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  title: varchar("title", { length: 255 }).notNull(),
  severity: mysqlEnum("severity", ["Critical", "High", "Medium", "Low", "Info"]).notNull(),
  cwe: varchar("cwe", { length: 64 }),
  cvss: decimal("cvss", { precision: 3, scale: 1 }),
  description: text("description"),
  evidence: text("evidence"), 
  rawRequest: text("rawRequest"),
  rawResponse: text("rawResponse"),
  sourceTool: varchar("sourceTool", { length: 64 }), // e.g. "HAWK-Sovereign", "AI-Agent"
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"),
  remediation: text("remediation"),
  status: mysqlEnum("status", ["open", "remediated", "false_positive", "accepted_risk"]).default("open").notNull(),
  isPublic: boolean("isPublic").default(false),
  category: varchar("category", { length: 64 }), // e.g. "A01:2021"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  content: text("content"), // Full markdown content
  status: mysqlEnum("status", ["draft", "final"]).default("draft").notNull(),
  isPublic: boolean("isPublic").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Report Findings (Join Table)
 */
export const reportFindings = mysqlTable("reportFindings", {
  reportId: int("reportId").notNull().references(() => reports.id),
  findingId: int("findingId").notNull().references(() => findings.id),
}, (t) => ({
  pk: [t.reportId, t.findingId],
}));

/**
 * Conversations
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  messages: text("messages"), 
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * OWASP Knowledge Base (Cached AI results)
 */
export const owaspKnowledge = mysqlTable("owaspKnowledge", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 64 }).notNull().unique(), // e.g. "A01:2021"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  examples: text("examples"), // JSON array
  checklist: text("checklist"), // JSON array
  references: text("references"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Workflow Stages (The Sovereign 5)
 */
export const workflowStages = mysqlTable("workflowStages", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  stage: mysqlEnum("stage", ["recon", "scanning", "assessment", "audit", "forensics"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * System Integrity Audits (Defensive counterpart to "Clearing Tracks")
 */
export const systemAudits = mysqlTable("systemAudits", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull().references(() => targets.id),
  auditType: varchar("auditType", { length: 64 }).notNull(), // e.g. "log_integrity", "process_anomaly"
  findings: text("findings"), // JSON array of anomalies found
  severity: mysqlEnum("severity", ["Critical", "High", "Medium", "Low", "Info"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations
export const targetRelations = relations(targets, ({ many, one }) => ({
  user: one(users, { fields: [targets.userId], references: [users.id] }),
  findings: many(findings),
  subdomains: many(reconSubdomains),
  techStack: many(reconTechStack),
  ports: many(reconPorts),
  reports: many(reports),
  permissionLogs: many(ethicalPermissionLogs),
  scopes: many(targetScopes),
}));

export const findingRelations = relations(findings, ({ one, many }) => ({
  target: one(targets, { fields: [findings.targetId], references: [targets.id] }),
  reports: many(reportFindings),
}));

export const reportRelations = relations(reports, ({ one, many }) => ({
  target: one(targets, { fields: [reports.targetId], references: [targets.id] }),
  findings: many(reportFindings),
}));

export const reportFindingsRelations = relations(reportFindings, ({ one }) => ({
  report: one(reports, { fields: [reportFindings.reportId], references: [reports.id] }),
  finding: one(findings, { fields: [reportFindings.findingId], references: [findings.id] }),
}));