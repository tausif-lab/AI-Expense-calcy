
import { connectDB } from "@/config/config";
import { Pricing } from "@/app/models/pricing.model";
import { Audit } from "@/app/models/audit.model";
import PricingEditor from "./PricingEditor";

export default async function AdminPricingPage() {
  await connectDB();

  // Fetch all pricing entries
  const entries = await Pricing.find({}).lean();
  const serialized = entries.map((e: any) => ({
    _id: e._id.toString(),
    tool: e.tool,
    plan: e.plan,
    price: e.price,
    updatedBy: e.updatedBy,
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
  }));

  // Fetch recent re-audit activity — audits that have at least one reAuditHistory entry
  const recentReaudits = await Audit.find(
    { "reAuditHistory.0": { $exists: true } },
    {
      auditId: 1,
      reportId: 1,
      email: 1,
      totalMonthlySavings: 1,
      overallStatus: 1,
      reAuditHistory: { $slice: -3 }, // last 3 entries per audit
    },
  )
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  const reauditActivity = recentReaudits.map((a: any) => ({
    auditId: a.auditId,
    reportId: a.reportId ?? null,
    email: a.email ?? null,
    currentSavings: a.totalMonthlySavings,
    currentStatus: a.overallStatus,
    history: (a.reAuditHistory ?? []).map((h: any) => ({
      triggeredAt: h.triggeredAt ? new Date(h.triggeredAt).toISOString() : null,
      changedTools: h.changedTools ?? [],
      oldTotalMonthlySavings: h.oldTotalMonthlySavings,
      newTotalMonthlySavings: h.newTotalMonthlySavings,
      oldStatus: h.oldFindings?.some((f: any) => f.severity === "high")
        ? "overspending"
        : h.oldFindings?.every((f: any) => f.severity === "optimal")
          ? "optimized"
          : "mixed",
      newStatus: h.newFindings?.some((f: any) => f.severity === "high")
        ? "overspending"
        : h.newFindings?.every((f: any) => f.severity === "optimal")
          ? "optimized"
          : "mixed",
    })),
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <PricingEditor
        initialEntries={serialized}
        reauditActivity={reauditActivity}
      />
    </div>
  );
}