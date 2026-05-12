// lib/audit/engine.ts

// lib/audit/engine.ts
// Verified against PRICING_DATA.md — May 10, 2026

export type Severity = "high" | "medium" | "low" | "optimal" | "info";

export interface ToolFinding {
  toolName: string;
  plan: string;
  currentSpend: number;
  inferredSpend: number; // what we calculated from seats × official price
  recommendedAction: string;
  estimatedMonthlySaving: number;
  severity: Severity;
  reason: string;
  tags: string[]; // e.g. ["unused-seats", "wrong-plan", "redundant"]
}

export interface AuditResult {
  findings: ToolFinding[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  totalCurrentSpend: number;
  isHighSavings: boolean;
  overallStatus: "overspending" | "optimized" | "mixed";
  summary: string; // one-line human summary
}

// ─────────────────────────────────────────────
// OFFICIAL PRICES PER SEAT/MONTH (USD)
// Source: PRICING_DATA.md, verified May 10 2026
// 0 = free or usage-based (no fixed seat price)
// ─────────────────────────────────────────────
const OFFICIAL_PRICES: Record<string, Record<string, number>> = {
  Cursor: {
    Hobby: 0,
    Pro: 20,
    Business: 40,
    Enterprise: 0, // custom — usage-based
  },
  "GitHub Copilot": {
    Free: 0,
    "Pro (Individual)": 10,
    "Pro+ (Individual)": 39,
    Business: 19,
    Enterprise: 39,
  },
  Claude: {
    Free: 0,
    Pro: 20,
    "Max 5x": 100,
    "Max 20x": 200,
    Team: 25,
    Enterprise: 0, // custom
    "API Direct": 0, // usage-based
  },
  ChatGPT: {
    Free: 0,
    Plus: 20,
    Pro: 200,
    Business: 20, // per seat, annual
    Enterprise: 0, // custom
    "API Direct": 0, // usage-based
  },
  "Anthropic API": {
    "API Direct": 0, // usage-based per token
  },
  "OpenAI API": {
    "API Direct": 0, // usage-based per token
  },
  Gemini: {
    Free: 0,
    "Google AI Plus": 7.99,
    "Google AI Pro": 19.99,
    "Google AI Ultra": 249.99,
    "API Direct": 0,
  },
  Windsurf: {
    Free: 0,
    Pro: 15,
    "Pro Plus": 35,
    Teams: 25,
    Enterprise: 0,
  },
};

// ─────────────────────────────────────────────
// PLAN TIER ORDERING — higher index = more expensive
// Used to detect: "paying for Enterprise but only using Basic features"
// ─────────────────────────────────────────────
const PLAN_TIERS: Record<string, string[]> = {
  Cursor: ["Hobby", "Pro", "Business", "Enterprise"],
  "GitHub Copilot": ["Free", "Pro (Individual)", "Pro+ (Individual)", "Business", "Enterprise"],
  Claude: ["Free", "Pro", "Max 5x", "Max 20x", "Team", "Enterprise", "API Direct"],
  ChatGPT: ["Free", "Plus", "Business", "Pro", "Enterprise", "API Direct"],
  "Anthropic API": ["API Direct"],
  "OpenAI API": ["API Direct"],
  Gemini: ["Free", "Google AI Plus", "Google AI Pro", "Google AI Ultra", "API Direct"],
  Windsurf: ["Free", "Pro", "Pro Plus", "Teams", "Enterprise"],
};

// Features that justify Enterprise / top-tier plans
const ENTERPRISE_JUSTIFIED_FEATURES = ["agents", "api-calls"];
const ENTERPRISE_JUSTIFIED_USES = ["Data Analysis", "Research", "Mixed"];

// Features where basic/mid plans are 100% sufficient
const BASIC_SUFFICIENT_FEATURES = ["chat", "docs", "review"];
const CODING_FEATURES = ["autocomplete", "agents", "api-calls"];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface ToolInput {
  name: string;
  plan: string;
  seats: number;
  activeUsers: number;
  monthlySpend: number;
  billingCycle: "monthly" | "annual";
  contractStatus:
    | "month-to-month"
    | "in-annual-contract"
    | "contract-ending-soon";
  primaryFeatureUsed: string;
  intensity: string; // "Low" | "Medium" | "High"
  usage: string; // "Coding" | "Writing" | "Research" | "Data Analysis" | "Customer Support" | "Mixed"
}

interface FormInput {
  teamSize: number;
  techTeamSize: number;
  primaryUseCase: string;
  hasApiUsage: boolean;
  tools: ToolInput[];
}

// ─────────────────────────────────────────────
// SANITIZE — handle missing / zero / NaN inputs
// ─────────────────────────────────────────────
function sanitizeTool(raw: ToolInput): ToolInput {
  const officialPrice =
    OFFICIAL_PRICES[raw.name]?.[raw.plan] ?? undefined;

  const seats = Math.max(1, Number(raw.seats) || 1);
  const activeUsers = Math.min(
    seats,
    Math.max(1, Number(raw.activeUsers) || 1)
  );

  // If monthlySpend is 0 or missing, infer from official price × seats
  let monthlySpend = Number(raw.monthlySpend) || 0;
  if (monthlySpend === 0 && officialPrice !== undefined && officialPrice > 0) {
    monthlySpend = officialPrice * seats;
  }

  return {
    ...raw,
    seats,
    activeUsers,
    monthlySpend,
    intensity: raw.intensity || "Medium",
    usage: raw.usage || "Mixed",
    primaryFeatureUsed: raw.primaryFeatureUsed || "chat",
    billingCycle: raw.billingCycle || "monthly",
    contractStatus: raw.contractStatus || "month-to-month",
  };
}

// ─────────────────────────────────────────────
// PLAN INFERENCE
// If user says Enterprise but pays $20, infer the real plan from spend
// ─────────────────────────────────────────────
function inferActualPlan(tool: ToolInput): string {
  const spendPerSeat =
    tool.seats > 0 ? tool.monthlySpend / tool.seats : tool.monthlySpend;
  const prices = OFFICIAL_PRICES[tool.name];
  if (!prices) return tool.plan;

  // If user selected Enterprise but spend is clearly at a lower tier
  if (tool.plan === "Enterprise" || tool.plan === "Business") {
    // Find the plan whose price is closest to what they're actually paying per seat
    let closestPlan = tool.plan;
    let closestDiff = Infinity;
    for (const [plan, price] of Object.entries(prices)) {
      if (price === 0) continue;
      const diff = Math.abs(price - spendPerSeat);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPlan = plan;
      }
    }
    // Only override if the spend is dramatically different (>30% off)
    if (
      closestPlan !== tool.plan &&
      closestDiff < spendPerSeat * 0.3 &&
      tool.plan !== closestPlan
    ) {
      return closestPlan;
    }
  }

