//app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { nanoid } from "nanoid";
import { runAuditEngine } from "@/lib/audit/engine";
import { OFFICIAL_PRICES } from "@/lib/audit/engine";
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      teamSize,
      techTeamSize,
      primaryUseCase,
      companyStage,
      hasApiUsage,
      tools,
    } = body;

    // Basic server-side validation
    if (!tools || tools.length === 0) {
      return NextResponse.json(
        { error: "At least one tool is required" },
        { status: 400 }
      );
    }

    if (!teamSize || !primaryUseCase) {
      return NextResponse.json(
        { error: "teamSize and primaryUseCase are required" },
        { status: 400 }
      );
    }

    // Compute total monthly spend server-side (don't trust client)
    const totalMonthlySpend = tools.reduce(
      (sum: number, t: { monthlySpend: number }) => sum + (t.monthlySpend || 0),
      0
    );
    const auditResult = runAuditEngine({
  teamSize,
  techTeamSize,
  primaryUseCase,
  hasApiUsage,
  tools,
});
    const auditId = nanoid(10); // e.g. "aB3kR9xQ2m"

    const audit = await Audit.create({
  auditId,
  teamSize,
  techTeamSize,
  primaryUseCase,
  companyStage: companyStage || "",
  hasApiUsage,
  tools,
  totalMonthlySpend,
  findings: auditResult.findings,
  totalMonthlySavings: auditResult.totalMonthlySavings,
  totalAnnualSavings: auditResult.totalAnnualSavings,
  isHighSavings: auditResult.isHighSavings,
  overallStatus: auditResult.overallStatus,
  pricingSnapshot: JSON.parse(JSON.stringify(OFFICIAL_PRICES)), 
});

    return NextResponse.json(
  {
    success: true,
    auditId: audit.auditId,
    totalMonthlySpend: audit.totalMonthlySpend,
    totalMonthlySavings: auditResult.totalMonthlySavings,
    overallStatus: auditResult.overallStatus,
  },
  { status: 201 }
);
  } catch (error) {
    console.error("[POST /api/audit] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}