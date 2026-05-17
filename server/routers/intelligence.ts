import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getEngagementById } from "../db";
import axios from "axios";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";
const ENGINE_KEY = process.env.LATTICE9_ENGINE_KEY;

async function verifyEngagementAccess(engagementId: string, tenantId: string) {
  const engagement = await getEngagementById(engagementId);
  if (!engagement || engagement.tenantId !== tenantId) {
    throw new Error("Engagement not found or unauthorized");
  }
  return engagement;
}

export const intelligenceRouter = router({

  // ========== Graph Field Theory ==========

  getFieldDensity: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/field/${input.engagementId}/density`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getFieldGradients: protectedProcedure
    .input(z.object({ engagementId: z.string(), nodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/field/${input.engagementId}/gradients/${input.nodeId}`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getPrivilegeDiffusion: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/field/${input.engagementId}/privilege-diffusion`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Topological Resistance ==========

  getResistanceMap: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/resistance/${input.engagementId}/map`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getResistancePaths: protectedProcedure
    .input(z.object({
      engagementId: z.string(), sourceId: z.string(), targetId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/resistance/${input.engagementId}/paths`,
        { params: { source_id: input.sourceId, target_id: input.targetId },
          headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getSegmentationConductivity: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/resistance/${input.engagementId}/segmentation`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Attack Wave Propagation ==========

  simulateWavePropagation: protectedProcedure
    .input(z.object({
      engagementId: z.string(),
      sourceNodeIds: z.string().optional(),
      steps: z.number().default(50),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.post(
        `${ENGINE_URL}/wave/${input.engagementId}/simulate`,
        null,
        { params: {
            source_node_ids: input.sourceNodeIds,
            steps: input.steps,
          },
          headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 120000,
        }
      );
      return data;
    }),

  getPropagationVelocity: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/wave/${input.engagementId}/velocity`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getWaveAmplification: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/wave/${input.engagementId}/amplification`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Adversarial Game Theory ==========

  getMinimaxTraversal: protectedProcedure
    .input(z.object({
      engagementId: z.string(), sourceId: z.string(), targetId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/game/${input.engagementId}/minimax`,
        { params: { source_id: input.sourceId, target_id: input.targetId },
          headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getNashEquilibrium: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/game/${input.engagementId}/nash`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getAdaptivePaths: protectedProcedure
    .input(z.object({ engagementId: z.string(), sourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/game/${input.engagementId}/adaptive`,
        { params: { source_id: input.sourceId },
          headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Attack Economics ==========

  getPathEconomics: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/economics/${input.engagementId}/paths`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getStealthPaths: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/economics/${input.engagementId}/stealth`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getCampaignEconomics: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/economics/${input.engagementId}/campaign`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Topological Data Analysis ==========

  getPersistentHomology: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/topology/${input.engagementId}/homology`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getSimplicialComplexes: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/topology/${input.engagementId}/simplices`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getGraphVoids: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/topology/${input.engagementId}/voids`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Graph Neural Reasoning ==========

  getNodeEmbeddings: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/gnn/${input.engagementId}/embeddings`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 120000 }
      );
      return data;
    }),

  getPredictedRelationships: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/gnn/${input.engagementId}/predict-relationships`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 120000 }
      );
      return data;
    }),

  getEscalationPredictions: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/gnn/${input.engagementId}/escalation-predictions`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 120000 }
      );
      return data;
    }),

  // ========== Attack Attractor Theory ==========

  getCompromiseAttractors: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/attractor/${input.engagementId}`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getAttractorInstability: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/attractor/${input.engagementId}/instability`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getCompromiseInevitability: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/attractor/${input.engagementId}/inevitability`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Information Geometry ==========

  getGeodesicPath: protectedProcedure
    .input(z.object({
      engagementId: z.string(), sourceId: z.string(), targetId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/geometry/${input.engagementId}/geodesic`,
        { params: { source_id: input.sourceId, target_id: input.targetId },
          headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getManifoldCurvature: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/geometry/${input.engagementId}/curvature`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  getGradientDescent: protectedProcedure
    .input(z.object({
      engagementId: z.string(), sourceId: z.string(),
      objective: z.string().default("privilege"),
    }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/geometry/${input.engagementId}/gradient-descent`,
        { params: { source_id: input.sourceId, objective: input.objective },
          headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 60000 }
      );
      return data;
    }),

  // ========== Unified Intelligence ==========

  getAllIntelligence: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyEngagementAccess(input.engagementId, ctx.user.tenantId);
      const { data } = await axios.get(
        `${ENGINE_URL}/intelligence/${input.engagementId}/all`,
        { headers: { "X-Lattice9-Key": ENGINE_KEY }, timeout: 120000 }
      );
      return data;
    }),
});
