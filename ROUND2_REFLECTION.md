1. What was the most uncomfortable tradeoff?

I intentionally avoided full production-grade domain verification for dynamic email delivery.

The assignment window was short. DNS propagation and email infrastructure setup risked blocking completion of core pricing detection.

I prioritized delivering the pricing detection pipeline, audit recalculation flow, and notification system end-to-end instead.

The system still demonstrates the intended behavior while acknowledging infrastructure limitations honestly.

2. If another 24 hours existed, what would you do first?

I would complete production-grade email infrastructure.

Dynamic delivery to audit owners instead of routing through a verified testing email would be the first improvement.

That removes the largest gap between assignment implementation and production readiness.

3. What made Round 2 harder because of Round 1?

Pricing data originally lived directly inside audit logic.

Round 2 required historical snapshots and change detection.

Because pricing behavior was tightly coupled to audit execution, extending historical comparison behavior required additional architectural work.

Separating pricing ownership earlier would have reduced Round 2 complexity.