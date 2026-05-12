// auditengine.test.ts
// Covers the 5 required audit engine scenarios for TESTS.md
// Run with: npx vitest run auditengine.test.ts
//
// ⚠️  Values mirror exactly what page.tsx (the form) sends to the engine:
//   intensity  → "Light" | "Medium" | "Heavy"   (form renders these three options)
//   usage      → "Coding" | "Writing" | "Research" | "Analysis"
//   primaryFeatureUsed → "autocomplete" | "chat" | "agents" | "api-calls" | "docs" | "review"
//   billingCycle       → "monthly" | "annual"
//   contractStatus     → "month-to-month" | "in-annual-contract" | "contract-ending-soon"

import { describe, it, expect } from "vitest";
import { runAuditEngine } from "../lib/audit/engine";

// ─────────────────────────────────────────────
// HELPERS — defaults match the form's defaultValues
// ─────────────────────────────────────────────
const baseForm = {
  teamSize: 10,
  techTeamSize: 5,
  primaryUseCase: "Coding", // matches form Step 1 dropdown
  hasApiUsage: false,
  companyStage: "Early (11–30)",
};

/** Build a tool entry exactly as the form would POST it */
function makeTool(overrides: object) {
  return {
    // form defaultValues for the first tool card (Cursor Pro)
    name: "Cursor",
    plan: "Pro",
    seats: 1,
    activeUsers: 1,
    monthlySpend: 20,
    billingCycle: "monthly" as const,
    contractStatus: "month-to-month" as const,
    primaryFeatureUsed: "autocomplete" as const, // form default for first card
    intensity: "Medium", // "Light" | "Medium" | "Heavy"  ← form options
    usage: "Coding", // "Coding" | "Writing" | "Research" | "Analysis" ← form options
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// TEST 1 — Team plan overkill → downgrade
// Scenario: Claude Team with 2 users. Plan requires 5-seat minimum.
// Engine must flag plan-mismatch and recommend Claude Pro.
// ─────────────────────────────────────────────
describe("Test 1: Team overkill — downgrade recommendation", () => {
  it("flags Claude Team with fewer than 5 seats and recommends Pro", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Claude",
          plan: "Team",
          seats: 2,
          activeUsers: 2,
          monthlySpend: 50, // 2 × $25
          primaryFeatureUsed: "chat",
          usage: "Writing", // ← valid form value
          intensity: "Medium",
        }),
      ],
    });

    const finding = result.findings[0];
    expect(finding.tags).toContain("plan-mismatch");
    expect(finding.estimatedMonthlySaving).toBeGreaterThan(0);
    expect(finding.recommendedAction).toMatch(/Pro/i);
    expect(result.overallStatus).not.toBe("optimized");
  });

  it("does NOT flag Claude Team when seats meet the 5-seat minimum", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Claude",
          plan: "Team",
          seats: 5,
          activeUsers: 5,
          monthlySpend: 125, // 5 × $25
          billingCycle: "annual" as const,
          contractStatus: "in-annual-contract" as const,
          primaryFeatureUsed: "chat",
          usage: "Writing",
          intensity: "Medium",
        }),
      ],
    });

    expect(result.findings[0].tags).not.toContain("plan-mismatch");
  });
});

// ─────────────────────────────────────────────
// TEST 2 — Unused seats → reduce seats
// Scenario: 10 seats paid, only 6 actively used.
// Engine must flag unused-seats and compute exact waste.
// ─────────────────────────────────────────────
describe("Test 2: Unused seats → reduce seats recommendation", () => {
  it("flags unused GitHub Copilot Business seats and calculates correct waste", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "GitHub Copilot",
          plan: "Business",
          seats: 10,
          activeUsers: 6,
          monthlySpend: 190, // 10 × $19
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Heavy", // "Heavy" is the form's highest option
        }),
      ],
    });

    const finding = result.findings[0];
    expect(finding.tags).toContain("unused-seats");
    // 4 unused seats × $19 = $76
    expect(finding.estimatedMonthlySaving).toBe(76);
    expect(finding.recommendedAction).toMatch(/4 unused seat/i);
  });

  it("does NOT flag unused seats when every seat has an active user", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "GitHub Copilot",
          plan: "Business",
          seats: 6,
          activeUsers: 6,
          monthlySpend: 114, // 6 × $19
          billingCycle: "annual" as const,
          contractStatus: "in-annual-contract" as const,
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Heavy",
        }),
      ],
    });

    expect(result.findings[0].tags).not.toContain("unused-seats");
  });
});

