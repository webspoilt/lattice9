import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getTargetById,
  addSubdomain,
  addTechStack,
  getSubdomains,
  getTechStack,
} from "../db";
import { invokeLLM } from "../_core/llm";
import axios from "axios";

const ENGINE_URL = "http://localhost:8000";
const ENGINE_KEY = process.env.HAWK_ENGINE_KEY || "sovereign-hawk-secret-2026";

export const reconRouter = router({
  startPipeline: protectedProcedure
    .input(z.object({ targetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const target = await getTargetById(input.targetId);
      if (!target || target.userId !== ctx.user.id) {
        throw new Error("Target not found");
      }

      // 1. Trigger the Sovereign Pipeline (Background)
      try {
        const response = await axios.post(`${ENGINE_URL}/recon/pipeline`, {
          domain: target.domain,
          target_id: input.targetId,
        }, {
          headers: { "X-HAWK-Key": ENGINE_KEY }
        });

        if (response.data.status !== "accepted") {
          throw new Error("Sovereign Engine rejected the request");
        }
      } catch (e: any) {
        throw new Error(`Failed to start Sovereign Engine: ${e.message}`);
      }

      return { success: true, message: "Pipeline started in background" };
    }),

  getStatus: protectedProcedure
    .input(z.object({ targetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const target = await getTargetById(input.targetId);
      if (!target || target.userId !== ctx.user.id) {
        throw new Error("Target not found");
      }

      try {
        const response = await axios.get(`${ENGINE_URL}/jobs/${input.targetId}`, {
          headers: { "X-HAWK-Key": ENGINE_KEY }
        });

        const job = response.data;
        
        return [
          { stage: "recon", status: job.dns && Object.keys(job.dns).length > 0 ? "completed" : (job.status === "failed" ? "failed" : "pending"), output: job.dns },
          { stage: "tech_stack", status: job.tech_stack?.length > 0 ? "completed" : (job.status === "failed" ? "failed" : "pending"), output: job.tech_stack },
          { stage: "port_scan", status: job.ports?.length > 0 ? "completed" : (job.status === "failed" ? "failed" : "pending"), output: job.ports },
          { stage: "assessment", status: job.vulnerabilities?.length > 0 ? "completed" : (job.status === "failed" ? "failed" : "pending"), output: job.vulnerabilities },
          { stage: "forensics", status: job.forensics?.length > 0 ? "completed" : (job.status === "failed" ? "failed" : "pending"), output: job.forensics },
        ];
      } catch (e) {
        return [
          { stage: "dns_recon", status: "pending", output: null },
          { stage: "tech_stack", status: "pending", output: null },
          { stage: "port_scan", status: "pending", output: null },
        ];
      }
    }),

  getResults: protectedProcedure
    .input(z.object({ targetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const target = await getTargetById(input.targetId);
      if (!target || target.userId !== ctx.user.id) {
        throw new Error("Target not found");
      }

      const subdomains = await getSubdomains(input.targetId);
      const tech = await getTechStack(input.targetId);

      return {
        subdomains,
        techStack: tech,
      };
    }),
});
