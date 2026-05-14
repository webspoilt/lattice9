import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("[Database] DATABASE_URL is not set. Database features will be unavailable.");
}

export const db = databaseUrl ? drizzle(databaseUrl, { schema, mode: 'default' }) : null;

// User Helpers
export async function getUserByOpenId(openId: string) {
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUser(user: typeof schema.users.$inferInsert) {
  if (!db) return;
  await db.insert(schema.users).values(user).onDuplicateKeyUpdate({ set: user });
}

// Target Helpers
export async function getTargetsByUserId(userId: number) {
  if (!db) return [];
  return db.select().from(schema.targets).where(eq(schema.targets.userId, userId));
}

export async function getTargetById(targetId: number) {
  if (!db) return undefined;
  const result = await db.select().from(schema.targets).where(eq(schema.targets.id, targetId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTarget(userId: number, domain: string) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.targets).values({
    userId,
    domain,
    status: "idle",
  });
}

// Scope Helpers
export async function addTargetScope(targetId: number, pattern: string, type: "include" | "exclude") {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.targetScopes).values({ targetId, pattern, type });
}

export async function getTargetScopes(targetId: number) {
  if (!db) return [];
  return db.select().from(schema.targetScopes).where(eq(schema.targetScopes.targetId, targetId));
}

// Permission Log Helpers
export async function createPermissionLog(targetId: number, userId: number, statement: string, ipAddress?: string, userAgent?: string) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.ethicalPermissionLogs).values({
    targetId,
    userId,
    statement,
    ipAddress,
    userAgent,
  });
}

export async function getPermissionLogs(targetId: number) {
  if (!db) return [];
  return db.select().from(schema.ethicalPermissionLogs).where(eq(schema.ethicalPermissionLogs.targetId, targetId));
}

export async function getEthicalPermissionLog(targetId: number) {
  if (!db) return undefined;
  const result = await db.select().from(schema.ethicalPermissionLogs).where(eq(schema.ethicalPermissionLogs.targetId, targetId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Recon Helpers
export async function addSubdomain(targetId: number, subdomain: string, ipAddress?: string, source?: string) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.reconSubdomains).values({ targetId, subdomain, ipAddress, source });
}

export async function getSubdomains(targetId: number) {
  if (!db) return [];
  return db.select().from(schema.reconSubdomains).where(eq(schema.reconSubdomains.targetId, targetId));
}

export async function addTechStack(targetId: number, name: string, version?: string, category?: string) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.reconTechStack).values({ targetId, name, version, category });
}

export async function getTechStack(targetId: number) {
  if (!db) return [];
  return db.select().from(schema.reconTechStack).where(eq(schema.reconTechStack.targetId, targetId));
}

// Finding Helpers
export async function getFindingsByTargetId(targetId: number) {
  if (!db) return [];
  return db.select().from(schema.findings).where(eq(schema.findings.targetId, targetId));
}

export async function createFinding(data: typeof schema.findings.$inferInsert) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.findings).values(data);
}

// Report Helpers
export async function getReportsByTargetId(targetId: number) {
  if (!db) return [];
  return db.select().from(schema.reports).where(eq(schema.reports.targetId, targetId));
}

export async function createReport(data: typeof schema.reports.$inferInsert) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.reports).values(data);
}

export async function linkFindingToReport(reportId: number, findingId: number) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.reportFindings).values({ reportId, findingId });
}

// Conversation Helpers
export async function getConversationByUserId(userId: number) {
  if (!db) return undefined;
  const result = await db.select().from(schema.conversations).where(eq(schema.conversations.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateConversation(userId: number, messages: string) {
  if (!db) throw new Error("Database not available");
  const existing = await getConversationByUserId(userId);
  if (existing) {
    return db.update(schema.conversations).set({ messages, updatedAt: new Date() }).where(eq(schema.conversations.userId, userId));
  }
  return db.insert(schema.conversations).values({ userId, messages });
}

// OWASP Knowledge Helpers
export async function getOWASPKnowledge(category: string) {
  if (!db) return undefined;
  const result = await db.select().from(schema.owaspKnowledge).where(eq(schema.owaspKnowledge.category, category)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOWASPKnowledge() {
  if (!db) return [];
  return db.select().from(schema.owaspKnowledge);
}

export async function createOWASPKnowledge(data: typeof schema.owaspKnowledge.$inferInsert) {
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schema.owaspKnowledge).values(data);
  const id = result[0].insertId as number;
  const [knowledge] = await db.select().from(schema.owaspKnowledge).where(eq(schema.owaspKnowledge.id, id)).limit(1);
  return knowledge;
}
