import { z } from "zod";
import { emit } from "../tracer.js";
const InputSchema = z.object({
    trigger: z.literal("open_profile_form").default("open_profile_form"),
});
export const buildStudentProfile = {
    definition: {
        name: "build_student_profile",
        description: "Opens the student onboarding form (App 1) as an embedded MCP app resource. The user fills in personal, academic, and income details.",
        inputSchema: InputSchema,
    },
    handler: async (_input) => {
        emit("tool_call", { tool: "build_student_profile", status: "started" });
        emit("tool_call", { tool: "build_student_profile", status: "completed" });
        return {
            content: [
                {
                    type: "text",
                    text: "Student profile form opened. Waiting for user to fill and submit the form.",
                },
            ],
        };
    },
};
//# sourceMappingURL=buildStudentProfile.js.map