import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getOWASPKnowledge,
  getAllOWASPKnowledge,
  createOWASPKnowledge,
} from "../db";
import { invokeLLM } from "../_core/llm";

export const owaspRouter = router({
  getCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      let knowledge = await getOWASPKnowledge(input.category);

      if (!knowledge) {
        // Generate knowledge if not found using local AI
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an OWASP expert. Provide detailed security knowledge in JSON format.",
            },
            {
              role: "user",
              content: `Provide comprehensive information about OWASP ${input.category}. 
              Return JSON: { "title": string, "description": string, "examples": string[], "checklist": string[], "references": string[] }`,
            },
          ],
          response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message.content || "{}";
        let parsed: any = {};

        try {
          parsed = typeof content === 'string' ? JSON.parse(content) : content;
        } catch {
          parsed = {};
        }

        const newKnowledge = await createOWASPKnowledge({
          category: input.category,
          title: parsed.title || input.category,
          description: parsed.description || "",
          examples: JSON.stringify(parsed.examples || []),
          checklist: JSON.stringify(parsed.checklist || []),
          references: JSON.stringify(parsed.references || []),
        });
        knowledge = newKnowledge;
      }

      if (!knowledge) {
        throw new Error("Failed to retrieve or create OWASP knowledge");
      }

      return {
        category: knowledge.category,
        title: knowledge.title,
        description: knowledge.description || "",
        examples: knowledge.examples
          ? JSON.parse(knowledge.examples)
          : [],
        checklist: knowledge.checklist
          ? JSON.parse(knowledge.checklist)
          : [],
        references: knowledge.references
          ? JSON.parse(knowledge.references)
          : [],
      };
    }),

  listAll: publicProcedure.query(async () => {
    const all = await getAllOWASPKnowledge();
    return all.map((k) => ({
      category: k.category,
      title: k.title,
      description: k.description,
    }));
  }),
});
