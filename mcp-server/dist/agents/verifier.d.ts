interface Profile {
    state: string;
    category: string;
    annualIncome: number;
    courseLevel: string;
    percentage: number;
    gender: string;
    disability: boolean;
}
interface EligibilityResult {
    schemeId: string;
    eligible: boolean;
    reason: string;
    failedRules: string[];
}
export declare function verifyEligibility(schemeId: string, profile: Profile): EligibilityResult;
export {};