  return tool.plan;
}

// ─────────────────────────────────────────────
// MAIN ENGINE
// ─────────────────────────────────────────────
export function runAuditEngine(input: FormInput): AuditResult {
  const sanitizedTools = input.tools.map(sanitizeTool);
  const sanitizedInput: FormInput = { ...input, tools: sanitizedTools };

  const findings: ToolFinding[] = [];

  for (const tool of sanitizedTools) {
    const finding = analyzeTool(tool, sanitizedInput);
    findings.push(finding);
  }

  // Cross-tool redundancy — runs after per-tool analysis
  const crossFindings = checkCrossToolRedundancy(
    sanitizedTools,
    input.hasApiUsage
  );

  // Merge: only upgrade severity if cross-finding is worse
  for (const cf of crossFindings) {
    const existing = findings.find((f) => f.toolName === cf.toolName);
    if (!existing) {
      findings.push(cf);
    } else if (cf.estimatedMonthlySaving > existing.estimatedMonthlySaving) {
      existing.recommendedAction = cf.recommendedAction;
      existing.estimatedMonthlySaving = cf.estimatedMonthlySaving;
      existing.reason = cf.reason;
      existing.severity = cf.severity;
      existing.tags = [...new Set([...existing.tags, ...cf.tags])];
    }
  }

  const totalCurrentSpend = sanitizedTools.reduce(
    (sum, t) => sum + t.monthlySpend,
    0
  );
  const totalMonthlySavings = findings.reduce(
    (sum, f) => sum + f.estimatedMonthlySaving,
    0
  );
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isHighSavings = totalMonthlySavings > 500;

  const optimalCount = findings.filter((f) => f.severity === "optimal").length;
  const highCount = findings.filter((f) => f.severity === "high").length;

  const overallStatus =
    optimalCount === findings.length
      ? "optimized"
      : highCount > 0
      ? "overspending"
      : "mixed";

  const summary = buildSummary(
    overallStatus,
    totalMonthlySavings,
    findings,
    input
  );

  return {
    findings,
    totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    totalAnnualSavings: Math.round(totalAnnualSavings * 100) / 100,
    totalCurrentSpend: Math.round(totalCurrentSpend * 100) / 100,
    isHighSavings,
    overallStatus,
    summary,
  };
}

