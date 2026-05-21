"use client";

import { useState } from "react";

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
    // Use explicit format to avoid server/client locale mismatch
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return iso;
  }
}

const statusColor: Record<string, React.CSSProperties> = {
  overspending: {
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
  },
  optimized: {
    color: "#065f46",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
  },
  mixed: {
    color: "#92400e",
    background: "#fffbeb",
    border: "1px solid #fde68a",
  },
};

export default function PricingEditor({
  initialEntries,
  reauditActivity = [],
}: {
  initialEntries: PricingEntry[];
  reauditActivity?: ReauditAudit[];
}) {
  const [entries, setEntries] = useState<PricingEntry[]>(initialEntries);

  // Per-row editing state keyed by _id
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

      // Success — update the entry in local state
      const now = new Date().toISOString();
      setEntries((prev) =>
        prev.map((e) =>
          e._id === entry._id
            ? { ...e, price: Number(row.editedPrice), updatedAt: now }
            : e,
        ),
      );
      updateRowState(entry._id, { loading: false, saved: true, error: null });

      // Clear "Saved!" after 2 seconds
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

      // Append new entry to the table
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

      // Reset form
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
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 900 }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Pricing Editor</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "2rem",
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            <th style={thStyle}>Tool</th>
            <th style={thStyle}>Plan</th>
            <th style={thStyle}>Price ($)</th>
            <th style={thStyle}>Last Updated</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const row = rowStates[entry._id] ?? {
              editedPrice: String(entry.price),
              loading: false,
              error: null,
              saved: false,
            };
            const priceValid = isValidPrice(row.editedPrice);

            return (
              <tr key={entry._id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={tdStyle}>{entry.tool}</td>
                <td style={tdStyle}>{entry.plan}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.editedPrice}
                    onChange={(e) =>
                      updateRowState(entry._id, {
                        editedPrice: e.target.value,
                        saved: false,
                        error: null,
                      })
                    }
                    style={{
                      width: 100,
                      padding: "4px 6px",
                      border: priceValid ? "1px solid #ccc" : "1px solid red",
                      borderRadius: 4,
                    }}
                    disabled={row.loading}
                  />
                  {!priceValid && (
                    <div style={{ color: "red", fontSize: 12, marginTop: 2 }}>
                      Price must be a non-negative number
                    </div>
                  )}
                  {row.error && (
                    <div style={{ color: "red", fontSize: 12, marginTop: 2 }}>
                      {row.error}
                    </div>
                  )}
                  {row.saved && (
                    <div style={{ color: "green", fontSize: 12, marginTop: 2 }}>
                      Saved!
                    </div>
                  )}
                </td>
                <td style={tdStyle}>{formatDate(entry.updatedAt)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleSave(entry)}
                    disabled={!priceValid || row.loading}
                    style={{
                      ...btnStyle,
                      background:
                        !priceValid || row.loading ? "#ccc" : "#0070f3",
                      cursor:
                        !priceValid || row.loading ? "not-allowed" : "pointer",
                      marginRight: 8,
                    }}
                  >
                    {row.loading ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => handleRemove(entry._id)}
                    style={{ ...btnStyle, background: "#e53e3e" }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{ ...tdStyle, textAlign: "center", color: "#888" }}
              >
                No pricing entries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add entry form */}
      <h2 style={{ marginBottom: "1rem" }}>Add Entry</h2>
      <form
        onSubmit={handleAddSubmit}
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Tool name</label>
          <input
            type="text"
            placeholder="e.g. Cursor"
            value={addForm.tool}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, tool: e.target.value }))
            }
            required
            style={inputStyle}
            disabled={addForm.loading}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Plan name</label>
          <input
            type="text"
            placeholder="e.g. Pro"
            value={addForm.plan}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, plan: e.target.value }))
            }
            required
            style={inputStyle}
            disabled={addForm.loading}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={addForm.price}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, price: e.target.value }))
            }
            required
            style={{
              ...inputStyle,
              border:
                addForm.price !== "" && !isValidPrice(addForm.price)
                  ? "1px solid red"
                  : "1px solid #ccc",
            }}
            disabled={addForm.loading}
          />
          {addForm.price !== "" && !isValidPrice(addForm.price) && (
            <span style={{ color: "red", fontSize: 12 }}>
              Price must be a non-negative number
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={
            addForm.loading ||
            !addForm.tool.trim() ||
            !addForm.plan.trim() ||
            !isValidPrice(addForm.price)
          }
          style={{
            ...btnStyle,
            background:
              addForm.loading ||
              !addForm.tool.trim() ||
              !addForm.plan.trim() ||
              !isValidPrice(addForm.price)
                ? "#ccc"
                : "#38a169",
            cursor:
              addForm.loading ||
              !addForm.tool.trim() ||
              !addForm.plan.trim() ||
              !isValidPrice(addForm.price)
                ? "not-allowed"
                : "pointer",
          }}
        >
          {addForm.loading ? "Adding…" : "Submit"}
        </button>
        {addForm.error && (
          <span style={{ color: "red", fontSize: 13, alignSelf: "center" }}>
            {addForm.error}
          </span>
        )}
      </form>

      {/* Re-Audit Activity */}
      {reauditActivity.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: 18 }}>
            Re-Audit Activity
          </h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: "1.5rem" }}>
            Audits that were automatically recalculated after a pricing change.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reauditActivity.map((audit) => {
              const latest = audit.history[audit.history.length - 1];
              if (!latest) return null;
              const diff =
                latest.newTotalMonthlySavings - latest.oldTotalMonthlySavings;
              return (
                <div
                  key={audit.auditId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px 16px",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {audit.email ?? audit.auditId}
                      </span>
                      {audit.email && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginLeft: 8,
                          }}
                        >
                          {audit.auditId}
                        </span>
                      )}
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {diff !== 0 && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "2px 10px",
                            borderRadius: 999,
                            ...(diff > 0
                              ? {
                                  color: "#065f46",
                                  background: "#ecfdf5",
                                  border: "1px solid #a7f3d0",
                                }
                              : {
                                  color: "#b91c1c",
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                }),
                          }}
                        >
                          {diff > 0 ? "+" : ""}${diff}/mo
                        </span>
                      )}
                      {audit.reportId && (
                        <a
                          href={`/report/${audit.reportId}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            color: "#0070f3",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          View Report →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Before / After */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {/* Before */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRight: "1px solid #f3f4f6",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#9ca3af",
                          marginBottom: 8,
                        }}
                      >
                        Before
                      </p>
                      <div style={{ marginBottom: 6 }}>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2,
                          }}
                        >
                          Status
                        </p>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            ...statusColor[latest.oldStatus],
                          }}
                        >
                          {latest.oldStatus}
                        </span>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2,
                          }}
                        >
                          Monthly savings
                        </p>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          ${latest.oldTotalMonthlySavings}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 400,
                              color: "#9ca3af",
                            }}
                          >
                            /mo
                          </span>
                        </p>
                        <p style={{ fontSize: 11, color: "#6b7280" }}>
                          ${latest.oldTotalMonthlySavings * 12}/yr
                        </p>
                      </div>
                    </div>

                    {/* After */}
                    <div
                      style={{ padding: "14px 16px", background: "#f0fdf4" }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#059669",
                          marginBottom: 8,
                        }}
                      >
                        After
                      </p>
                      <div style={{ marginBottom: 6 }}>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2,
                          }}
                        >
                          Status
                        </p>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            ...statusColor[latest.newStatus],
                          }}
                        >
                          {latest.newStatus}
                        </span>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginBottom: 2,
                          }}
                        >
                          Monthly savings
                        </p>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color:
                              diff > 0
                                ? "#065f46"
                                : diff < 0
                                  ? "#b91c1c"
                                  : "#111827",
                          }}
                        >
                          ${latest.newTotalMonthlySavings}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 400,
                              color: "#9ca3af",
                            }}
                          >
                            /mo
                          </span>
                        </p>
                        <p style={{ fontSize: 11, color: "#6b7280" }}>
                          ${latest.newTotalMonthlySavings * 12}/yr
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer: triggered info */}
                  <div
                    style={{
                      padding: "8px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>
                      Triggered by:{" "}
                      <span style={{ fontWeight: 600, color: "#6b7280" }}>
                        {latest.changedTools.join(", ")}
                      </span>
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>
                      {formatDate(latest.triggeredAt)}
                    </p>
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

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: 13,
  borderBottom: "2px solid #ddd",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  verticalAlign: "top",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: 4,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 13,
  width: 140,
};
