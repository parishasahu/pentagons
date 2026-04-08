import schemes from "../data/schemes.json" with { type: "json" };

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

export function discoverSchemes(profile: Profile): Scheme[] {
  return (schemes as Scheme[]).filter((scheme) => {
    const r = scheme.rules;
    if (r.maxIncome !== undefined && profile.annualIncome > r.maxIncome) return false;
    if (r.categories?.length && !r.categories.includes(profile.category)) return false;
    if (r.states?.length && !r.states.includes(profile.state)) return false;
    if (r.courseLevels?.length && !r.courseLevels.includes(profile.courseLevel)) return false;
    if (r.minPercentage !== undefined && profile.percentage < r.minPercentage) return false;
    if (r.genderOnly && r.genderOnly !== profile.gender) return false;
    if (r.pwdOnly && !profile.disability) return false;
    return true;
  });
}

/**
 * Reflection loop — if strict filter returns zero schemes, broadens the income
 * criterion and retries once, emitting an `agent_thought` trace event so the
 * frontend AgentTrace panel can visualise the "coordinated interaction" cycle.
 */
export function discoverSchemesWithRetry(
  profile: Profile,
  emitFn: (type: string, data: Record<string, unknown>) => void
): { schemes: Scheme[]; retried: boolean } {
  let results = discoverSchemes(profile);
  let retried = false;

  if (results.length === 0) {
    emitFn("agent_thought", {
      agent: "discover",
      text: "No exact match — broadening income criteria",
      originalIncome: profile.annualIncome,
    });
    // Retry without the income cap by setting annualIncome to 0 so all
    // maxIncome checks pass (every scheme's limit is ≥ 0).
    results = discoverSchemes({ ...profile, annualIncome: 0 });
    retried = true;
  }

  return { schemes: results, retried };
}
