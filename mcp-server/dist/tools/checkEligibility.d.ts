import { z } from "zod";
declare const InputSchema: z.ZodObject<{
    schemeId: z.ZodString;
    profile: z.ZodObject<{
        state: z.ZodString;
        category: z.ZodString;
        annualIncome: z.ZodNumber;
        courseLevel: z.ZodEnum<["10th", "12th", "UG", "PG", "PhD"]>;
        percentage: z.ZodNumber;
        gender: z.ZodEnum<["male", "female", "other"]>;
        disability: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability: boolean;
    }, {
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    profile: {
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability: boolean;
    };
    schemeId: string;
}, {
    profile: {
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability: boolean;
    };
    schemeId: string;
}>;
export declare const checkEligibility: {
    definition: {
        name: string;
        description: string;
        inputSchema: z.ZodObject<{
            schemeId: z.ZodString;
            profile: z.ZodObject<{
                state: z.ZodString;
                category: z.ZodString;
                annualIncome: z.ZodNumber;
                courseLevel: z.ZodEnum<["10th", "12th", "UG", "PG", "PhD"]>;
                percentage: z.ZodNumber;
                gender: z.ZodEnum<["male", "female", "other"]>;
                disability: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability: boolean;
            }, {
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            profile: {
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability: boolean;
            };
            schemeId: string;
        }, {
            profile: {
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability: boolean;
            };
            schemeId: string;
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