// ─────────────────────────────────────────────
// PER-TOOL ANALYSIS — ordered checks, first match wins
// ─────────────────────────────────────────────
function analyzeTool(tool: ToolInput, context: FormInput): ToolFinding {
  const officialPricePerSeat = OFFICIAL_PRICES[tool.name]?.[tool.plan] ?? 0;
  const inferredPlan = inferActualPlan(tool);
  const inferredPrice =
    OFFICIAL_PRICES[tool.name]?.[inferredPlan] ?? officialPricePerSeat;
  const inferredSpend = inferredPrice * tool.seats;

  // ── Check 0: Plan mismatch — user says Enterprise but pays Pro price ──
  if (
    inferredPlan !== tool.plan &&
    officialPricePerSeat === 0 &&
    tool.monthlySpend > 0
  ) {
    const saving = tool.monthlySpend - inferredSpend;
    if (saving > 0) {
      return {
        toolName: tool.name,
        plan: tool.plan,
        currentSpend: tool.monthlySpend,
        inferredSpend,
        recommendedAction: `Your spend ($${tool.monthlySpend}/mo) matches ${tool.name} ${inferredPlan} pricing, not ${tool.plan} — verify your actual plan`,
        estimatedMonthlySaving: Math.round(saving),
        severity: "medium",
        reason: `You selected ${tool.plan} but your reported spend of $${tool.monthlySpend} for ${tool.seats} seat${tool.seats > 1 ? "s" : ""} aligns with the ${inferredPlan} tier ($${inferredPrice}/seat). You may be on a lower plan than selected, or overpaying for ${tool.plan}.`,
        tags: ["plan-mismatch"],
      };
    }
  }

  // ── Check 1: Free plan but paying money ──
  if (officialPricePerSeat === 0 && tool.monthlySpend > 5 && tool.plan !== "API Direct" && tool.plan !== "Enterprise" && tool.plan !== "Custom") {
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      inferredSpend: 0,
      recommendedAction: `Investigate — ${tool.name} ${tool.plan} is free but you're reporting $${tool.monthlySpend}/mo`,
      estimatedMonthlySaving: tool.monthlySpend,
      severity: tool.monthlySpend > 50 ? "high" : "medium",
      reason: `${tool.name} ${tool.plan} has no official seat fee. Your $${tool.monthlySpend}/mo could be a billing error, a duplicate account, or unchecked usage-based overage charges.`,
      tags: ["billing-error", "investigate"],
    };
  }

  // ── Check 2: Enterprise/custom plan — analyze by spend + use case ──
  if (
    (tool.plan === "Enterprise" || tool.plan === "Custom") &&
    officialPricePerSeat === 0
  ) {
    return analyzeEnterprisePlan(tool, context);
  }

  // ── Check 3: Overpaying vs official seat × price ──
  if (officialPricePerSeat > 0 && tool.monthlySpend > inferredSpend * 1.1) {
    const saving = Math.round(tool.monthlySpend - inferredSpend);
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      inferredSpend,
      recommendedAction: `Billing check — ${tool.seats} seats × $${officialPricePerSeat} = $${inferredSpend}/mo, but you're paying $${tool.monthlySpend}/mo`,
      estimatedMonthlySaving: saving,
      severity: saving > 100 ? "high" : "medium",
      reason: `At the official ${tool.plan} rate of $${officialPricePerSeat}/seat, ${tool.seats} seats should cost $${inferredSpend}/mo. You're paying $${tool.monthlySpend}/mo — a $${saving}/mo discrepancy. Check for duplicate accounts, ghost seats, or billing errors.`,
      tags: ["billing-error", "overpaying"],
    };
  }

  // ── Check 4: Unused seats ──
  const unusedSeats = tool.seats - tool.activeUsers;
  if (unusedSeats > 0 && officialPricePerSeat > 0) {
    const wasted = Math.round(unusedSeats * officialPricePerSeat);
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      inferredSpend,
      recommendedAction: `Remove ${unusedSeats} unused seat${unusedSeats > 1 ? "s" : ""} → save $${wasted}/mo`,
      estimatedMonthlySaving: wasted,
      severity: wasted > 100 ? "high" : "medium",
      reason: `${tool.seats} seats paid, ${tool.activeUsers} active. ${unusedSeats} idle seat${unusedSeats > 1 ? "s" : ""} × $${officialPricePerSeat}/seat = $${wasted}/mo with zero return. Remove or reassign them before the next billing cycle.`,
      tags: ["unused-seats"],
    };
  }

  // ── Check 5: Wrong plan for feature used ──
  const wrongPlan = checkWrongPlanForFeature(tool, context);
  if (wrongPlan) return wrongPlan;

  // ── Check 6: Wrong plan for team size ──
  const wrongSize = checkWrongPlanForTeamSize(tool, context);
  if (wrongSize) return wrongSize;

  // ── Check 7: Wrong plan for intensity ──
  const wrongIntensity = checkWrongPlanForIntensity(tool);
  if (wrongIntensity) return wrongIntensity;

  // ── Check 8: Annual billing opportunity ──
  if (
    tool.billingCycle === "monthly" &&
    tool.contractStatus === "month-to-month" &&
    officialPricePerSeat > 0 &&
    tool.monthlySpend > 0
  ) {
    const annualSaving = Math.round(tool.monthlySpend * 0.17);
    if (annualSaving >= 5) {
      return {
        toolName: tool.name,
        plan: tool.plan,
        currentSpend: tool.monthlySpend,
        inferredSpend,
        recommendedAction: `Switch to annual billing → save ~$${annualSaving}/mo ($${annualSaving * 12}/yr)`,
        estimatedMonthlySaving: annualSaving,
        severity: "low",
        reason: `You're on monthly billing for ${tool.name} ${tool.plan} at $${tool.monthlySpend}/mo. Annual billing typically saves 17–20%. That's ~$${annualSaving}/mo or $${annualSaving * 12}/yr — with no change to features.`,
        tags: ["billing-cycle"],
      };
    }
  }

  // ── Check 9: Contract ending soon — act now ──
  if (tool.contractStatus === "contract-ending-soon" && tool.monthlySpend > 0) {
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      inferredSpend,
      recommendedAction: `Your ${tool.name} contract ends soon — evaluate before auto-renewal`,
      estimatedMonthlySaving: 0,
      severity: "info",
      reason: `Your ${tool.name} ${tool.plan} annual contract is ending soon. This is the right time to negotiate better pricing, right-size seats, or switch plans. Renewing without review often locks you into another year at the same rate.`,
      tags: ["contract-renewal"],
    };
  }

  // ── All good ──
  return {
    toolName: tool.name,
    plan: tool.plan,
    currentSpend: tool.monthlySpend,
    inferredSpend,
    recommendedAction: "Spend is optimized — no changes needed",
    estimatedMonthlySaving: 0,
    severity: "optimal",
    reason: `${tool.name} ${tool.plan} is well-matched: ${tool.activeUsers} active user${tool.activeUsers > 1 ? "s" : ""} on a ${tool.intensity.toLowerCase()}-intensity ${tool.usage.toLowerCase()} workflow. Pricing is in line with official rates.`,
    tags: ["optimal"],
  };
}

