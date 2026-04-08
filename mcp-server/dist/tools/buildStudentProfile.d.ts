import { z } from "zod";
declare const InputSchema: z.ZodObject<{
    trigger: z.ZodDefault<z.ZodLiteral<"open_profile_form">>;
}, "strip", z.ZodTypeAny, {
    trigger: "open_profile_form";
}, {
    trigger?: "open_profile_form" | undefined;
}>;
export declare const buildStudentProfile: {
    definition: {
        name: string;
        description: string;
        inputSchema: z.ZodObject<{
            trigger: z.ZodDefault<z.ZodLiteral<"open_profile_form">>;
        }, "strip", z.ZodTypeAny, {
            trigger: "open_profile_form";
        }, {
            trigger?: "open_profile_form" | undefined;
        }>;
    };
    handler: (_input: z.infer<typeof InputSchema>) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
};
export {};