// ─────────────────────────────────────────────
// TEST 3 — Duplicate tools overlap → consolidate
// Scenario: Cursor + Windsurf both active (two AI code editors).
// Engine must flag redundancy and recommend dropping one.
// ─────────────────────────────────────────────
describe("Test 3: Duplicate tools overlap → consolidate", () => {
  it("flags Cursor + Windsurf as redundant AI editors", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Cursor",
          plan: "Pro",
          seats: 3,
          activeUsers: 3,
          monthlySpend: 60, // 3 × $20
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Heavy",
        }),
        makeTool({
          name: "Windsurf",
          plan: "Pro",
          seats: 3,
          activeUsers: 3,
          monthlySpend: 45, // 3 × $15
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Heavy",
        }),
      ],
    });

    const allTags = result.findings.flatMap((f) => f.tags);
    expect(allTags).toContain("redundant");

    const redundantFinding = result.findings.find((f) =>
      f.tags.includes("redundant"),
    );
    expect(redundantFinding).toBeDefined();
    expect(redundantFinding!.estimatedMonthlySaving).toBeGreaterThan(0);
  });

  it("flags Claude + ChatGPT both used for docs/writing as redundant", () => {
    const result = runAuditEngine({
      ...baseForm,
      primaryUseCase: "Writing", // ← valid form Step 1 value
      tools: [
        makeTool({
          name: "Claude",
          plan: "Pro",
          seats: 1,
          activeUsers: 1,
          monthlySpend: 20,
          primaryFeatureUsed: "docs",
          usage: "Writing", // ← valid form value
          intensity: "Medium",
        }),
        makeTool({
          name: "ChatGPT",
          plan: "Plus",
          seats: 1,
          activeUsers: 1,
          monthlySpend: 20,
          primaryFeatureUsed: "docs",
          usage: "Writing",
          intensity: "Medium",
        }),
      ],
    });

    const allTags = result.findings.flatMap((f) => f.tags);
    expect(allTags).toContain("redundant");
  });
});

// ─────────────────────────────────────────────
// TEST 4 — Annual billing savings
// Scenario: On monthly billing, no contract lock-in.
// Engine must recommend switching to annual and show ~17% saving.
// ─────────────────────────────────────────────
describe("Test 4: Annual billing savings opportunity", () => {
  it("recommends annual billing for Cursor Pro on monthly billing", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Cursor",
          plan: "Pro",
          seats: 5,
          activeUsers: 5,
          monthlySpend: 100, // 5 × $20
          billingCycle: "monthly" as const,
          contractStatus: "month-to-month" as const,
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Heavy", // "Heavy" — form's top intensity value
        }),
      ],
    });

    const finding = result.findings[0];
    expect(finding.tags).toContain("billing-cycle");
    expect(finding.estimatedMonthlySaving).toBeGreaterThanOrEqual(5);
    expect(finding.recommendedAction).toMatch(/annual/i);
  });

  it("does NOT suggest annual billing when already locked into annual contract", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Cursor",
          plan: "Pro",
          seats: 5,
          activeUsers: 5,
          monthlySpend: 100,
          billingCycle: "annual" as const,
          contractStatus: "in-annual-contract" as const,
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Heavy",
        }),
      ],
    });

    expect(result.findings[0].tags).not.toContain("billing-cycle");
  });
});

// ─────────────────────────────────────────────
// TEST 5 — Optimized stack → no fake savings
// Scenario: Right plan, all seats active, annual billing, heavy usage.
// Engine must return "optimized" status with $0 in savings.
// ─────────────────────────────────────────────
describe("Test 5: Already-optimized stack → no fake savings", () => {
  it("reports $0 savings and 'optimized' for a fully right-sized stack", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "GitHub Copilot",
          plan: "Business",
          seats: 4,
          activeUsers: 4,
          monthlySpend: 76, // 4 × $19 — exactly official rate
          billingCycle: "annual" as const,
          contractStatus: "in-annual-contract" as const,
          primaryFeatureUsed: "autocomplete",
          usage: "Coding", // ← valid form value
          intensity: "Heavy", // ← "Heavy" not "High" — matches form
        }),
      ],
    });

    expect(result.totalMonthlySavings).toBe(0);
    expect(result.overallStatus).toBe("optimized");
    expect(result.findings[0].severity).toBe("optimal");
    expect(result.findings[0].estimatedMonthlySaving).toBe(0);
  });

  it("annual savings total is never negative regardless of input", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Windsurf",
          plan: "Pro",
          seats: 2,
          activeUsers: 2,
          monthlySpend: 30, // 2 × $15
          billingCycle: "annual" as const,
          contractStatus: "in-annual-contract" as const,
          primaryFeatureUsed: "autocomplete",
          usage: "Coding",
          intensity: "Medium",
        }),
      ],
    });

    expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(0);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────
// BONUS — isHighSavings flag and aggregate math
// ─────────────────────────────────────────────
describe("Bonus: isHighSavings flag and aggregate totals", () => {
  it("sets isHighSavings = true when monthly savings exceed $500", () => {
    // Claude Max 20x, 4 seats, chat usage at Light intensity
    // Engine rule: Max 20x + chat + non-Heavy → downgrade to Pro
    // Saving = (200 - 20) × 4 = $720/mo
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Claude",
          plan: "Max 20x",
          seats: 4,
          activeUsers: 4,
          monthlySpend: 800,
          primaryFeatureUsed: "chat",
          usage: "Writing", // ← valid form value
          intensity: "Light", // "Light" is the form's lowest option
        }),
      ],
    });

    expect(result.totalMonthlySavings).toBeGreaterThan(500);
    expect(result.isHighSavings).toBe(true);
  });

  it("totalAnnualSavings equals totalMonthlySavings × 12", () => {
    const result = runAuditEngine({
      ...baseForm,
      tools: [
        makeTool({
          name: "Cursor",
          plan: "Pro",
          seats: 3,
          activeUsers: 1, // 2 unused seats → saving fired
          monthlySpend: 60, // 3 × $20
          usage: "Coding",
          intensity: "Medium",
        }),
      ],
    });

    expect(result.totalAnnualSavings).toBeCloseTo(
      result.totalMonthlySavings * 12,
      1,
    );
  });
});
