# METRICS.md

## North Star Metric

The primary North Star metric for this product is:

### “High-Savings Qualified Leads Generated Per Week”

A “high-savings qualified lead” means:

* a completed audit
* showing meaningful optimization potential (ex: >$500/month savings)
* with a captured email or consultation request

I chose this metric because the product is fundamentally a B2B lead-generation tool for Credex, not a consumer social app. Raw traffic or daily active users are less meaningful than identifying startups with real infrastructure spending opportunities.

The most valuable outcome is not usage volume alone, but finding companies likely to convert into infrastructure credit customers.

---

## Input Metrics

### 1. Audit Completion Rate

```text id="jlwm5v"
Completed audits ÷ landing page visitors
```

This measures whether the landing page and onboarding flow are convincing enough for users to finish the audit.

A low completion rate likely means:

* too much friction
* unclear value proposition
* overly long form flow

---

### 2. Email Capture Rate

```text id="jlwm5w"
Email captures ÷ completed audits
```

This measures whether users perceive enough value in the audit results to exchange contact information.

Strong audit quality should naturally increase this metric.

---

### 3. Shareable Report Open Rate

```text id="jlwm5x"
Shared report visits ÷ total reports generated
```

This measures whether the product creates organic distribution loops through public audit links and screenshots.

This is important because the product’s growth strategy heavily depends on founder-to-founder sharing.

---

## What I’d Instrument First

The first events I would track are:

* landing page visits
* CTA clicks
* audit started
* audit completed
* report shared
* email submitted
* consultation CTA clicked

I would also track:

* average estimated savings
* most common AI tools
* most common optimization recommendations

These metrics would help identify both product friction and the strongest conversion segments.

---

## Pivot Trigger

The biggest warning sign would be:

```text id="jlwm5y"
<10% audit completion rate
```

after several hundred targeted visitors.

That would suggest users either:

* do not understand the value proposition
* do not trust the audit recommendations
* find the form too time-consuming

Another major pivot signal would be:

* strong traffic
* high audit completion
* but very low consultation interest

That would indicate the product is informational but not commercially valuable enough to drive Credex conversions.
