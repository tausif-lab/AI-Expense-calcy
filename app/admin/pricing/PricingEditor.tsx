
"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Clock
} from "lucide-react";

interface PricingEntry {
  _id: string;
  tool: string;
  plan: string;
  price: number;
  updatedBy: string;
  updatedAt: string | null;
}

interface ReauditHistoryEntry {
  triggeredAt: string | null;
  changedTools: string[];
  oldTotalMonthlySavings: number;
  newTotalMonthlySavings: number;
  oldStatus: string;
  newStatus: string;
}

interface ReauditAudit {
  auditId: string;
  reportId: string | null;
  email: string | null;
  currentSavings: number;
  currentStatus: string;
  history: ReauditHistoryEntry[];
}

interface RowState {
  editedPrice: string;
  loading: boolean;
  error: string | null;
  saved: boolean;
}

interface AddFormState {
  tool: string;
  plan: string;
  price: string;
  loading: boolean;
  error: string | null;
}

function isValidPrice(value: string): boolean {
  const n = Number(value);
  return value.trim() !== "" && isFinite(n) && n >= 0;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const statusBadges: Record<string, string> = {
  overspending: "bg-red-50 text-red-700 border border-red-200/60",
  optimized: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  mixed: "bg-amber-50 text-amber-700 border border-amber-200/60",
};

export default function PricingEditor({
  initialEntries,
  reauditActivity = [],
}: {
  initialEntries: PricingEntry[];
  reauditActivity?: ReauditAudit[];
}) {
  const [entries, setEntries] = useState<PricingEntry[]>(initialEntries);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const e of initialEntries) {
      init[e._id] = {
        editedPrice: String(e.price),
        loading: false,
        error: null,
        saved: false,
      };
    }
    return init;
  });

  const [addForm, setAddForm] = useState<AddFormState>({
    tool: "",
    plan: "",
    price: "",
    loading: false,
    error: null,
  });

  function updateRowState(id: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function handleSave(entry: PricingEntry) {
    const row = rowStates[entry._id];
    if (!row || !isValidPrice(row.editedPrice)) return;

    updateRowState(entry._id, { loading: true, error: null, saved: false });

    try {
      const res = await fetch("/api/admin/update-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: entry.tool,
          plan: entry.plan,
          price: Number(row.editedPrice),
          updatedBy: "admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        updateRowState(entry._id, {
          loading: false,
          error: data?.error ?? data?.message ?? "An error occurred",
        });
        return;
      }

      const now = new Date().toISOString();
      setEntries((prev) =>
        prev.map((e) =>
          e._id === entry._id
            ? { ...e, price: Number(row.editedPrice), updatedAt: now }
            : e,
        ),
      );
      updateRowState(entry._id, { loading: false, saved: true, error: null });

      setTimeout(() => {
        updateRowState(entry._id, { saved: false });
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      updateRowState(entry._id, { loading: false, error: message });
    }
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((e) => e._id !== id));
    setRowStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPrice(addForm.price)) return;

    setAddForm((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch("/api/admin/update-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: addForm.tool.trim(),
          plan: addForm.plan.trim(),
          price: Number(addForm.price),
          updatedBy: "admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddForm((prev) => ({
          ...prev,
          loading: false,
          error: data?.error ?? data?.message ?? "An error occurred",
        }));
        return;
      }

      const newEntry: PricingEntry = {
        _id: data._id ?? `temp-${Date.now()}`,
        tool: addForm.tool.trim(),
        plan: addForm.plan.trim(),
        price: Number(addForm.price),
        updatedBy: "admin",
        updatedAt: new Date().toISOString(),
      };

      setEntries((prev) => [...prev, newEntry]);
      setRowStates((prev) => ({
        ...prev,
        [newEntry._id]: {
          editedPrice: String(newEntry.price),
          loading: false,
          error: null,
          saved: false,
        },
      }));

      setAddForm({
        tool: "",
        plan: "",
        price: "",
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setAddForm((prev) => ({ ...prev, loading: false, error: message }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 antialiased text-slate-800">
      
      {/* Header Block */}
      <div className="md:flex md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Pricing Engine Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Dynamically override tool & tier configurations. Updates trigger asynchronous re-auditing pipelines.
          </p>
        </div>
      </div>

      {/* Grid Layout: Form on Left, Table on Right (Responsively handles dynamic layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Form Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" /> Add New Rate Matrix
          </h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Tool Name</label>
              <input
                type="text"
                placeholder="e.g. Cursor"
                value={addForm.tool}
                onChange={(e) => setAddForm((prev) => ({ ...prev, tool: e.target.value }))}
                required
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                disabled={addForm.loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Plan Variant</label>
              <input
                type="text"
                placeholder="e.g. Pro"
                value={addForm.plan}
                onChange={(e) => setAddForm((prev) => ({ ...prev, plan: e.target.value }))}
                required
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                disabled={addForm.loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Cost Model ($ / mo)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-400 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.price}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                  className={`block w-full rounded-lg border bg-slate-50 py-2 pl-7 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all ${
                    addForm.price !== "" && !isValidPrice(addForm.price) ? "border-red-300 ring-1 ring-red-300" : "border-slate-200"
                  }`}
                  disabled={addForm.loading}
                />
              </div>
              {addForm.price !== "" && !isValidPrice(addForm.price) && (
                <span className="text-xs text-red-500 mt-1 block flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Price cannot be negative.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={addForm.loading || !addForm.tool.trim() || !addForm.plan.trim() || !isValidPrice(addForm.price)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            >
              {addForm.loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Publish Tier"}
            </button>

            {addForm.error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{addForm.error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Pricing Matrix Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Tool Architecture</th>
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4 w-44">Price ($)</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Last Sync</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {entries.map((entry) => {
                  const row = rowStates[entry._id] ?? {
                    editedPrice: String(entry.price),
                    loading: false,
                    error: null,
                    saved: false,
                  };
                  const priceValid = isValidPrice(row.editedPrice);

                  return (
                    <tr key={entry._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{entry.tool}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{entry.plan}</span></td>
                      <td className="px-6 py-4">
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.editedPrice}
                            onChange={(e) => updateRowState(entry._id, { editedPrice: e.target.value, saved: false, error: null })}
                            className={`w-28 rounded-md px-2.5 py-1 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              priceValid ? "border-slate-200 bg-white" : "border-red-300 bg-red-50 focus:ring-red-500/20"
                            }`}
                            disabled={row.loading}
                          />
                        </div>
                        
                        {!priceValid && <p className="text-xs text-red-500 mt-1 font-medium">Invalid total</p>}
                        {row.error && <p className="text-xs text-red-500 mt-1 max-w-xs">{row.error}</p>}
                        {row.saved && <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved!</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 hidden sm:table-cell">
                        {formatDate(entry.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleSave(entry)}
                          disabled={!priceValid || row.loading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {row.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button
                          onClick={() => handleRemove(entry._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white text-red-600 border border-slate-200 text-xs font-medium hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      No matching engine entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Re-Audit Stream Section */}
      {reauditActivity.length > 0 && (
        <div className="pt-8 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-500" /> Pipeline Re-Audit Live Log
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-time calculations automatically generated upon pricing schema configuration updates.
            </p>
          </div>

          <div className="space-y-4">
            {reauditActivity.map((audit) => {
              const latest = audit.history[audit.history.length - 1];
              if (!latest) return null;
              const diff = latest.newTotalMonthlySavings - latest.oldTotalMonthlySavings;

              return (
                <div key={audit.auditId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                  
                  {/* Card Header */}
                  <div className="bg-slate-50/70 border-b border-slate-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{audit.email ?? "Anonymous Target"}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">{audit.auditId}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {diff !== 0 && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          diff > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}>
                          {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {diff > 0 ? "+" : ""}${diff.toFixed(2)}/mo Delta
                        </span>
                      )}
                      {audit.reportId && (
                        <a
                          href={`/report/${audit.reportId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 transition-colors"
                        >
                          Report Matrix <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Body Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    
                    {/* Before Block */}
                    <div className="p-5 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Baseline Performance</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400">Audit Status</p>
                          <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded ${statusBadges[latest.oldStatus]}`}>
                            {latest.oldStatus}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400">Monthly Savings</p>
                          <p className="text-lg font-bold text-slate-800">${latest.oldTotalMonthlySavings}</p>
                          <p className="text-[10px] text-slate-400 font-medium">${latest.oldTotalMonthlySavings * 12}/yr baseline</p>
                        </div>
                      </div>
                    </div>

                    {/* After Block */}
                    <div className="p-5 space-y-4 bg-emerald-50/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Calculated Adjustments</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400">Projected Status</p>
                          <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded ${statusBadges[latest.newStatus]}`}>
                            {latest.newStatus}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400">Recalculated Savings</p>
                          <p className={`text-lg font-bold ${diff > 0 ? "text-emerald-700" : diff < 0 ? "text-red-700" : "text-slate-800"}`}>
                            ${latest.newTotalMonthlySavings}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">${latest.newTotalMonthlySavings * 12}/yr output</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Log Footer Metadata */}
                  <div className="bg-slate-50/40 border-t border-slate-100 px-5 py-2 flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-slate-500 font-medium whitespace-nowrap">Impact factors:</span>
                      <span className="truncate font-mono bg-white border border-slate-200/80 rounded px-1.5 py-0.2 text-[11px] text-slate-600">
                        {latest.changedTools.join(", ") || "Implicit Context recalculation"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0 ml-4">
                      <Clock className="w-3 h-3" /> {formatDate(latest.triggeredAt)}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