// ─────────────────────────────────────────────
// ENTERPRISE PLAN ANALYSIS
// When price is $0 (custom), analyze by spend + use case + team size
// ─────────────────────────────────────────────
function analyzeEnterprisePlan(
  tool: ToolInput,
  context: FormInput
): ToolFinding {
  const isJustifiedByFeature = ENTERPRISE_JUSTIFIED_FEATURES.includes(
    tool.primaryFeatureUsed
  );
  const isJustifiedByUse = ENTERPRISE_JUSTIFIED_USES.includes(tool.usage);
  const isJustifiedByTeam = tool.seats >= 25;
  const isJustifiedByCompliance =
    context.teamSize >= 50 ||
    ["Customer Support", "Data Analysis"].includes(tool.usage);

  const justified =
    isJustifiedByFeature ||
    isJustifiedByUse ||
    isJustifiedByTeam ||
    isJustifiedByCompliance;

  // Enterprise plan for very small team using basic features
  if (!justified && tool.seats < 10 && BASIC_SUFFICIENT_FEATURES.includes(tool.primaryFeatureUsed)) {
    // Suggest the mid-tier alternative
    const midTierMap: Record<string, { plan: string; price: number }> = {
      Cursor: { plan: "Business", price: 40 },
      "GitHub Copilot": { plan: "Business", price: 19 },
      Claude: { plan: "Team", price: 25 },
      ChatGPT: { plan: "Business", price: 20 },
      Windsurf: { plan: "Teams", price: 25 },
    };
    const midTier = midTierMap[tool.name];
    const estimatedEnterpriseCost = tool.monthlySpend || tool.seats * 60; // estimate if not given
    const midTierCost = midTier ? midTier.price * tool.seats : estimatedEnterpriseCost * 0.5;
    const saving = Math.max(0, Math.round(estimatedEnterpriseCost - midTierCost));

    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      inferredSpend: midTierCost,
      recommendedAction: midTier
        ? `Downgrade to ${tool.name} ${midTier.plan} ($${midTier.price}/seat) → est. save $${saving}/mo`
        : `Enterprise is over-sized for ${tool.seats} seats doing ${tool.primaryFeatureUsed}`,
      estimatedMonthlySaving: saving,
      severity: saving > 200 ? "high" : "medium",
      reason: `${tool.name} Enterprise is designed for large orgs needing SSO, compliance, SLAs, and advanced admin controls. With ${tool.seats} seat${tool.seats > 1 ? "s" : ""} primarily using it for ${tool.primaryFeatureUsed}, a lower tier covers all real-world needs at significantly lower cost.`,
      tags: ["wrong-plan", "enterprise-overkill"],
    };
  }

  // Enterprise justified but spend per seat seems high
  if (tool.monthlySpend > 0) {
    const spendPerSeat = tool.monthlySpend / tool.seats;
    if (spendPerSeat > 80 && tool.seats < 50) {
      return {
        toolName: tool.name,
        plan: tool.plan,
        currentSpend: tool.monthlySpend,
        inferredSpend: tool.monthlySpend,
        recommendedAction: `$${Math.round(spendPerSeat)}/seat/mo on Enterprise — negotiate volume discount at renewal`,
        estimatedMonthlySaving: Math.round(tool.monthlySpend * 0.15), // 15% negotiation target
        severity: "low",
        reason: `Your ${tool.name} Enterprise cost is $${Math.round(spendPerSeat)}/seat/mo. Enterprise plans are negotiable — teams of ${tool.seats} should target 15–20% off at renewal by bundling seats or committing to multi-year. Est. saving: $${Math.round(tool.monthlySpend * 0.15)}/mo.`,
        tags: ["negotiation-opportunity"],
      };
    }

    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      inferredSpend: tool.monthlySpend,
      recommendedAction: "Enterprise plan is justified for your scale and use case",
      estimatedMonthlySaving: 0,
      severity: "optimal",
      reason: `${tool.name} Enterprise is appropriate: ${tool.seats} seats, ${tool.usage} use case, ${tool.primaryFeatureUsed} as primary feature. SSO, compliance controls, and SLAs are worth the premium at this scale.`,
      tags: ["optimal"],
    };
  }

  // No spend data for Enterprise — flag for review
  return {
    toolName: tool.name,
    plan: tool.plan,
    currentSpend: 0,
    inferredSpend: 0,
    recommendedAction: "Add your actual Enterprise spend to get a full audit",
    estimatedMonthlySaving: 0,
    severity: "info",
    reason: `${tool.name} Enterprise pricing is custom. We can't compute savings without your actual contract cost. Add your monthly spend and re-run the audit for specific recommendations.`,
    tags: ["missing-data"],
  };
}

