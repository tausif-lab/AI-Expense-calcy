// lib/audit/engine.ts

export type Severity = "high" | "medium" | "low" | "optimal";

export interface ToolFinding {
  toolName: string;
  plan: string;
  currentSpend: number;
  recommendedAction: string;
  estimatedMonthlySaving: number;
  severity: Severity;
  reason: string;
}

export interface AuditResult {
  findings: ToolFinding[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isHighSavings: boolean; // true if > $500/mo savings
  overallStatus: "overspending" | "optimized" | "mixed";
}

// Official monthly prices per seat (from PRICING_DATA.md, verified May 10 2026)
const OFFICIAL_PRICES: Record<string, Record<string, number>> = {
  Cursor: { Hobby: 0, Pro: 20, Business: 40, Enterprise: 0 },
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
    Enterprise: 0,
    "API Direct": 0,
  },
  ChatGPT: {
    Free: 0,
    Plus: 20,
    Pro: 200,
    Business: 20,
    Enterprise: 0,
    "API Direct": 0,
  },
  "Anthropic API": { "API Direct": 0 },
  "OpenAI API": { "API Direct": 0 },
  Gemini: {
    Free: 0,
    "Google AI Plus": 7.99,
    "Google AI Pro": 19.99,
    "Google AI Ultra": 249.99,
    "API Direct": 0,
  },
  Windsurf: { Free: 0, Pro: 15, "Pro Plus": 35, Teams: 25, Enterprise: 0 },
};

interface ToolInput {
  name: string;
  plan: string;
  seats: number;
  activeUsers: number;
  monthlySpend: number;
  billingCycle: "monthly" | "annual";
  contractStatus: "month-to-month" | "in-annual-contract" | "contract-ending-soon";
  primaryFeatureUsed: string;
  intensity: string;
  usage: string;
}

interface FormInput {
  teamSize: number;
  techTeamSize: number;
  primaryUseCase: string;
  hasApiUsage: boolean;
  tools: ToolInput[];
}

export function runAuditEngine(input: FormInput): AuditResult {
  const findings: ToolFinding[] = [];

  for (const tool of input.tools) {
    const finding = analyzeTool(tool, input);
    findings.push(finding);
  }

  // Cross-tool redundancy check
  const crossFindings = checkCrossToolRedundancy(input.tools, input.hasApiUsage);
  // Merge cross findings into existing ones where toolName matches
  for (const cf of crossFindings) {
    const existing = findings.find((f) => f.toolName === cf.toolName);
    if (existing && cf.estimatedMonthlySaving > existing.estimatedMonthlySaving) {
      existing.recommendedAction = cf.recommendedAction;
      existing.estimatedMonthlySaving = cf.estimatedMonthlySaving;
      existing.reason = cf.reason;
      existing.severity = cf.severity;
    }
  }

  const totalMonthlySavings = findings.reduce(
    (sum, f) => sum + f.estimatedMonthlySaving,
    0
  );
  const totalAnnualSavings = totalMonthlySavings * 12;
  const isHighSavings = totalMonthlySavings > 500;

  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const optimalCount = findings.filter((f) => f.severity === "optimal").length;

  const overallStatus =
    optimalCount === findings.length
      ? "optimized"
      : highCount > 0
      ? "overspending"
      : mediumCount > 0
      ? "overspending"
      : "mixed";

  return { findings, totalMonthlySavings, totalAnnualSavings, isHighSavings, overallStatus };
}

