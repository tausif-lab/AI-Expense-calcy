import { Schema, Document, model, models } from "mongoose";

export interface IPricing extends Document {
  tool: string;
  plan: string;
  price: number;
  updatedBy: string;
  updatedAt: Date;
}

const PricingSchema = new Schema<IPricing>(
  {
    tool: { type: String, required: true },
    plan: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    updatedBy: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } },
);

PricingSchema.index({ tool: 1, plan: 1 }, { unique: true });
PricingSchema.index({ tool: 1 });

export const Pricing =
  models.Pricing ||
  model<IPricing>("Pricing", PricingSchema, "OFFICIAL_PRICES");
