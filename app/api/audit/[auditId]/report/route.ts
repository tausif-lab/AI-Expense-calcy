// app/api/audit/[auditId]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { nanoid } from "nanoid";

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

    // Build Gemini prompt from real audit data
    const topFindings = audit.findings
      .filter((f: any) => f.severity === "high" || f.severity === "medium")
      .slice(0, 3)
      .map((f: any) => `${f.toolName}: ${f.recommendedAction} (save $${f.estimatedMonthlySaving}/mo)`)
      .join("; ");

    const toolList = audit.tools.map((t: any) => `${t.name} ${t.plan}`).join(", ");

    const prompt = `You are an AI spend analyst. Write a personalized 100-word audit summary for a ${audit.companyStage} team of ${audit.teamSize} people.
They use: ${toolList}.
Their total monthly AI spend is $${audit.totalMonthlySpend}.
Top findings: ${topFindings || "spend appears optimized"}.
Potential monthly savings: $${audit.totalMonthlySavings}.
Primary use case: ${audit.primaryUseCase}.
Write directly to the user ("your team", "you"). Be specific, use the numbers. Mention Credex as a way to capture savings through discounted AI credits if savings > $200/mo. End with one clear next step. Do not use bullet points. Plain paragraph only.`;

    // Call Gemini API
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
      // Fallback if Gemini fails
      aiSummary = `Your ${audit.companyStage} team of ${audit.teamSize} is spending $${audit.totalMonthlySpend}/mo across ${audit.tools.length} AI tools for ${audit.primaryUseCase.toLowerCase()} work. ${audit.totalMonthlySavings > 0 ? `Our analysis identified $${audit.totalMonthlySavings}/mo ($${audit.totalAnnualSavings}/yr) in potential savings through plan right-sizing and seat optimization. ${audit.isHighSavings ? "With this level of overspend, a Credex consultation could help you capture these savings through discounted AI credits." : "Review the findings above and act on the highest-severity items first."}` : "Your current stack appears well-optimized with no major savings opportunities identified."} Start with the highest-priority finding above for immediate impact.`;
    }

    // Generate unique reportId and store everything
    const reportId = nanoid(12);

    await Audit.updateOne(
      { auditId },
      {
        $set: {
          email,
          aiSummary,
          reportId,
        },
      }
    );

    return NextResponse.json({ success: true, reportId }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/audit/:id/report]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}