// ─────────────────────────────────────────────
// WRONG PLAN FOR FEATURE USED
// ─────────────────────────────────────────────
function checkWrongPlanForFeature(
  tool: ToolInput,
  context: FormInput
): ToolFinding | null {
  const f = tool.primaryFeatureUsed;

  // Cursor: Business plan but only used for chat (not coding)
  if (
    tool.name === "Cursor" &&
    tool.plan === "Business" &&
    f === "chat" &&
    context.primaryUseCase !== "Coding"
  ) {
    const saving = (40 - 20) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 20 * tool.seats,
      recommendedAction: `Cursor Business for chat-only use → downgrade to Pro ($20/seat), save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "medium",
      reason: `Cursor Business ($40/seat) adds admin controls and SSO — valuable for large coding teams. You're using it primarily for chat in a non-coding context. Cursor Pro ($20/seat) has identical AI chat capability at half the price.`,
      tags: ["wrong-plan", "feature-mismatch"],
    };
  }

  // GitHub Copilot Pro+ for docs/review use (not coding)
  if (
    tool.name === "GitHub Copilot" &&
    tool.plan === "Pro+ (Individual)" &&
    BASIC_SUFFICIENT_FEATURES.includes(f)
  ) {
    const saving = 39 - 10;
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 10,
      recommendedAction: `Downgrade to Copilot Pro ($10/mo) for ${f} tasks → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "medium",
      reason: `GitHub Copilot Pro+ ($39/mo) unlocks premium model selection (GPT-4o, Claude) for complex coding tasks. For ${f} work, Copilot Pro ($10/mo) is sufficient and saves $${saving}/mo.`,
      tags: ["wrong-plan", "feature-mismatch"],
    };
  }

  // Claude Max 20x for docs/writing
  if (
    tool.name === "Claude" &&
    tool.plan === "Max 20x" &&
    ["docs", "review", "chat"].includes(f) &&
    tool.intensity !== "High"
  ) {
    const saving = (200 - 20) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 20 * tool.seats,
      recommendedAction: `Claude Max 20x for ${f} work → downgrade to Pro ($20/seat), save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "high",
      reason: `Claude Max 20x ($200/seat) provides 20× the usage limits of Pro — designed for users who constantly hit Claude's daily message limits. For ${f} at ${tool.intensity.toLowerCase()} intensity, Claude Pro ($20/seat) handles the workload and saves $${saving}/mo.`,
      tags: ["wrong-plan", "feature-mismatch"],
    };
  }

  // Claude Max 5x for low-intensity chat
  if (
    tool.name === "Claude" &&
    tool.plan === "Max 5x" &&
    ["chat", "docs"].includes(f) &&
    tool.intensity === "Low"
  ) {
    const saving = (100 - 20) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 20 * tool.seats,
      recommendedAction: `Downgrade to Claude Pro ($20/seat) → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "high",
      reason: `Claude Max 5x ($100/seat) is for users who regularly exhaust Claude Pro's daily limits. At low intensity ${f} usage, Pro ($20/seat) will not hit limits and saves $${saving}/mo per seat.`,
      tags: ["wrong-plan", "intensity-mismatch"],
    };
  }

  // ChatGPT Pro for non-heavy users
  if (
    tool.name === "ChatGPT" &&
    tool.plan === "Pro" &&
    tool.intensity !== "High"
  ) {
    const saving = 200 - 20;
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 20,
      recommendedAction: `Downgrade to ChatGPT Plus ($20/mo) → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "high",
      reason: `ChatGPT Pro ($200/mo) is designed for users who need unlimited GPT-5 access around the clock. At ${tool.intensity.toLowerCase()} intensity, Plus ($20/mo) covers 95% of use cases and saves $${saving}/mo.`,
      tags: ["wrong-plan", "intensity-mismatch"],
    };
  }

  // Gemini Ultra for anything except agents/deep research
  if (
    tool.name === "Gemini" &&
    tool.plan === "Google AI Ultra" &&
    !["agents", "api-calls"].includes(f) &&
    tool.intensity !== "High"
  ) {
    const saving = Math.round((249.99 - 19.99) * tool.seats);
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 19.99 * tool.seats,
      recommendedAction: `Downgrade to Google AI Pro ($19.99/mo) → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "high",
      reason: `Gemini Ultra ($249.99/mo) unlocks Deep Think reasoning and Veo 3.1 video generation — features for intensive research and media production. For ${f} at ${tool.intensity.toLowerCase()} intensity, Google AI Pro ($19.99/mo) gives the same Gemini 3.1 Pro model access.`,
      tags: ["wrong-plan", "feature-mismatch"],
    };
  }

  // Windsurf Pro Plus for low/medium non-coding use
  if (
    tool.name === "Windsurf" &&
    tool.plan === "Pro Plus" &&
    !CODING_FEATURES.includes(f) &&
    tool.intensity !== "High"
  ) {
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 15 * tool.seats,
      recommendedAction: `Downgrade to Windsurf Pro ($15/mo) → save $20/mo`,
      estimatedMonthlySaving: 20, severity: "low",
      reason: `Windsurf Pro Plus ($35/mo) gives priority model access for heavy coding use. For ${f} at ${tool.intensity.toLowerCase()} intensity, Windsurf Pro ($15/mo) provides the same core functionality at less than half the cost.`,
      tags: ["wrong-plan", "feature-mismatch"],
    };
  }

  return null;
}

