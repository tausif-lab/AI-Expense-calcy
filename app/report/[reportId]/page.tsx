// app/report/[reportId]/page.tsx
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { notFound } from "next/navigation";
import Link from "next/link";
import DownloadPDFButton from "./DownloadPDFButton";

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
      <div id="pdf-report-content" className="max-w-3xl mx-auto space-y-8">

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
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <a
              href={`/api/audit/${publicAudit.auditId}/reaudit`}
              className="text-xs font-bold text-white bg-emerald-600 border border-emerald-600 px-4 py-2 rounded-full hover:bg-emerald-700 transition-all"
            >
              Re-Audit Now →
            </a>
            <DownloadPDFButton reportId={resolvedParams.reportId} />
            <Link
              href="/"
              className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full hover:bg-emerald-100 transition-all"
            >
              Audit your stack →
            </Link>
          </div>
        </div>

        

        {/* Formal Report — Client Info + AI Analysis */}
<div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
  {/* Report Header */}
  <div className="bg-gray-900 text-white px-8 py-6">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
      Credex · AI Spend Audit Report
    </p>
    <h2 className="text-xl font-bold">Confidential Audit Report</h2>
    <p className="text-gray-400 text-xs mt-1">
      Generated {new Date(publicAudit.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      })} · Report ID: {resolvedParams.reportId}
    </p>
  </div>

  {/* Client Profile Table */}
  <div className="px-8 py-6 border-b border-gray-100">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
      Client Profile
    </p>
    <div className="grid grid-cols-2 gap-3 text-sm">
      {[
        ["Company Stage", publicAudit.companyStage || "—"],
        ["Team Size", `${publicAudit.teamSize} people`],
        ["Tech Team Size", `${publicAudit.techTeamSize} people`],
        ["Primary Use Case", publicAudit.primaryUseCase],
        ["Direct API Usage", publicAudit.hasApiUsage ? "Yes" : "No"],
        ["Tools Audited", `${(publicAudit.tools ?? []).length} tools`],
      ].map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Tools Used Table */}
  <div className="px-8 py-6 border-b border-gray-100">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
      Tools & Plans
    </p>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left pb-2 text-xs text-gray-400 font-bold uppercase">Tool</th>
          <th className="text-left pb-2 text-xs text-gray-400 font-bold uppercase">Plan</th>
          <th className="text-left pb-2 text-xs text-gray-400 font-bold uppercase">Seats</th>
          <th className="text-left pb-2 text-xs text-gray-400 font-bold uppercase">Active</th>
          <th className="text-right pb-2 text-xs text-gray-400 font-bold uppercase">Monthly</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {(publicAudit.tools ?? []).map((tool: any, i: number) => (
          <tr key={i}>
            <td className="py-2.5 font-semibold text-gray-900">{tool.name}</td>
            <td className="py-2.5 text-gray-500">{tool.plan}</td>
            <td className="py-2.5 text-gray-500">{tool.seats}</td>
            <td className="py-2.5 text-gray-500">{tool.activeUsers}</td>
            <td className="py-2.5 text-right font-semibold">${tool.monthlySpend}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-gray-200">
          <td colSpan={4} className="py-2.5 font-bold text-gray-900">Total</td>
          <td className="py-2.5 text-right font-bold text-gray-900">${publicAudit.totalMonthlySpend}/mo</td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* AI-generated formal report body */}
  {publicAudit.aiSummary && (
    <div className="px-8 py-6 border-b border-gray-100">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        Analyst Report
      </p>
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
        {publicAudit.aiSummary.split("\n\n").filter(Boolean).map((para: string, i: number) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  )}

  {/* Findings Summary inside report */}
  <div className="px-8 py-6">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
      Detailed Findings
    </p>
    <div className="space-y-4">
      {(publicAudit.findings ?? []).map((finding: any, i: number) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot[finding.severity] || "bg-gray-400"}`} />
              <span className="font-bold text-gray-900 text-sm">{finding.toolName}</span>
              <span className="text-gray-400 text-xs">· {finding.plan}</span>
            </div>
            {finding.estimatedMonthlySaving > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                Save ${finding.estimatedMonthlySaving}/mo
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800">{finding.recommendedAction}</p>
          <p className="text-xs text-gray-500 mt-1">{finding.reason}</p>
        </div>
      ))}
    </div>
  </div>
</div>

{/* Credex Ad — always shown */}
<div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8">
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
      C
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
        Credex · credex.rocks
      </p>
      <h3 className="text-lg font-bold mb-2">
        Buy discounted AI credits — same tools, lower price
      </h3>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">
        Credex sources surplus AI infrastructure credits from companies that overforecast — 
        Cursor, Claude, ChatGPT Enterprise, Gemini, GitHub Copilot and more. 
        The discount is real and substantial. Your team pays retail. You do not have to.
      </p>
      {publicAudit.isHighSavings && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">
          <p className="text-emerald-300 text-sm font-semibold">
            💡 Your audit shows ${publicAudit.totalMonthlySavings}/mo in savings potential — 
            a Credex consultation is free and could capture this immediately.
          </p>
        </div>
      )}
      <Link
        href="https://credex.rocks"
        target="_blank"
        className="inline-block bg-emerald-500 text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-emerald-400 transition-all"
      >
        Get Discounted AI Credits →
      </Link>
    </div>
  </div>
</div>

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

       

        {/* Re-Audit History */}
        {publicAudit.reAuditHistory && publicAudit.reAuditHistory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
              Price Change History
            </p>
            <div className="space-y-4">
              {publicAudit.reAuditHistory.map((entry: any, idx: number) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(entry.triggeredAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Changed: <span className="font-semibold">{entry.changedTools.join(", ")}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Savings Impact</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">${entry.oldTotalMonthlySavings}/mo</span>
                        <span className="text-gray-400">→</span>
                        <span className={`text-sm font-bold ${
                          entry.newTotalMonthlySavings > entry.oldTotalMonthlySavings 
                            ? "text-emerald-600" 
                            : entry.newTotalMonthlySavings < entry.oldTotalMonthlySavings
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}>
                          ${entry.newTotalMonthlySavings}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
          >
            Audit a new stack
          </Link>
        </div>

      </div>
    </div>
  );
}