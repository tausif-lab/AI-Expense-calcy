import { Resend } from "resend";

export interface PricingNotificationInput {
  auditId: string;
  reportId: string;
  email: string;
  changedTools: string[];
  oldTotalMonthlySavings: number;
  newTotalMonthlySavings: number;
}

export async function sendPricingChangeEmail(
  input: PricingNotificationInput,
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${input.reportId}`;
  const reauditUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/audit/${input.auditId}/reaudit`;

  const savingsDiff =
    input.newTotalMonthlySavings - input.oldTotalMonthlySavings;

  let savingsLine: string;
  if (savingsDiff > 0) {
    savingsLine = `Your potential savings increased by <strong>$${savingsDiff}/mo</strong> due to this change.`;
  } else if (savingsDiff < 0) {
    savingsLine = `Your potential savings decreased by <strong>$${Math.abs(savingsDiff)}/mo</strong>.`;
  } else {
    savingsLine = `Your savings estimate remains the same at <strong>$${input.newTotalMonthlySavings}/mo</strong>.`;
  }

  const html = `<!DOCTYPE html>
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
        Pricing changed for: <strong>${input.changedTools.join(", ")}</strong>.
        We've re-run your audit with the latest prices.
      </p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        ${savingsLine}
      </p>
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px; text-align: center;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9CA3AF; margin: 0 0 4px;">Previous Savings</p>
          <p style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">$${input.oldTotalMonthlySavings}/mo</p>
        </div>
        <div style="flex: 1; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; padding: 16px; text-align: center;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #059669; margin: 0 0 4px;">Updated Savings</p>
          <p style="font-size: 24px; font-weight: 800; color: #065F46; margin: 0;">$${input.newTotalMonthlySavings}/mo</p>
        </div>
      </div>
      <a href="${reportUrl}" style="display: block; background: #111827; color: white; text-align: center; padding: 16px 24px; border-radius: 50px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 12px;">
        View Updated Report →
      </a>
      <a href="${reauditUrl}" style="display: block; background: #10B981; color: white; text-align: center; padding: 16px 24px; border-radius: 50px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 24px;">
        Re-Audit with Latest Data →
      </a>
      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0 0 24px;">
        Click "Re-Audit" to run a fresh analysis with your current tool usage and the new pricing.
      </p>
      <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 0 0 16px;" />
      <p style="color: #D1D5DB; font-size: 11px; text-align: center; margin: 0;">
        Credex · credex.rocks
      </p>
    </div>
  </body>
</html>`;

  const { error } = await resend.emails.send({
    from: "Credex Audit <onboarding@resend.dev>",
    to: input.email,
    subject: "Pricing update detected in your AI tools audit",
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
