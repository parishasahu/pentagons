import { z } from "zod";
declare const InputSchema: z.ZodObject<{
    profile: z.ZodObject<{
        name: z.ZodString;
        state: z.ZodString;
        category: z.ZodString;
        annualIncome: z.ZodNumber;
        courseLevel: z.ZodEnum<["10th", "12th", "UG", "PG", "PhD"]>;
        percentage: z.ZodNumber;
        gender: z.ZodEnum<["male", "female", "other"]>;
        disability: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability: boolean;
    }, {
        name: string;
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    profile: {
        name: string;
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability: boolean;
    };
}, {
    profile: {
        name: string;
        state: string;
        category: string;
        annualIncome: number;
        courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
        percentage: number;
        gender: "female" | "male" | "other";
        disability?: boolean | undefined;
    };
}>;
export declare const fetchOpportunities: {
    definition: {
        name: string;
        description: string;
        inputSchema: z.ZodObject<{
            profile: z.ZodObject<{
                name: z.ZodString;
                state: z.ZodString;
                category: z.ZodString;
                annualIncome: z.ZodNumber;
                courseLevel: z.ZodEnum<["10th", "12th", "UG", "PG", "PhD"]>;
                percentage: z.ZodNumber;
                gender: z.ZodEnum<["male", "female", "other"]>;
                disability: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability: boolean;
            }, {
                name: string;
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability?: boolean | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            profile: {
                name: string;
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability: boolean;
            };
        }, {
            profile: {
                name: string;
                state: string;
                category: string;
                annualIncome: number;
                courseLevel: "10th" | "12th" | "UG" | "PG" | "PhD";
                percentage: number;
                gender: "female" | "male" | "other";
                disability?: boolean | undefined;
            };
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
