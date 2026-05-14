import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  targets,
  ethicalPermissionLogs,
  targetScopes,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { db, createTarget, createPermissionLog, addTargetScope } from "../db";

export const targetsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!db) return [];
    return db.select().from(targets).where(eq(targets.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(
      z.object({
        domain: z.string().min(1, "Domain is required"),
        scopePatterns: z.array(z.string()).optional(),
        authorizationStatement: z.string().min(20, "Authorization statement must be at least 20 characters"),
        confirmed: z.boolean().refine(v => v === true, "You must confirm authorization"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Create the target
      const result = await createTarget(ctx.user.id, input.domain);
      const targetId = result[0].insertId as number;

      // 2. Create the Ethical Permission Log (The Legal Shield)
      await createPermissionLog(
        targetId,
        ctx.user.id,
        input.authorizationStatement,
        ctx.req.ip,
        ctx.req.headers["user-agent"]
      );

      // 3. Add initial scope if provided
      if (input.scopePatterns && input.scopePatterns.length > 0) {
        for (const pattern of input.scopePatterns) {
          await addTargetScope(targetId, pattern, "include");
        }
      }

      return { id: targetId };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!db) throw new Error("Database not available");
      const [target] = await db
        .select()
        .from(targets)
        .where(and(eq(targets.id, input.id), eq(targets.userId, ctx.user.id)))
        .limit(1);

      if (!target) throw new Error("Target not found or unauthorized");
      return target;
    }),
});
