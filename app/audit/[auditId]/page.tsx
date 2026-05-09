"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { div } from "framer-motion/client";

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
}

export default function AuditResultPage() {
  const { auditId } = useParams();
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <a href="/" className="text-emerald-600 underline text-sm">
            Start a new audit
          </a>
        </div>
      </div>
    );
  }

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

        {/* Per Tool Breakdown */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-lg">Tool Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {audit.tools.map((tool, i) => (
              <div key={i} className="p-6 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center font-bold text-emerald-600">
                    {tool.name[0]}
                  </div>
                  <div>
                    <p className="font-bold">{tool.name}</p>
                    <p className="text-sm text-gray-500">
                      {tool.plan} · {tool.seats} seats · {tool.activeUsers}{" "}
                      active
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tool.billingCycle} · {tool.contractStatus}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${tool.monthlySpend}/mo
                  </p>
                  <p className="text-xs text-gray-400">
                    ${tool.monthlySpend * 12}/yr
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start New Audit */}
        <div className="text-center pt-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
          >
            Start a New Audit
          </a>
        </div>
      </div>
    </div>
  );
}
