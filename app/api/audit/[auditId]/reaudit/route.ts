// app/api/audit/[auditId]/reaudit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { OFFICIAL_PRICES, runAuditEngine } from "@/lib/audit/engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  try {
    await connectDB();
    const { auditId } = await params;

    const audit = await Audit.findOne({ auditId }).lean() as any;
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Re-run engine with current prices
    const newResult = runAuditEngine({
      teamSize: audit.teamSize,
      techTeamSize: audit.techTeamSize,
      primaryUseCase: audit.primaryUseCase,
      hasApiUsage: audit.hasApiUsage,
      tools: audit.tools,
    });

    const historyEntry = {
      triggeredAt: new Date(),
      changedTools: ["Manual re-audit"],
      oldFindings: audit.findings,
      newFindings: newResult.findings,
      oldTotalMonthlySavings: audit.totalMonthlySavings,
      newTotalMonthlySavings: newResult.totalMonthlySavings,
    };

    // Save updated audit
    await Audit.updateOne(
      { auditId: audit.auditId },
      {
        $set: {
          findings: newResult.findings,
          totalMonthlySavings: newResult.totalMonthlySavings,
          totalAnnualSavings: newResult.totalAnnualSavings,
          isHighSavings: newResult.isHighSavings,
          overallStatus: newResult.overallStatus,
          pricingSnapshot: JSON.parse(JSON.stringify(OFFICIAL_PRICES)),
        },
        $push: { reAuditHistory: historyEntry },
      }
    );

    // Redirect to report page
    const reportUrl = `/report/${audit.reportId}`;
    return NextResponse.redirect(new URL(reportUrl, process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  } catch (error) {
    console.error("[GET /api/audit/:id/reaudit]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
