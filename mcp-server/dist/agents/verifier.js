import schemes from "../data/schemes.json" with { type: "json" };
export function verifyEligibility(schemeId, profile) {
    const scheme = schemes.find((s) => s.id === schemeId);
    if (!scheme) {
        return { schemeId, eligible: false, reason: "Scheme not found", failedRules: ["scheme_not_found"] };
    }
    const r = scheme.rules;
    const failedRules = [];
    if (r.maxIncome !== undefined && profile.annualIncome > r.maxIncome)
        failedRules.push(`Income ₹${profile.annualIncome} exceeds limit ₹${r.maxIncome}`);
    if (r.categories?.length && !r.categories.includes(profile.category))
        failedRules.push(`Category '${profile.category}' not in [${r.categories.join(", ")}]`);
    if (r.states?.length && !r.states.includes(profile.state))
        failedRules.push(`State '${profile.state}' not covered`);
    if (r.courseLevels?.length && !r.courseLevels.includes(profile.courseLevel))
        failedRules.push(`Course level '${profile.courseLevel}' not eligible`);
    if (r.minPercentage !== undefined && profile.percentage < r.minPercentage)
        failedRules.push(`Percentage ${profile.percentage}% below minimum ${r.minPercentage}%`);
    if (r.genderOnly && r.genderOnly !== profile.gender)
        failedRules.push(`Scheme is ${r.genderOnly}-only`);
    if (r.pwdOnly && !profile.disability)
        failedRules.push("Scheme is for PwD students only");
    return {
        schemeId,
        eligible: failedRules.length === 0,
        reason: failedRules.length === 0 ? "All criteria met" : failedRules[0],
        failedRules,
    };
}
//# sourceMappingURL=verifier.js.map