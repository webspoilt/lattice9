import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  engagements,
  scopeRules,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { db, createEngagement } from "../db";

export const engagementsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!db) return [];
    return db.select().from(engagements).where(eq(engagements.tenantId, ctx.user.tenantId));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        scopePatterns: z.array(z.string()).optional(),
        authorizationStatement: z.string().min(20, "Authorization statement must be at least 20 characters"),
        confirmed: z.boolean().refine(v => v === true, "You must confirm authorization"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Create the engagement
      const results = await createEngagement(
        ctx.user.id, 
        ctx.user.tenantId, 
        input.name, 
        input.authorizationStatement
      );
      const engagement = results[0];

      // 2. Add initial scope rules
      if (input.scopePatterns && input.scopePatterns.length > 0) {
        if (!db) throw new Error("Database not available");
        for (const pattern of input.scopePatterns) {
          await db.insert(scopeRules).values({
            engagementId: engagement.id,
            version: 1,
            ruleType: "include",
            targetType: "fqdn", // Default to FQDN
            pattern,
            reason: "Initial scope",
          });
        }
      }

      return { id: engagement.id };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!db) throw new Error("Database not available");
      const [engagement] = await db
        .select()
        .from(engagements)
        .where(and(eq(engagements.id, input.id), eq(engagements.tenantId, ctx.user.tenantId)))
        .limit(1);

      if (!engagement) throw new Error("Engagement not found or unauthorized");
      return engagement;
    }),
});