function analyzeTool(tool: ToolInput, context: FormInput): ToolFinding {
  const officialPricePerSeat = OFFICIAL_PRICES[tool.name]?.[tool.plan] ?? 0;
  const expectedSpend = officialPricePerSeat * tool.seats;

  // --- Check 0: Paying money for a plan that should be free ---
  if (officialPricePerSeat === 0 && tool.monthlySpend > 0) {
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      recommendedAction: `Investigate billing — ${tool.name} ${tool.plan} plan is free but you're paying $${tool.monthlySpend}/mo`,
      estimatedMonthlySaving: tool.monthlySpend,
      severity: tool.monthlySpend > 50 ? "high" : "medium",
      reason: `The ${tool.name} ${tool.plan} plan has no official seat price (it's free or usage-based), yet you're reporting $${tool.monthlySpend}/mo in spend. This could be a billing error, an overcharge, or usage-based API costs that should be reviewed.`,
    };
  }

  // --- Check 1: Overpaying vs official price ---
  if (officialPricePerSeat > 0 && tool.monthlySpend > expectedSpend * 1.05) {
    const saving = tool.monthlySpend - expectedSpend;
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      recommendedAction: `Verify billing — you're paying $${tool.monthlySpend}/mo but ${tool.seats} × $${officialPricePerSeat} = $${expectedSpend}/mo`,
      estimatedMonthlySaving: saving,
      severity: saving > 100 ? "high" : "medium",
      reason: `Your reported spend ($${tool.monthlySpend}) exceeds the official ${tool.plan} rate of $${officialPricePerSeat}/seat × ${tool.seats} seats = $${expectedSpend}. Check for duplicate accounts or billing errors.`,
    };
  }

  // --- Check 2: Unused seats ---
  const unusedSeats = tool.seats - tool.activeUsers;
  if (unusedSeats > 0 && officialPricePerSeat > 0) {
    const wasted = unusedSeats * officialPricePerSeat;
    return {
      toolName: tool.name,
      plan: tool.plan,
      currentSpend: tool.monthlySpend,
      recommendedAction: `Remove ${unusedSeats} unused seat${unusedSeats > 1 ? "s" : ""} → save $${wasted}/mo`,
      estimatedMonthlySaving: wasted,
      severity: wasted > 100 ? "high" : "medium",
      reason: `You have ${tool.seats} seats but only ${tool.activeUsers} active users. ${unusedSeats} idle seat${unusedSeats > 1 ? "s" : ""} at $${officialPricePerSeat}/seat = $${wasted}/mo wasted.`,
    };
  }

  // --- Check 3: Annual billing opportunity ---
  if (
    tool.billingCycle === "monthly" &&
    tool.contractStatus === "month-to-month" &&
    officialPricePerSeat > 0
  ) {
    const annualSaving = Math.round(tool.monthlySpend * 0.17); // ~17% avg annual discount
    if (annualSaving > 10) {
      return {
        toolName: tool.name,
        plan: tool.plan,
        currentSpend: tool.monthlySpend,
        recommendedAction: `Switch to annual billing → save ~$${annualSaving}/mo ($${annualSaving * 12}/yr)`,
        estimatedMonthlySaving: annualSaving,
        severity: "low",
        reason: `Paying monthly on ${tool.name} ${tool.plan}. Annual billing typically saves 17–20%. At $${tool.monthlySpend}/mo, that's ~$${annualSaving}/mo or $${annualSaving * 12}/yr saved.`,
      };
    }
  }

  // --- Check 4: Downgrade opportunity (small teams on expensive plans) ---
  const downgrade = checkDowngrade(tool, context);
  if (downgrade) return downgrade;

  // --- Check 5: Wrong tool for use case ---
  const substitute = checkSubstitute(tool, context);
  if (substitute) return substitute;

  // --- All good ---
  return {
    toolName: tool.name,
    plan: tool.plan,
    currentSpend: tool.monthlySpend,
    recommendedAction: "No changes needed",
    estimatedMonthlySaving: 0,
    severity: "optimal",
    reason: `${tool.name} ${tool.plan} is appropriately sized for your ${tool.activeUsers} active user${tool.activeUsers > 1 ? "s" : ""} and ${tool.usage} use case.`,
  };
}

function checkDowngrade(tool: ToolInput, context: FormInput): ToolFinding | null {
  // GitHub Copilot: Enterprise for small team
  if (tool.name === "GitHub Copilot" && tool.plan === "Enterprise" && tool.seats < 50) {
    const saving = (39 - 19) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: `Downgrade to Business ($19/seat) → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "medium",
      reason: `GitHub Copilot Enterprise ($39/seat) is designed for 50+ seat orgs needing codebase indexing and fine-tuned models. With ${tool.seats} seats, Business ($19/seat) covers all practical needs and saves $${saving}/mo.`,
    };
  }

  // Claude Max for low intensity users
  if (tool.name === "Claude" && (tool.plan === "Max 5x" || tool.plan === "Max 20x") && tool.intensity === "Low") {
    const saving = tool.plan === "Max 20x" ? (200 - 20) * tool.seats : (100 - 20) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: `Downgrade to Claude Pro ($20/seat) for low-intensity users → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "high",
      reason: `Claude ${tool.plan} is for power users hitting Pro limits daily. With low usage intensity, Claude Pro ($20/seat) is sufficient and saves $${saving}/mo.`,
    };
  }

  // ChatGPT Pro ($200) for non-power-users
  if (tool.name === "ChatGPT" && tool.plan === "Pro" && tool.intensity !== "High" && tool.activeUsers <= 1) {
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: "Downgrade to ChatGPT Plus ($20/mo) → save $180/mo",
      estimatedMonthlySaving: 180, severity: "high",
      reason: `ChatGPT Pro ($200/mo) is for unlimited heavy usage. For ${tool.intensity.toLowerCase()} intensity, Plus ($20/mo) handles 90% of tasks and saves $180/mo.`,
    };
  }

  // Cursor Business for solo/2-person teams
  if (tool.name === "Cursor" && tool.plan === "Business" && tool.seats <= 2) {
    const saving = (40 - 20) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: `Downgrade to Cursor Pro ($20/seat) → save $${saving}/mo`,
      estimatedMonthlySaving: saving, severity: "medium",
      reason: `Cursor Business adds SSO and centralized billing — useful for 5+ person teams. With ${tool.seats} seat${tool.seats > 1 ? "s" : ""}, Cursor Pro covers all AI features and saves $${saving}/mo.`,
    };
  }

  // Gemini Ultra for non-video/research use cases
  if (tool.name === "Gemini" && tool.plan === "Google AI Ultra" && tool.primaryFeatureUsed !== "agents") {
    const saving = (249.99 - 19.99) * tool.seats;
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: `Downgrade to Google AI Pro ($19.99/mo) → save $${Math.round(saving)}/mo`,
      estimatedMonthlySaving: Math.round(saving), severity: "high",
      reason: `Gemini Ultra ($249.99/mo) is primarily for advanced video generation (Veo 3.1) and Deep Think. For ${tool.primaryFeatureUsed} usage, Google AI Pro ($19.99/mo) provides the same Gemini 3.1 Pro model access.`,
    };
  }

  return null;
}

