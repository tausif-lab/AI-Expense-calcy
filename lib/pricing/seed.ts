import { connectDB } from "@/config/config";
import { Pricing } from "@/app/models/pricing.model";
import { OFFICIAL_PRICES } from "@/lib/audit/engine";

export async function seedPricingCollection(): Promise<void> {
  await connectDB();

  const count = await Pricing.countDocuments();
  if (count > 0) {
    return;
  }

  const docs: {
    tool: string;
    plan: string;
    price: number;
    updatedBy: string;
  }[] = [];

  for (const [tool, plans] of Object.entries(OFFICIAL_PRICES)) {
    for (const [plan, price] of Object.entries(plans)) {
      docs.push({ tool, plan, price, updatedBy: "seed" });
    }
  }

  await Pricing.insertMany(docs);
  console.log(`[seedPricingCollection] Seeded ${docs.length} pricing entries`);
}
