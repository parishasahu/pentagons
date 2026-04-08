import { z } from "zod";
import { buildDocBundle } from "../agents/executor.js";
import { emit } from "../tracer.js";
const InputSchema = z.object({
    schemeIds: z.array(z.string()).min(1),
    studentId: z.string(),
});
export const generateDocBundle = {
    definition: {
        name: "generate_doc_bundle",
        description: "Runs the executor agent to build a document checklist for selected schemes. Returns the bundle data.",
        inputSchema: InputSchema,
    },
    handler: async (input) => {
        emit("tool_call", {
            tool: "generate_doc_bundle",
            status: "started",
            schemeIds: input.schemeIds,
        });
        const bundle = buildDocBundle(input.schemeIds, input.studentId);
        emit("agent_step", {
            agent: "executor",
            documentsRequired: bundle.documents.length,
        });
        emit("tool_call", {
            tool: "generate_doc_bundle",
            status: "completed",
            documentsReady: bundle.documents.length,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(bundle),
                },
            ],
            structuredContent: bundle,
        };
    },
};
//# sourceMappingURL=generateDocBundle.js.map