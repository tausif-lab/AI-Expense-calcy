// app/api/detect-changes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { OFFICIAL_PRICES, runAuditEngine } from "@/lib/audit/engine";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function comparePrices(
  snapshot: Record<string, Record<string, number>>,
  current: Record<string, Record<string, number>>
): string[] {
  const changedTools: string[] = [];
  for (const tool of Object.keys(current)) {
    if (!snapshot[tool]) continue; // new tool added — not a change for existing audits
    for (const plan of Object.keys(current[tool])) {
      if (snapshot[tool]?.[plan] !== current[tool][plan]) {
        changedTools.push(tool);
        break;
      }
    }
  }
  return changedTools;
}
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // Only audits that have a snapshot and an email (so we can notify)
    const audits = await Audit.find({
      pricingSnapshot: { $ne: null },
      
    }).lean() as any[];

    console.log("[detect-changes] Total audits with snapshot:", audits.length);

    let affectedUsers = 0;

    for (const audit of audits) {
      const changedTools = comparePrices(audit.pricingSnapshot, OFFICIAL_PRICES);
      if (changedTools.length === 0) continue;

      // Only flag if the changed tool is actually in this audit
      const auditToolNames = audit.tools.map((t: any) => t.name);
      const relevantChanges = changedTools.filter((t) => auditToolNames.includes(t));
      console.log(`[detect-changes] Audit ${audit.auditId} — changedTools:`, changedTools);
      console.log(`[detect-changes] relevantChanges:`, relevantChanges);
      if (relevantChanges.length === 0) continue;

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
        changedTools: relevantChanges,
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
            pricingSnapshot: JSON.parse(JSON.stringify(OFFICIAL_PRICES)), // update snapshot
          },
          $push: { reAuditHistory: historyEntry },
        }
      );

      // Send email notification
      const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${audit.reportId}`;
      const savingsDiff = newResult.totalMonthlySavings - audit.totalMonthlySavings;
      const savingsLine =
        savingsDiff > 0
          ? `Your potential savings increased by <strong>$${savingsDiff}/mo</strong> due to this change.`
          : savingsDiff < 0
          ? `Your potential savings decreased by <strong>$${Math.abs(savingsDiff)}/mo</strong>.`
          : `Your savings estimate remains the same at <strong>$${newResult.totalMonthlySavings}/mo</strong>.`;

      try {
        await resend.emails.send({
          from: "Credex Audit <onboarding@resend.dev>",
          to: "tautumhare@gmail.com",
          subject: `Pricing update detected in your AI tools audit`,
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: -apple-system, sans-serif; background: #FAFAFA; padding: 40px 20px; margin: 0;">
                <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 24px; border: 1px solid #E5E7EB; padding: 40px;">
                  <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #F59E0B; margin: 0 0 8px;">
                    Pricing Change Alert
                  </p>
                  <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 16px;">
                    Tool pricing has changed
                  </h1>
                  <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                    Pricing changed for: <strong>${relevantChanges.join(", ")}</strong>.
                    We've re-run your audit with the latest prices.
                  </p>
                  <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    ${savingsLine}
                  </p>
                  <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <div style="flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px; text-align: center;">
                      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9CA3AF; margin: 0 0 4px;">Previous Savings</p>
                      <p style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">$${audit.totalMonthlySavings}/mo</p>
                    </div>
                    <div style="flex: 1; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; padding: 16px; text-align: center;">
                      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #059669; margin: 0 0 4px;">Updated Savings</p>
                      <p style="font-size: 24px; font-weight: 800; color: #065F46; margin: 0;">$${newResult.totalMonthlySavings}/mo</p>
                    </div>
                  </div>
                  <a href="${reportUrl}"
                     style="display: block; background: #111827; color: white; text-align: center; padding: 16px 24px; border-radius: 50px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 24px;">
                    View Updated Audit →
                  </a>
                  <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 0 0 16px;" />
                  <p style="color: #D1D5DB; font-size: 11px; text-align: center; margin: 0;">
                    Credex · credex.rocks
                  </p>
                </div>
              </body>
            </html>
          `,
        });
      } catch (emailErr) {
        console.error(`[detect-changes] Email failed for ${audit.email}:`, emailErr);
      }

      affectedUsers++;
    }

    return NextResponse.json({ success: true, affectedUsers }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/detect-changes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}