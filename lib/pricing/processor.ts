import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { Pricing } from "@/app/models/pricing.model";
import { runAuditEngine } from "@/lib/audit/engine";
import { sendPricingChangeEmail } from "@/lib/email/pricingNotification";
import { triggerAudienceEngine } from "@/lib/audience/engine";

export interface ProcessAffectedAuditsOptions {
  tool: string;
}

export async function processAffectedAudits(
  options: ProcessAffectedAuditsOptions,
): Promise<void> {
  await connectDB();

  // Build pricing map from all Pricing documents
  const pricingDocs = await Pricing.find({}).lean();
  const pricingMap: Record<string, Record<string, number>> = {};
  for (const doc of pricingDocs as any[]) {
    if (!pricingMap[doc.tool]) {
      pricingMap[doc.tool] = {};
    }
    pricingMap[doc.tool][doc.plan] = doc.price;
  }

  // Query audits that use the affected tool
  const audits = await Audit.find({ "tools.name": options.tool }).lean();

  let found = audits.length;
  let updated = 0;
  let emailsSent = 0;
  let emailsFailed = 0;

  for (const audit of audits as any[]) {
    try {
      // Build engine input from existing audit fields
      const engineInput = {
        teamSize: audit.teamSize,
        techTeamSize: audit.techTeamSize,
        primaryUseCase: audit.primaryUseCase,
        hasApiUsage: audit.hasApiUsage,
        tools: audit.tools,
      };

      // Re-run the audit engine with updated pricing
      const newResult = runAuditEngine(engineInput, pricingMap);

      // Build history entry
      const historyEntry = {
        triggeredAt: new Date(),
        changedTools: [options.tool],
        oldFindings: audit.findings,
        newFindings: newResult.findings,
        oldTotalMonthlySavings: audit.totalMonthlySavings,
        newTotalMonthlySavings: newResult.totalMonthlySavings,
      };

      // Persist updated findings and append history
      await Audit.updateOne(
        { auditId: audit.auditId },
        {
          $set: {
            findings: newResult.findings,
            totalMonthlySavings: newResult.totalMonthlySavings,
            totalAnnualSavings: newResult.totalAnnualSavings,
            isHighSavings: newResult.isHighSavings,
            overallStatus: newResult.overallStatus,
            pricingSnapshot: pricingMap,
          },
          $push: { reAuditHistory: historyEntry },
        },
      );

      updated++;

      // Send notification email if the audit has an email address
      if (audit.email) {
        try {
          await sendPricingChangeEmail({
            auditId: audit.auditId,
            reportId: audit.reportId ?? audit.auditId,
            email: audit.email,
            changedTools: [options.tool],
            oldTotalMonthlySavings: audit.totalMonthlySavings,
            newTotalMonthlySavings: newResult.totalMonthlySavings,
          });
          emailsSent++;
        } catch (emailErr) {
          console.error(
            `[processAffectedAudits] Email failed for auditId=${audit.auditId}: ${emailErr}`,
          );
          emailsFailed++;
        }
      }

      // Trigger audience engine (best-effort, errors do not affect counters)
      try {
        await triggerAudienceEngine(audit.auditId);
      } catch (audienceErr) {
        console.error(
          `[processAffectedAudits] triggerAudienceEngine failed for auditId=${audit.auditId}: ${audienceErr}`,
        );
      }
    } catch (err) {
      console.error(
        `[processAffectedAudits] Error processing auditId=${audit.auditId}: ${err}`,
      );
    }
  }

  console.log(
    `[processAffectedAudits] tool=${options.tool} found=${found} updated=${updated} emailsSent=${emailsSent} emailsFailed=${emailsFailed}`,
  );
}
