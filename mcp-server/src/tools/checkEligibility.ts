import { z } from "zod";
import { verifyEligibility } from "../agents/verifier.js";
import { emit } from "../tracer.js";

const InputSchema = z.object({
  schemeId: z.string(),
  profile: z.object({
    state: z.string(),
    category: z.string(),
    annualIncome: z.number(),
    courseLevel: z.enum(["10th", "12th", "UG", "PG", "PhD"]),
    percentage: z.number(),
    gender: z.enum(["male", "female", "other"]),
    disability: z.boolean(),
  }),
});

export const checkEligibility = {
  definition: {
    name: "check_eligibility",
    description:
      "Runs the verifier agent against a specific scheme and student profile. Returns a structured eligibility result with reasons.",
    inputSchema: InputSchema,
  },
  handler: async (input: z.infer<typeof InputSchema>) => {
    emit("tool_call", {
      tool: "check_eligibility",
      status: "started",
      schemeId: input.schemeId,
    });

    const result = verifyEligibility(input.schemeId, input.profile);

    emit("agent_step", {
      agent: "verifier",
      schemeId: input.schemeId,
      eligible: result.eligible,
    });

    emit("tool_call", {
      tool: "check_eligibility",
      status: "completed",
      eligible: result.eligible,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  },
};
