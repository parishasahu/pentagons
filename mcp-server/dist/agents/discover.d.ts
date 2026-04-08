export interface Scheme {
    id: string;
    name: string;
    type: string;
    ministry: string;
    amount: string;
    description: string;
    rules: {
        maxIncome?: number;
        categories?: string[];
        states?: string[];
        courseLevels?: string[];
        minPercentage?: number;
        genderOnly?: string;
        pwdOnly?: boolean;
    };
}
export interface Profile {
    state: string;
    category: string;
    annualIncome: number;
    courseLevel: string;
    percentage: number;
    gender: string;
    disability: boolean;
}
export declare function discoverSchemes(profile: Profile): Scheme[];
/**
 * Reflection loop — if strict filter returns zero schemes, broadens the income
 * criterion and retries once, emitting an `agent_thought` trace event so the
 * frontend AgentTrace panel can visualise the "coordinated interaction" cycle.
 */
export declare function discoverSchemesWithRetry(profile: Profile, emitFn: (type: string, data: Record<string, unknown>) => void): {
    schemes: Scheme[];
    retried: boolean;
};
