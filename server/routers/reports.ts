import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getEngagementById,
  getFindingsByEngagementId,
  getReportsByEngagementId,
  createReport,
} from "../db";
import { invokeLLM } from "../_core/llm";

export const reportsRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        engagementId: z.string(),
        title: z.string(),
        findingIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const engagement = await getEngagementById(input.engagementId);
      if (!engagement || engagement.tenantId !== ctx.user.tenantId) {
        throw new Error("Engagement not found");
      }

      const findings = await getFindingsByEngagementId(input.engagementId);
      const selectedFindings = input.findingIds
        ? findings.filter((f) => input.findingIds!.includes(f.id))
        : findings;

      const findingsText = selectedFindings
        .map(
          (f) =>
            `## ${f.title}\n**Severity:** ${f.severity}\n**CWE:** ${f.cwe}\n**Evidence:** ${f.evidence}\n**Remediation:** ${f.remediation}`
        )
        .join("\n\n");

      const reportPrompt = `Generate a professional bug bounty report for engagement ${engagement.name}.
      
Findings:
${findingsText}

Format as markdown with sections: Summary, Findings, Impact, Recommendations, CVSS Scores.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a professional security report writer. Generate detailed, actionable bug bounty reports in Markdown.",
          },
          {
            role: "user",
            content: reportPrompt,
          },
        ],
      });

      const content = response.choices[0]?.message.content as string || "";

      await createReport({
        engagementId: input.engagementId,
        title: input.title,
        content,
        findingIds: input.findingIds || [],
      });

      return {
        success: true,
        report: {
          title: input.title,
          content,
        },
      };
    }),

  list: protectedProcedure
    .input(z.object({ engagementId: z.string() }))
    .query(async ({ ctx, input }) => {
      const engagement = await getEngagementById(input.engagementId);
      if (!engagement || engagement.tenantId !== ctx.user.tenantId) {
        throw new Error("Engagement not found");
      }

      return getReportsByEngagementId(input.engagementId);
    }),
});
