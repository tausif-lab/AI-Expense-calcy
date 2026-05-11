// app/api/audit/[auditId]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { nanoid } from "nanoid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  try {
    await connectDB();
    const { auditId } = await params;
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const audit = await Audit.findOne({ auditId }).lean() as any;
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // ── Gemini prompt ──────────────────────────────────────────
    const topFindings = audit.findings
      .filter((f: any) => f.severity === "high" || f.severity === "medium")
      .slice(0, 3)
      .map((f: any) => `${f.toolName}: ${f.recommendedAction} (save $${f.estimatedMonthlySaving}/mo)`)
      .join("; ");

    const toolList = audit.tools
      .map((t: any) => `${t.name} ${t.plan}`)
      .join(", ");

    const prompt = `You are an AI spend analyst. Write a personalized 100-word audit summary for a ${audit.companyStage} team of ${audit.teamSize} people.
They use: ${toolList}.
Their total monthly AI spend is $${audit.totalMonthlySpend}.
Top findings: ${topFindings || "spend appears optimized"}.
Potential monthly savings: $${audit.totalMonthlySavings}.
Primary use case: ${audit.primaryUseCase}.
Write directly to the user ("your team", "you"). Be specific, use the numbers. Mention Credex as a way to capture savings through discounted AI credits if savings > $200/mo. End with one clear next step. Do not use bullet points. Plain paragraph only.`;

    // ── Call Gemini ────────────────────────────────────────────
    let aiSummary = "";
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
          }),
        }
      );
      const geminiData = await geminiRes.json();
      aiSummary =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } catch {
      // Fallback templated summary
      aiSummary = `Your ${audit.companyStage} team of ${audit.teamSize} is spending $${audit.totalMonthlySpend}/mo across ${audit.tools.length} AI tools for ${audit.primaryUseCase.toLowerCase()} work. ${
        audit.totalMonthlySavings > 0
          ? `Our analysis identified $${audit.totalMonthlySavings}/mo ($${audit.totalAnnualSavings}/yr) in potential savings. ${audit.isHighSavings ? "Credex can help you capture these savings through discounted AI credits — book a free consultation." : "Review the findings and act on the highest-severity items first."}`
          : "Your current stack appears well-optimized with no major savings opportunities identified."
      } Start with the highest-priority finding for immediate impact.`;
    }

    // ── Generate reportId and save to DB ───────────────────────
    const reportId = nanoid(12);
    const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${reportId}`;

    await Audit.updateOne(
      { auditId },
      { $set: { email, aiSummary, reportId } }
    );

    // ── Send email via Resend ──────────────────────────────────
    try {
      await resend.emails.send({
        from: "Credex Audit <onboarding@resend.dev>", // change to your verified Resend domain
        to: email,
        subject: "Your AI Spend Audit Report is ready",
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, sans-serif; background: #FAFAFA; padding: 40px 20px; margin: 0;">
              <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 24px; border: 1px solid #E5E7EB; padding: 40px;">
                
                <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #10B981; margin: 0 0 8px;">
                  Credex AI Spend Audit
                </p>
                <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 16px;">
                  Your report is ready
                </h1>

                <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                  We've generated a personalised AI spend analysis for your ${audit.companyStage} team of ${audit.teamSize}. 
                  Here's a quick summary:
                </p>

                <!-- AI Summary Box -->
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                  <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0;">
                    ${aiSummary}
                  </p>
                </div>

                <!-- Stats Row -->
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                  <div style="flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px; text-align: center;">
                    <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9CA3AF; margin: 0 0 4px;">Monthly Spend</p>
                    <p style="font-size: 28px; font-weight: 800; color: #111827; margin: 0;">$${audit.totalMonthlySpend}</p>
                  </div>
                  <div style="flex: 1; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; padding: 16px; text-align: center;">
                    <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #059669; margin: 0 0 4px;">Potential Savings</p>
                    <p style="font-size: 28px; font-weight: 800; color: #065F46; margin: 0;">$${audit.totalMonthlySavings}/mo</p>
                  </div>
                </div>

                <!-- CTA Button -->
                <a href="${reportUrl}" 
                   style="display: block; background: #111827; color: white; text-align: center; padding: 16px 24px; border-radius: 50px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 16px;">
                  View Full Report →
                </a>

                <!-- Shareable link note -->
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0 0 24px;">
                  This link is permanent and shareable — send it to your team or manager anytime.
                </p>

                ${audit.isHighSavings ? `
                <!-- Credex CTA for high savings -->
                <div style="background: #111827; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                  <p style="color: white; font-weight: 700; font-size: 14px; margin: 0 0 8px;">
                    💡 You qualify for a free Credex consultation
                  </p>
                  <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 12px; line-height: 1.5;">
                    With $${audit.totalMonthlySavings}/mo in savings potential, our team can help you capture these savings through discounted AI credits.
                  </p>
                  <a href="https://credex.rocks" 
                     style="display: inline-block; background: #10B981; color: white; padding: 10px 20px; border-radius: 50px; font-weight: 700; font-size: 12px; text-decoration: none;">
                    Book Free Consultation →
                  </a>
                </div>
                ` : ""}

                <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 0 0 16px;" />
                <p style="color: #D1D5DB; font-size: 11px; text-align: center; margin: 0;">
                  Credex · credex.rocks · You're receiving this because you ran an AI spend audit.
                </p>

              </div>
            </body>
          </html>
        `,
      });
    } catch (emailErr) {
      // Email failure should NOT fail the whole request
      // Report is already saved — user can still get the URL from the UI
      console.error("[Resend] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true, reportId }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/audit/:id/report]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}