// ─────────────────────────────────────────────
// WRONG PLAN FOR TEAM SIZE
// ─────────────────────────────────────────────
function checkWrongPlanForTeamSize(
  tool: ToolInput,
  context: FormInput
): ToolFinding | null {
  // GitHub Copilot Individual plans for 5+ tech team members
  if (
    tool.name === "GitHub Copilot" &&
    tool.plan === "Pro (Individual)" &&
    context.techTeamSize >= 5 &&
    tool.seats >= 5
  ) {
    const saving = (10 - 19) * tool.seats; // actually costs MORE per seat individually... no saving
    // Individual vs Business: Individual = $10, Business = $19 → Business costs more but includes org controls
    // But if team is 5+, suggest Business for management features, not cost
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 19 * tool.seats,
      recommendedAction: `With ${context.techTeamSize} devs, upgrade to Copilot Business ($19/seat) for centralized management`,
      estimatedMonthlySaving: 0, // costs more but prevents bigger problems
      severity: "info",
      reason: `GitHub Copilot Pro (Individual) works per-person but lacks admin controls, usage policies, and IP indemnity. With a team of ${context.techTeamSize}, Copilot Business ($19/seat) adds centralized billing, seat management, and legal protection — worth the $9/seat premium.`,
      tags: ["team-management", "upgrade-recommended"],
    };
  }

  // Cursor Pro for 10+ seat team (Business makes more sense for management)
  if (
    tool.name === "Cursor" &&
    tool.plan === "Pro" &&
    tool.seats >= 10
  ) {
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 40 * tool.seats,
      recommendedAction: `With ${tool.seats} seats, consider Cursor Business ($40/seat) for SSO and admin controls`,
      estimatedMonthlySaving: 0,
      severity: "info",
      reason: `Cursor Pro works for small teams but at ${tool.seats} seats, Cursor Business ($40/seat) adds SSO, centralized billing, and admin policy controls that pay for themselves in time saved on seat management.`,
      tags: ["team-management", "upgrade-recommended"],
    };
  }

  // Claude Team plan but fewer than 5 seats (minimum is 5)
  if (tool.name === "Claude" && tool.plan === "Team" && tool.seats < 5) {
    const saving = (25 - 20) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 20 * tool.seats,
      recommendedAction: `Claude Team requires 5+ seats minimum — with ${tool.seats} seats, switch to Pro ($20/seat) and save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "medium",
      reason: `Claude Team plan has a 5-seat minimum. With only ${tool.seats} seat${tool.seats > 1 ? "s" : ""}, you're either being billed incorrectly or paying for unused seats. Claude Pro ($20/seat) gives the same model access with no minimum.`,
      tags: ["plan-mismatch", "wrong-plan"],
    };
  }

  // ChatGPT Business for solo user (minimum is 2, and Plus is cheaper)
  if (
    tool.name === "ChatGPT" &&
    tool.plan === "Business" &&
    tool.seats === 1
  ) {
    const saving = 20 - 20; // same price, but Plus is monthly vs annual
    return {
      toolName: tool.name, plan: tool.plan,
      currentSpend: tool.monthlySpend, inferredSpend: 20,
      recommendedAction: `ChatGPT Business requires 2+ seats minimum — solo user should switch to Plus ($20/mo)`,
      estimatedMonthlySaving: 0,
      severity: "info",
      reason: `ChatGPT Business requires at least 2 users and annual billing. As a solo user, ChatGPT Plus ($20/mo) gives equivalent model access month-to-month without the annual commitment.`,
      tags: ["plan-mismatch"],
    };
  }

  return null;
}