function checkSubstitute(tool: ToolInput, context: FormInput): ToolFinding | null {
  // Windsurf Pro Plus when Windsurf Pro suffices
  if (tool.name === "Windsurf" && tool.plan === "Pro Plus" && tool.intensity !== "High") {
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: "Downgrade to Windsurf Pro ($15/mo) → save $20/mo",
      estimatedMonthlySaving: 20, severity: "low",
      reason: `Windsurf Pro Plus ($35/mo) adds priority model access. For ${tool.intensity.toLowerCase()} intensity usage, Windsurf Pro ($15/mo) offers the same unlimited Cascade access at less than half the price.`,
    };
  }

  // Using ChatGPT Plus ONLY for coding, and already has Cursor/Windsurf/Copilot
  const hasCodingTool = context.tools.some((t) =>
    ["Cursor", "Windsurf", "GitHub Copilot"].includes(t.name)
  );
  if (
    tool.name === "ChatGPT" &&
    tool.plan === "Plus" &&
    tool.primaryFeatureUsed === "autocomplete" &&
    hasCodingTool
  ) {
    return {
      toolName: tool.name, plan: tool.plan, currentSpend: tool.monthlySpend,
      recommendedAction: "Cancel ChatGPT Plus — your coding tool already covers this → save $20/mo",
      estimatedMonthlySaving: 20, severity: "medium",
      reason: `You're using ChatGPT Plus primarily for code autocomplete but already pay for a dedicated coding tool. ChatGPT Plus ($20/mo) is redundant for this use case.`,
    };
  }

  return null;
}

function checkCrossToolRedundancy(tools: ToolInput[], hasApiUsage: boolean): ToolFinding[] {
  const findings: ToolFinding[] = [];
  const toolNames = tools.map((t) => t.name);

  // Both Claude subscription AND Anthropic API Direct
  if (toolNames.includes("Claude") && toolNames.includes("Anthropic API") && hasApiUsage) {
    const claudeSub = tools.find((t) => t.name === "Claude")!;
    findings.push({
      toolName: "Claude", plan: claudeSub.plan, currentSpend: claudeSub.monthlySpend,
      recommendedAction: "You have Claude subscription + Anthropic API — pick one billing method",
      estimatedMonthlySaving: claudeSub.monthlySpend,
      severity: "high",
      reason: `Claude.ai subscription and Anthropic API are billed separately. If your team uses the API directly in code, the subscription is likely redundant. Heavy API users typically save money going API-only.`,
    });
  }

  // Both ChatGPT Plus AND OpenAI API Direct
  if (toolNames.includes("ChatGPT") && toolNames.includes("OpenAI API") && hasApiUsage) {
    const chatSub = tools.find((t) => t.name === "ChatGPT")!;
    findings.push({
      toolName: "ChatGPT", plan: chatSub.plan, currentSpend: chatSub.monthlySpend,
      recommendedAction: "ChatGPT subscription + OpenAI API — consolidate to API-only if you're a developer",
      estimatedMonthlySaving: chatSub.monthlySpend,
      severity: "medium",
      reason: `Paying for both a ChatGPT subscription and OpenAI API. Developers using the API heavily often get better value going API-only and using a cheaper UI layer.`,
    });
  }

  // Both Cursor AND Windsurf (two coding editors)
  if (toolNames.includes("Cursor") && toolNames.includes("Windsurf")) {
    const windsurf = tools.find((t) => t.name === "Windsurf")!;
    findings.push({
      toolName: "Windsurf", plan: windsurf.plan, currentSpend: windsurf.monthlySpend,
      recommendedAction: "Running Cursor + Windsurf simultaneously — pick one editor",
      estimatedMonthlySaving: Math.min(windsurf.monthlySpend, tools.find(t => t.name === "Cursor")!.monthlySpend),
      severity: "medium",
      reason: `Cursor and Windsurf are direct competitors. Running both means paying twice for near-identical capabilities. Pick the one your team uses more — the other is pure waste.`,
    });
  }

  return findings;
}