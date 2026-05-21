import { NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";
import { OFFICIAL_PRICES } from "@/lib/audit/engine";

export async function POST() {
  await connectDB();
  /*const result = await Audit.updateMany(
    { pricingSnapshot: null },
    { $set: { pricingSnapshot: JSON.parse(JSON.stringify(OFFICIAL_PRICES)) } }
  );*/

  const result = await Audit.updateMany(
    {},
    {
      $set: {
        "pricingSnapshot.Claude.Max 20x": 200, // old price
      },
    }
  );
  return NextResponse.json({ updated: result.modifiedCount });
}