// ─────────────────────────────────────────────
// WRONG PLAN FOR INTENSITY
// ─────────────────────────────────────────────
function checkWrongPlanForIntensity(tool: ToolInput): ToolFinding | null {
  // Low intensity on any paid plan — check if free tier is viable
  if (tool.intensity === "Low" && tool.monthlySpend > 0) {
    const freePlans: Record<string, string> = {
      "GitHub Copilot": "Free (2,000 completions/month)",
      Cursor: "Hobby (free with basic access)",
      Gemini: "Free tier",
      Windsurf: "Free (25 credits/month)",
      ChatGPT: "Free tier",
      Claude: "Free tier",
    };

    const freePlan = freePlans[tool.name];
    if (freePlan && tool.plan !== "Free" && tool.plan !== "Hobby") {
      // Only flag if it's a single-seat low-intensity use
      if (tool.seats === 1 && tool.monthlySpend <= 25) {
        return {
          toolName: tool.name, plan: tool.plan,
          currentSpend: tool.monthlySpend, inferredSpend: 0,
          recommendedAction: `Low intensity solo use — try ${freePlan} before paying`,
          estimatedMonthlySaving: tool.monthlySpend,
          severity: "low",
          reason: `You're paying $${tool.monthlySpend}/mo for ${tool.name} at low intensity with 1 seat. ${freePlan} may cover your needs. Test for one month before renewing.`,
          tags: ["low-intensity", "free-tier-viable"],
        };
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// CROSS-TOOL REDUNDANCY
// ─────────────────────────────────────────────
function checkCrossToolRedundancy(
  tools: ToolInput[],
  hasApiUsage: boolean
): ToolFinding[] {
  const findings: ToolFinding[] = [];
  const toolNames = tools.map((t) => t.name);

  // Claude subscription + Anthropic API direct
  if (
    toolNames.includes("Claude") &&
    toolNames.includes("Anthropic API") &&
    hasApiUsage
  ) {
    const sub = tools.find((t) => t.name === "Claude")!;
    findings.push({
      toolName: "Claude", plan: sub.plan, currentSpend: sub.monthlySpend,
      inferredSpend: sub.monthlySpend,
      recommendedAction: "Claude subscription + Anthropic API — consolidate to one billing method",
      estimatedMonthlySaving: sub.monthlySpend,
      severity: "high",
      reason: `Claude.ai subscription ($${sub.monthlySpend}/mo) and Anthropic API are completely separate billing systems. Teams building with the API directly do not need the UI subscription — API-only is typically more cost-efficient for engineering teams.`,
      tags: ["redundant", "double-billing"],
    });
  }

  // ChatGPT subscription + OpenAI API direct
  if (
    toolNames.includes("ChatGPT") &&
    toolNames.includes("OpenAI API") &&
    hasApiUsage
  ) {
    const sub = tools.find((t) => t.name === "ChatGPT")!;
    findings.push({
      toolName: "ChatGPT", plan: sub.plan, currentSpend: sub.monthlySpend,
      inferredSpend: sub.monthlySpend,
      recommendedAction: "ChatGPT subscription + OpenAI API — pick one, do not pay for both",
      estimatedMonthlySaving: sub.monthlySpend,
      severity: "medium",
      reason: `You're paying for a ChatGPT subscription ($${sub.monthlySpend}/mo) and OpenAI API separately. Developers using the API directly rarely need the ChatGPT UI subscription — consolidating to API-only removes the duplicate cost.`,
      tags: ["redundant", "double-billing"],
    });
  }

  // Cursor + Windsurf — two AI coding editors
  if (toolNames.includes("Cursor") && toolNames.includes("Windsurf")) {
    const cursor = tools.find((t) => t.name === "Cursor")!;
    const windsurf = tools.find((t) => t.name === "Windsurf")!;
    const cheaperTool = cursor.monthlySpend <= windsurf.monthlySpend ? cursor : windsurf;
    const expensiveTool = cheaperTool === cursor ? windsurf : cursor;
    findings.push({
      toolName: expensiveTool.name, plan: expensiveTool.plan,
      currentSpend: expensiveTool.monthlySpend, inferredSpend: 0,
      recommendedAction: `Running Cursor + Windsurf simultaneously — cancel the less-used one, save $${expensiveTool.monthlySpend}/mo`,
      estimatedMonthlySaving: expensiveTool.monthlySpend,
      severity: "medium",
      reason: `Cursor and Windsurf are nearly identical AI code editors. Running both is paying twice for the same capability. Pick the one your team actually lives in — the other is dead weight.`,
      tags: ["redundant", "duplicate-tools"],
    });
  }

  // Claude + ChatGPT — both general AI assistants with similar capability
  if (
    toolNames.includes("Claude") &&
    toolNames.includes("ChatGPT") &&
    tools.filter((t) => t.name === "Claude" || t.name === "ChatGPT")
         .every((t) => ["chat", "docs", "writing"].includes(t.primaryFeatureUsed))
  ) {
    const claudeTool = tools.find((t) => t.name === "Claude")!;
    const chatTool = tools.find((t) => t.name === "ChatGPT")!;
    const pricier = claudeTool.monthlySpend >= chatTool.monthlySpend ? claudeTool : chatTool;
    findings.push({
      toolName: pricier.name, plan: pricier.plan,
      currentSpend: pricier.monthlySpend, inferredSpend: 0,
      recommendedAction: `Both Claude and ChatGPT used for ${pricier.primaryFeatureUsed} — consolidate to one to save $${pricier.monthlySpend}/mo`,
      estimatedMonthlySaving: pricier.monthlySpend,
      severity: "medium",
      reason: `Claude and ChatGPT have highly overlapping capabilities for ${pricier.primaryFeatureUsed}. Running both for the same use case is redundant. Pick one based on team preference — the other is an unnecessary cost.`,
      tags: ["redundant", "duplicate-tools"],
    });
  }

  // GitHub Copilot + Cursor both for coding (potential overlap)
  if (
    toolNames.includes("GitHub Copilot") &&
    toolNames.includes("Cursor")
  ) {
    const copilot = tools.find((t) => t.name === "GitHub Copilot")!;
    const cursor = tools.find((t) => t.name === "Cursor")!;

    // Both doing autocomplete — significant overlap
    if (
      copilot.primaryFeatureUsed === "autocomplete" &&
      cursor.primaryFeatureUsed === "autocomplete"
    ) {
      const cheaper = copilot.monthlySpend <= cursor.monthlySpend ? copilot : cursor;
      findings.push({
        toolName: cheaper.name, plan: cheaper.plan,
        currentSpend: cheaper.monthlySpend, inferredSpend: 0,
        recommendedAction: `Copilot + Cursor both used for autocomplete — consider dropping one to save $${cheaper.monthlySpend}/mo`,
        estimatedMonthlySaving: cheaper.monthlySpend,
        severity: "low",
        reason: `GitHub Copilot and Cursor both provide AI autocomplete in the editor. While different in approach, using both for autocomplete is largely redundant. Many teams pick one; Cursor's broader AI capabilities often make it the winner if budget is tight.`,
        tags: ["partial-redundancy", "evaluate"],
      });
    }
  }

  return findings;
}

// ─────────────────────────────────────────────
// SUMMARY BUILDER
// ─────────────────────────────────────────────
function buildSummary(
  status: string,
  totalSavings: number,
  findings: ToolFinding[],
  input: FormInput
): string {
  const highFindings = findings.filter((f) => f.severity === "high");
  const toolCount = input.tools.length;

  if (status === "optimized") {
    return `Your ${toolCount} AI tool${toolCount > 1 ? "s" : ""} are well-optimized. No significant savings identified — you're spending efficiently.`;
  }

  if (totalSavings > 1000) {
    return `Critical: ${highFindings.length} major overspend${highFindings.length > 1 ? "s" : ""} found across your ${toolCount} tools. You could save $${Math.round(totalSavings)}/mo ($${Math.round(totalSavings * 12)}/yr) with the recommended changes.`;
  }

  if (totalSavings > 200) {
    return `${highFindings.length > 0 ? `${highFindings.length} high-priority issue${highFindings.length > 1 ? "s" : ""} found. ` : ""}Estimated savings of $${Math.round(totalSavings)}/mo ($${Math.round(totalSavings * 12)}/yr) across your ${toolCount} AI tools.`;
  }

  return `Minor optimizations available across your ${toolCount} AI tool${toolCount > 1 ? "s" : ""}. Estimated $${Math.round(totalSavings)}/mo in potential savings.`;
}