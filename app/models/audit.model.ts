import mongoose, { Schema, Document, model, models } from "mongoose";

const ToolInputSchema = new Schema(
  {
    name: { type: String, required: true },
    plan: { type: String, required: true },
    seats: { type: Number, required: true },
    activeUsers: { type: Number, required: true },
    monthlySpend: { type: Number, required: true },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      required: true,
    },
    contractStatus: {
      type: String,
      enum: ["month-to-month", "in-annual-contract", "contract-ending-soon"],
      required: true,
    },
    intensity: { type: String, required: true },
    usage: { type: String, required: true },
    primaryFeatureUsed: {
      type: String,
      enum: ["autocomplete", "chat", "agents", "api-calls", "docs", "review"],
      required: true,
    },
  },
  { _id: false } // no separate _id per tool subdoc
);

// Add after ToolInputSchema
const ToolFindingSchema = new Schema({
  toolName: { type: String, required: true },
  plan: { type: String, required: true },
  currentSpend: { type: Number, required: true },
  recommendedAction: { type: String, required: true },
  estimatedMonthlySaving: { type: Number, required: true },
  severity: { type: String, enum: ["high", "medium", "low", "optimal"] },
  reason: { type: String, required: true },
}, { _id: false });


export interface IAudit extends Document {
  auditId: string;
  // Step 1 fields
  teamSize: number;
  techTeamSize: number;
  primaryUseCase: string;
  companyStage: string;
  hasApiUsage: boolean;
  // Step 2 fields
  tools: {
    name: string;
    plan: string;
    seats: number;
    activeUsers: number;
    monthlySpend: number;
    billingCycle: "monthly" | "annual";
    contractStatus: "month-to-month" | "in-annual-contract" | "contract-ending-soon";
    intensity: string;
    usage: string;
    primaryFeatureUsed: "autocomplete" | "chat" | "agents" | "api-calls" | "docs" | "review";
  }[];
  // Computed on save
  totalMonthlySpend: number;
  // AI-generated findings
  findings: {
    toolName: string;
    plan: string;
    currentSpend: number;
    recommendedAction: string;
    estimatedMonthlySaving: number;
    severity: "high" | "medium" | "low" | "optimal";
    reason: string;
  }[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isHighSavings: boolean;
  overallStatus: "overspending" | "optimized" | "mixed";
  // Lead capture (added later via separate endpoint)
  email?: string;
  companyName?: string;
  role?: string;
  createdAt: Date;
  aiSummary?: string;
  reportId?: string;
}

const AuditSchema = new Schema<IAudit>(
  {
    auditId: { type: String, required: true, unique: true, index: true },

    // Step 1
    teamSize: { type: Number, required: true },
    techTeamSize: { type: Number, required: true },
    primaryUseCase: { type: String, required: true },
    companyStage: { type: String, default: "" },
    hasApiUsage: { type: Boolean, required: true },

    // Step 2
    tools: { type: [ToolInputSchema], required: true },

    // Derived
    totalMonthlySpend: { type: Number, required: true },

    // Lead capture (optional at creation time)
    email: { type: String, default: null },
    companyName: { type: String, default: null },
    role: { type: String, default: null },
    findings: { type: [ToolFindingSchema], default: [] },
    totalMonthlySavings: { type: Number, default: 0 },
    totalAnnualSavings: { type: Number, default: 0 },
    isHighSavings: { type: Boolean, default: false },
    overallStatus: {
      type: String,
      enum: ["overspending", "optimized", "mixed"],
      default: "mixed",
    },
    aiSummary: { type: String, default: "" },
    reportId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

export const Audit = models.Audit || model<IAudit>("Audit", AuditSchema);