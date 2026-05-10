// app/report/[reportId]/page.tsx
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { notFound } from "next/navigation";

// OG tags for shareable link previews
export async function generateMetadata({ params }: { params: Promise<{ reportId: string }> }) {
  const resolvedParams = await params;
  return {
    title: "AI Spend Audit Report | Credex",
    description: "Personalized AI spend analysis — see where your team is overspending on AI tools.",
    openGraph: {
      title: "AI Spend Audit Report | Credex",
      description: "See your personalized AI spend analysis.",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/report/${resolvedParams.reportId}`,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const resolvedParams = await params;
  await connectDB();

  const audit = await (Audit as any)
    .findOne({ reportId: resolvedParams.reportId })
    .lean();

  if (!audit) notFound();

  // Strip private fields
  const { email, companyName, role, ...publicAudit } = audit as any;

  const severityColor: Record<string, string> = {
    high: "bg-red-50 border-red-200 text-red-700",
    medium: "bg-amber-50 border-amber-200 text-amber-700",
    low: "bg-blue-50 border-blue-200 text-blue-700",
    optimal: "bg-emerald-50 border-emerald-200 text-emerald-700",
    info: "bg-gray-50 border-gray-200 text-gray-600",
  };

  const severityDot: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-blue-400",
    optimal: "bg-emerald-400",
    info: "bg-gray-400",
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
              Credex AI Spend Report
            </p>
            <h1 className="text-3xl font-bold tracking-tight mt-1">
              Your Personalized Audit
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {publicAudit.teamSize} team members · {publicAudit.primaryUseCase} · {publicAudit.companyStage}
            </p>
          </div>
          <a
            href="/"
            className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full hover:bg-emerald-100 transition-all"
          >
            Audit your stack →
          </a>
        </div>

        {/* AI-generated summary */}
        {publicAudit.aiSummary && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              AI Analysis
            </p>
            <p className="text-gray-800 leading-relaxed text-base">
              {publicAudit.aiSummary}
            </p>
          </div>
        )}

        {/* Spend vs Savings overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">
              Monthly Spend
            </p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              ${publicAudit.totalMonthlySpend}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              ${publicAudit.totalMonthlySpend * 12}/yr
            </p>
          </div>
          <div className={`border rounded-3xl p-6 shadow-sm ${publicAudit.totalMonthlySavings > 0 ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Potential Savings
            </p>
            <p className="text-4xl font-bold text-emerald-700 mt-2">
              ${publicAudit.totalMonthlySavings}/mo
            </p>
            <p className="text-emerald-600 text-xs mt-1">
              ${publicAudit.totalAnnualSavings}/yr
            </p>
          </div>
        </div>

        {/* Credex CTA for high savings */}
        {publicAudit.isHighSavings && (
          <div className="bg-black text-white rounded-3xl p-8">
            <p className="font-bold text-lg">
              💡 You could save ${publicAudit.totalMonthlySavings}/mo
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Credex sells discounted AI infrastructure credits — Cursor, Claude, ChatGPT Enterprise and others — at substantial discounts. Your audit qualifies for a free consultation.
            </p>
            <a
              href="https://credex.rocks"
              target="_blank"
              className="inline-block mt-4 bg-emerald-500 text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-emerald-400 transition-all"
            >
              Book Free Consultation →
            </a>
          </div>
        )}

        {/* Per-tool findings */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-lg">Audit Findings</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {(publicAudit.tools ?? []).length} tool{(publicAudit.tools ?? []).length !== 1 ? "s" : ""} analysed
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {(publicAudit.findings ?? []).map((finding: any, i: number) => (
              <div key={i} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot[finding.severity] || "bg-gray-400"}`} />
                    <div>
                      <p className="font-bold text-gray-900">{finding.toolName}</p>
                      <p className="text-sm text-gray-500">
                        {finding.plan} · ${finding.currentSpend}/mo
                      </p>
                    </div>
                  </div>
                  {finding.estimatedMonthlySaving > 0 ? (
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      Save ${finding.estimatedMonthlySaving}/mo
                    </span>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${severityColor[finding.severity] || ""}`}>
                      {finding.severity === "optimal" ? "✓ Optimal" : finding.severity.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-3">
                  {finding.recommendedAction}
                </p>
                <p className="text-xs text-gray-400 mt-1">{finding.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shareable link */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm text-center space-y-2">
          <p className="text-sm font-semibold text-gray-700">🔗 Share this report</p>
          <p className="text-xs text-gray-400 break-all">
            {`${process.env.NEXT_PUBLIC_BASE_URL}/report/${resolvedParams.reportId}`}
          </p>
          <p className="text-xs text-gray-300">
            Private details (email, company) are not shown on this page.
          </p>
        </div>

        <div className="text-center pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
          >
            Audit a new stack
          </a>
        </div>

      </div>
    </div>
  );
}