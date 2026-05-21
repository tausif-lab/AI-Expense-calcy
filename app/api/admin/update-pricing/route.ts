import { connectDB } from "@/config/config";
import { Pricing } from "@/app/models/pricing.model";
import {
  pricingEmitter,
  PRICING_CHANGED_EVENT,
  PricingChangedPayload,
} from "@/lib/events/pricingEmitter";

export async function POST(request: Request): Promise<Response> {
  // 1. Parse and validate body
  const body = await request.json();
  const { tool, plan, price, updatedBy } = body;

  if (typeof tool !== "string" || !tool) {
    return new Response(JSON.stringify({ error: "Invalid field: tool" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof plan !== "string" || !plan) {
    return new Response(JSON.stringify({ error: "Invalid field: plan" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof price !== "number" || !isFinite(price) || price < 0) {
    return new Response(JSON.stringify({ error: "Invalid field: price" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof updatedBy !== "string" || !updatedBy) {
    return new Response(JSON.stringify({ error: "Invalid field: updatedBy" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Connect to DB
  await connectDB();

  // 4. Read existing document
  const existing = await Pricing.findOne({ tool, plan }).lean();
  if (!existing) {
    return new Response(
      JSON.stringify({ error: "Pricing entry not found for tool+plan" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const oldPrice = (existing as any).price as number;

  // 5. Upsert
  try {
    await Pricing.updateOne(
      { tool, plan },
      { $set: { price, updatedBy, updatedAt: new Date() } },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Database write failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Emit event
  const updatedAt = new Date();
  pricingEmitter.emit(PRICING_CHANGED_EVENT, {
    tool,
    plan,
    oldPrice,
    newPrice: price,
    updatedBy,
    updatedAt,
  } satisfies PricingChangedPayload);

  // 7. Log
  console.log(
    `[update-pricing] tool=${tool} plan=${plan} oldPrice=${oldPrice} newPrice=${price}`,
  );

  // 8. Return 200
  return new Response(
    JSON.stringify({ success: true, tool, plan, oldPrice, newPrice: price }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
