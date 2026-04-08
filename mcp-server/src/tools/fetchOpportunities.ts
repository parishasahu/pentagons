import { z } from "zod";
import { discoverSchemesWithRetry } from "../agents/discover.js";
import { emit } from "../tracer.js";

const InputSchema = z.object({
  profile: z.object({
    name: z.string(),
    state: z.string(),
    category: z.string(),
    annualIncome: z.number(),
    courseLevel: z.enum(["10th", "12th", "UG", "PG", "PhD"]),
    percentage: z.number(),
    gender: z.enum(["male", "female", "other"]),
    disability: z.boolean().default(false),
  }),
});

export const fetchOpportunities = {
  definition: {
    name: "fetch_opportunities",
    description:
      "Called from inside App 1 after the student submits their profile. Runs the discover agent to find matching schemes. Returns structured { profile, schemes } data.",
    inputSchema: InputSchema,
  },
  handler: async (input: z.infer<typeof InputSchema>) => {
    emit("tool_call", {
      tool: "fetch_opportunities",
      status: "started",
      profile: input.profile.name,
    });

    const { schemes, retried } = discoverSchemesWithRetry(input.profile, emit);

    emit("agent_step", {
      agent: "discover",
      schemesFound: schemes.length,
      retried,
    });

    emit("tool_call", {
      tool: "fetch_opportunities",
      status: "completed",
      schemesFound: schemes.length,
      retried,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ profile: input.profile, schemes }),
        },
      ],
      structuredContent: { profile: input.profile, schemes } as unknown as Record<string, unknown>,
    };
  },
};
