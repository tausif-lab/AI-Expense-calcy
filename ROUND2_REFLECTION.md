## 1. What was the most uncomfortable tradeoff?

The most uncomfortable tradeoff was email infrastructure.

A production-ready implementation would send pricing-change notifications directly to each audit owner using a fully verified email domain and production email configuration.

Given the assignment timeline, completing DNS setup, domain verification, and validating the full email delivery pipeline risked delaying core functionality.

I prioritized shipping the end-to-end pricing detection workflow first:

Pricing change detection

↓

Audit recalculation

↓

History tracking

↓

Email notification pipeline

↓

Re-audit experience

The current implementation demonstrates the intended system behavior while acknowledging infrastructure limitations that would need completion before production deployment.

---

## 2. If another 24 hours existed, what would you do first?

The first improvement would be completing production-grade email infrastructure.

The current implementation validates notification behavior, but the next step would be enabling fully dynamic email delivery directly to audit owners through verified production email infrastructure.

Additional improvements:

- Retry handling for failed email delivery
- Queue-based processing for large audit volumes
- Additional automated integration testing
- Monitoring and observability around pricing-triggered re-audits

The email system is currently the largest gap between assignment implementation and production readiness.

---

## 3. What made Round 2 harder because of Round 1?

Pricing ownership originally lived directly inside audit execution logic.

That architecture worked well for static audit generation, but Round 2 introduced historical pricing snapshots, pricing change detection, audit invalidation, and re-audit history tracking.

Because pricing and audit execution were tightly coupled, extending the system required additional architectural changes to support historical comparison and event-driven recalculation.

Separating pricing management earlier would have reduced implementation complexity and improved extensibility for future pricing-driven features.
