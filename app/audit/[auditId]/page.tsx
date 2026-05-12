//app/audit/[auditId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { div } from "framer-motion/client";
import Link from "next/link";

interface ToolInput {
  name: string;
  plan: string;
  seats: number;
  activeUsers: number;
  monthlySpend: number;
  billingCycle: string;
  contractStatus: string;
  primaryFeatureUsed: string;
  intensity: string;
  usage: string;
 
}
interface ToolFinding {
  toolName: string;
  plan: string;
  currentSpend: number;
  recommendedAction: string;
  estimatedMonthlySaving: number;
  severity: "high" | "medium" | "low" | "optimal";
  reason: string;
  inferredSpend: number;
  tags: string[];
}
interface AuditData {
  auditId: string;
  teamSize: number;
  techTeamSize: number;
  primaryUseCase: string;
  companyStage: string;
  hasApiUsage: boolean;
  tools: ToolInput[];
  totalMonthlySpend: number;
  createdAt: string;
  totalMonthlySavings: number;
totalAnnualSavings: number;
isHighSavings: boolean;
overallStatus: "overspending" | "optimized" | "mixed";
findings: ToolFinding[];
totalCurrentSpend: number;
summary: string;
}

export default function AuditResultPage() {
  const { auditId } = useParams();
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
const [emailSubmitting, setEmailSubmitting] = useState(false);
const [reportUrl, setReportUrl] = useState("");
const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!auditId) return;

    const fetchAudit = async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Audit not found");

        setAudit(json.audit);
      } catch (err: any) {
        setError(err.message || "Failed to load audit");
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [auditId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading your audit...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-3">
          <p className="text-red-500 font-semibold text-lg">
            {error || "Audit not found"}
          </p>
          <Link href="/" className="text-emerald-600 underline text-sm">
            Start a new audit
          </Link>
        </div>
      </div>
    );
  }
  const handleEmailSubmit = async () => {
  if (!email || !email.includes("@")) {
    setEmailError("Please enter a valid email.");
    return;
  }
  setEmailError("");
  setEmailSubmitting(true);
  try {
    const res = await fetch(`/api/audit/${auditId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to generate report");
    setReportUrl(`${window.location.origin}/report/${json.reportId}`);
  } catch (err: any) {
    setEmailError(err.message || "Something went wrong. Try again.");
  } finally {
    setEmailSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            Audit Complete
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            Your AI Spend Report
          </h1>
          <p className="text-gray-500 mt-2">
            {audit.teamSize} team members · {audit.primaryUseCase} ·{" "}
            {audit.companyStage}
          </p>
        </div>

        {/* Total Spend Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">
              Total Monthly Spend
            </p>
            <p className="text-5xl font-bold text-gray-900 mt-2">
              ${audit.totalMonthlySpend}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              ${audit.totalMonthlySpend * 12} / year
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">
              Tools Audited
            </p>
            <p className="text-5xl font-bold text-emerald-500 mt-2">
              {audit.tools.length}
            </p>
          </div>
        </div>

        {/* Savings Hero — only show if savings exist */}
{audit.totalMonthlySavings > 0 && (
  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
      Potential Savings Identified
    </p>
    <p className="text-5xl font-bold text-emerald-700 mt-2">
      ${audit.totalMonthlySavings.toFixed(0)}/mo
    </p>
    <p className="text-emerald-600 text-sm mt-1">
      ${audit.totalAnnualSavings.toFixed(0)} saved per year
    </p>
    {audit.isHighSavings && (
      <div className="mt-4 p-4 bg-white rounded-2xl border border-emerald-200">
        <p className="font-bold text-gray-900 text-sm">
          💡 You qualify for a Credex consultation
        </p>
        <p className="text-gray-500 text-xs mt-1">
          With $500+/mo in savings potential, our team can help you capture
          these savings through discounted AI credits.
        </p>
         <Link
          href="https://credex.rocks"
          target="_blank"
          className="inline-block mt-3 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-emerald-700 transition-all"
        >
          Book a Free Consultation →
        </Link>
      </div>
    )}
  </div>
)}

{/* Optimized state */}
{audit.totalMonthlySavings === 0 && (
  <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
    <p className="text-2xl font-bold text-gray-900">✅ You're spending well</p>
    <p className="text-gray-500 text-sm mt-2">
      No major optimizations found for your current stack.
    </p>
  </div>
)}

{/* Per-tool findings */}
<div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
  <div className="p-6 border-b border-gray-100">
    <h2 className="font-bold text-lg">Audit Findings</h2>
  </div>
  <div className="divide-y divide-gray-100">
    {audit.findings.map((finding, i) => (
      <div key={i} className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                finding.severity === "high"
                  ? "bg-red-500"
                  : finding.severity === "medium"
                  ? "bg-amber-400"
                  : finding.severity === "low"
                  ? "bg-blue-400"
                  : "bg-emerald-400"
              }`}
            />
            <div>
              <p className="font-bold text-gray-900">{finding.toolName}</p>
              <p className="text-sm text-gray-500">{finding.plan} · ${finding.currentSpend}/mo</p>
            </div>
          </div>
          {finding.estimatedMonthlySaving > 0 && (
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Save ${finding.estimatedMonthlySaving}/mo
            </span>
          )}
          {finding.severity === "optimal" && (
            <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              ✓ Optimal
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

{/* Email capture */}
<div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
  <h2 className="font-bold text-lg">Get your AI-generated report</h2>
  <p className="text-gray-400 text-sm mt-1">
    Enter your email and we'll generate a personalised 100-word AI analysis of your audit.
  </p>
  <div className="flex gap-3 mt-4">
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="you@company.com"
      className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
    />
    <button
      onClick={handleEmailSubmit}
      disabled={emailSubmitting}
      className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50"
    >
      {emailSubmitting ? "Generating..." : "Generate Report"}
    </button>
  </div>
  {emailError && (
    <p className="text-red-500 text-xs mt-2">{emailError}</p>
  )}
  {reportUrl && (
    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
      <p className="text-sm font-semibold text-gray-800">
        ✅ Your report is ready!
      </p>
      <Link
        href={reportUrl}
        target="_blank"
        className="text-emerald-600 underline text-sm break-all mt-1 block"
      >
        {reportUrl}
      </Link>
      <p className="text-xs text-gray-400 mt-2">
        Bookmark this link — it works anytime, from anywhere.
      </p>
    </div>
  )}
  <p className="text-xs text-gray-300 mt-3">No spam. One email. Unsubscribe anytime.</p>
</div>

        {/* Start New Audit */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
          >
            Start a New Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
