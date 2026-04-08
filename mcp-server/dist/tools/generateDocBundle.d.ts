import { z } from "zod";
declare const InputSchema: z.ZodObject<{
    schemeIds: z.ZodArray<z.ZodString, "many">;
    studentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schemeIds: string[];
    studentId: string;
}, {
    schemeIds: string[];
    studentId: string;
}>;
export declare const generateDocBundle: {
    definition: {
        name: string;
        description: string;
        inputSchema: z.ZodObject<{
            schemeIds: z.ZodArray<z.ZodString, "many">;
            studentId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            schemeIds: string[];
            studentId: string;
        }, {
            schemeIds: string[];
            studentId: string;
        }>;
    };
    handler: (input: z.infer<typeof InputSchema>) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
        structuredContent: Record<string, unknown>;
    }>;
};
export {};
