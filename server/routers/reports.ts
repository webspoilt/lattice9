import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getTargetById,
  getFindingsByTargetId,
  getReportsByTargetId,
  createReport,
} from "../db";
import { invokeLLM } from "../_core/llm";

export const reportsRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        targetId: z.number(),
        title: z.string(),
        findingIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const target = await getTargetById(input.targetId);
      if (!target || target.userId !== ctx.user.id) {
        throw new Error("Target not found");
      }

      const findings = await getFindingsByTargetId(input.targetId);
      const selectedFindings = input.findingIds
        ? findings.filter((f) => input.findingIds!.includes(f.id))
        : findings;

      const findingsText = selectedFindings
        .map(
          (f) =>
            `## ${f.title}\n**Severity:** ${f.severity}\n**CWE:** ${f.cwe}\n**Evidence:** ${f.evidence}\n**Remediation:** ${f.remediation}`
        )
        .join("\n\n");

      const reportPrompt = `Generate a professional bug bounty report for ${target.domain}.
      
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
        targetId: input.targetId,
        title: input.title,
        content,
        findingIds: JSON.stringify(input.findingIds || []),
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
    .input(z.object({ targetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const target = await getTargetById(input.targetId);
      if (!target || target.userId !== ctx.user.id) {
        throw new Error("Target not found");
      }

      return getReportsByTargetId(input.targetId);
    }),
});
