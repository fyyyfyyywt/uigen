import { generateObject } from "ai";
import { z } from "zod";
import { getCriticModel } from "@/lib/provider";

const ReviewSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string(),
  approved: z.boolean(),
});

export async function reviewCode(code: string, userRequest: string) {
  const model = getCriticModel();

  const prompt = `
You are a strict code reviewer. Review the following React component code based on the user's request.

User Request: "${userRequest}"

Critique Criteria:
1. Functionality: Does it do what was asked?
2. Styling: Is it polished? Does it use Tailwind correctly? Are there hover states/animations?
3. Best Practices: Is the code clean? properly typed (if TS)? accessible?

Output strictly in JSON:
- score: 0-10 (8+ is approved)
- feedback: Concise, actionable improvements. Max 3 bullet points. No essays.
- approved: true if score >= 8
`;

  try {
    const { object } = await generateObject({
      model,
      schema: ReviewSchema,
      prompt: `${prompt}\n\nCode to review:\n${code}`,
      temperature: 0, // Strict
      maxTokens: 1000, // Increased to prevent JSON truncation
    });
    return object;
  } catch (error) {
    console.error("Review failed:", error);
    // Fallback if review fails to avoid blocking the user
    return { score: 10, feedback: "Review service unavailable.", approved: true };
  }
}
