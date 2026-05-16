import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  collectionRuns,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { db, getEngagementById } from "../db";
import axios from "axios";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";
const ENGINE_KEY = process.env.LATTICE9_ENGINE_KEY;
if (!ENGINE_KEY) {
  throw new Error("LATTICE9_ENGINE_KEY environment variable is required");
}

export const reconRouter = router({
  startCollection: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const engagement = await getEngagementById(input.engagementId);
      if (!engagement || engagement.tenantId !== ctx.user.tenantId) {
        throw new Error("Engagement not found or unauthorized");
      }

      if (!db) throw new Error("Database not available");

      // 1. Create the Collection Run record
      const [run] = await db.insert(collectionRuns).values({
        engagementId: input.engagementId,
        requestedBy: ctx.user.id,
        collectionProfile: "full_offensive",
        scopeVersion: engagement.scopeVersion,
        status: "pending",
      }).returning();

      // 2. Trigger the Python Intelligence Engine
      try {
        await axios.post(`${ENGINE_URL}/analyze/${input.engagementId}`, {
          run_id: run.id,
          profile: "full_offensive",
        }, {
          headers: { "X-Lattice9-Key": ENGINE_KEY }
        });
      } catch (e: any) {
        await db.update(collectionRuns).set({ status: "failed" }).where(eq(collectionRuns.id, run.id));
        throw new Error(`Failed to start Intelligence Engine: ${e.message}`);
      }

      return { runId: run.id };
    }),

  getRuns: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!db) return [];
      return db.select().from(collectionRuns)
        .where(eq(collectionRuns.engagementId, input.engagementId))
        .orderBy(desc(collectionRuns.createdAt));
    }),
});
