export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { seedPricingCollection } = await import("@/lib/pricing/seed");
      await seedPricingCollection();
    } catch (err) {
      console.error("[instrumentation] seedPricingCollection failed:", err);
    }

    try {
      const { pricingEmitter, PRICING_CHANGED_EVENT } =
        await import("@/lib/events/pricingEmitter");
      const { processAffectedAudits } = await import("@/lib/pricing/processor");

      function registerPricingListener() {
        pricingEmitter.on(
          PRICING_CHANGED_EVENT,
          (payload: { tool: string }) => {
            processAffectedAudits({ tool: payload.tool }).catch((err) => {
              console.error(
                "[instrumentation] processAffectedAudits failed:",
                err,
              );
            });
          },
        );
      }

      registerPricingListener();
    } catch (err) {
      console.error("[instrumentation] registerPricingListener failed:", err);
    }
  }
}
