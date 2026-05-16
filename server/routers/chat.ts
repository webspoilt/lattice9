import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getConversationByUserId,
  createOrUpdateConversation,
} from "../db";
import { invokeLLM } from "../_core/llm";

export const chatRouter = router({
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const systemPrompt = `You are Lattice9 Advisor, an ethical cybersecurity analyst and strategic advisor.

Your role:
- Teach ethical hacking and security testing concepts
- Explain vulnerabilities and remediation
- Guide users through bug bounty workflows
- Provide tool-specific guidance (Burp Suite, Nmap, FFUF, SQLmap, Nuclei)
- Emphasize authorization and ethical boundaries

CRITICAL RULES:
- ONLY assist with authorized testing and educational labs
- REFUSE to help with unauthorized access, malware, or destructive actions
- Always explain concepts before providing any technical details
- Map findings to OWASP Top 10 and CWE standards
- Prioritize defensive reasoning and safe validation methods

Always respond with educational value and ethical guidance.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: input.message,
          },
        ],
      });

      const assistantMessage = response.choices[0]?.message.content as string || "";

      // Save conversation
      const conversation = await getConversationByUserId(ctx.user.id);
      let messages: any[] = [];
      if (conversation) {
        try {
          messages = JSON.parse(conversation.messages || "[]");
        } catch {
          messages = [];
        }
      }

      messages.push(
        { role: "user", content: input.message },
        { role: "assistant", content: assistantMessage }
      );

      await createOrUpdateConversation(
        ctx.user.id,
        JSON.stringify(messages.slice(-20)) // Keep last 20 messages
      );

      return {
        message: assistantMessage,
      };
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const conversation = await getConversationByUserId(ctx.user.id);
    if (!conversation) return [];
    try {
      return JSON.parse(conversation.messages || "[]");
    } catch {
      return [];
    }
  }),
});
