import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../drizzle/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("[Database] DATABASE_URL is not set. Database features will be unavailable.");
}

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
export const db = pool ? drizzle(pool, { schema }) : null;

// User Helpers
export async function getUserByOpenId(openId: string) {
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUser(userData: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}) {
  if (!db) return;
  
  // 1. Check if user already has a tenant via existing record, or create one
  const existing = await getUserByOpenId(userData.openId);
  let tenantId = existing?.tenantId;

  if (!tenantId) {
    let tenant = await db.query.tenants.findFirst();
    if (!tenant) {
      const [newTenant] = await db.insert(schema.tenants).values({ name: "Lattice9 Sovereign" }).returning();
      tenant = newTenant;
    }
    tenantId = tenant.id;
  }

  // 2. Map fields to schema
  const dbUser = {
    openId: userData.openId,
    email: userData.email,
    displayName: userData.name,
    loginMethod: userData.loginMethod,
    lastSignedIn: userData.lastSignedIn || new Date(),
    tenantId,
  };

  if (existing) {
    await db.update(schema.users)
      .set(dbUser)
      .where(eq(schema.users.id, existing.id));
  } else {
    await db.insert(schema.users).values({
      ...dbUser,
      role: "user",
    });
  }
}

// Engagement Helpers (Replaces Targets)
export async function getEngagementsByTenantId(tenantId: string) {
  if (!db) return [];
  return db.select().from(schema.engagements).where(eq(schema.engagements.tenantId, tenantId));
}

export async function getEngagementById(id: string) {
  if (!db) return undefined;
  const result = await db.select().from(schema.engagements).where(eq(schema.engagements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEngagement(userId: string, tenantId: string, name: string, authStatement: string) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.engagements).values({
    tenantId,
    name,
    status: "active",
    authorizationStatement: authStatement,
    authorizationHash: createHash("sha256").update(authStatement + userId).digest("hex"),
    createdBy: userId,
  }).returning();
}

// Evidence Helpers
export async function createEvidence(data: typeof schema.evidenceItems.$inferInsert) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.evidenceItems).values(data).returning();
}

export async function getEvidenceByEngagementId(engagementId: string) {
  if (!db) return [];
  return db.select().from(schema.evidenceItems).where(eq(schema.evidenceItems.engagementId, engagementId));
}

// Entity Helpers
export async function createEntity(data: typeof schema.entities.$inferInsert) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.entities).values(data).onConflictDoUpdate({
    target: [schema.entities.engagementId, schema.entities.entityType, schema.entities.canonicalKey],
    set: data,
  }).returning();
}

// Finding Helpers
export async function createFinding(data: typeof schema.findings.$inferInsert) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.findings).values(data).returning();
}

export async function getFindingsByEngagementId(engagementId: string) {
  if (!db) return [];
  return db.select().from(schema.findings).where(eq(schema.findings.engagementId, engagementId));
}

// Conversation Helpers
export async function getConversationByUserId(userId: string) {
  if (!db) return undefined;
  const result = await db.select().from(schema.conversations).where(eq(schema.conversations.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateConversation(userId: string, messages: string) {
  if (!db) throw new Error("Database not available");
  const existing = await getConversationByUserId(userId);
  if (existing) {
    return db.update(schema.conversations).set({ messages, updatedAt: new Date() }).where(eq(schema.conversations.userId, userId));
  }
  return db.insert(schema.conversations).values({ userId, messages });
}

// OWASP Knowledge Helpers
export async function getAllOWASPKnowledge() {
  if (!db) return [];
  return db.select().from(schema.owaspKnowledge);
}

export async function getOWASPKnowledge(category: string) {
  if (!db) return undefined;
  const result = await db.select().from(schema.owaspKnowledge).where(eq(schema.owaspKnowledge.category, category)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOWASPKnowledge(data: any) {
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schema.owaspKnowledge).values(data).returning();
  return result[0];
}

// Report Helpers
export async function getReportsByEngagementId(engagementId: string) {
  if (!db) return [];
  return db.select().from(schema.reports).where(eq(schema.reports.engagementId, engagementId));
}

export async function createReport(data: {
  engagementId: string;
  title: string;
  content: string;
  findingIds: string[];
}) {
  if (!db) throw new Error("Database not available");
  return db.insert(schema.reports).values(data);
}
