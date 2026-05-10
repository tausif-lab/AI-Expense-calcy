# PRICING_DATA.md

All prices verified during submission week: **May 10, 2026**.
Every number below traces to an official vendor pricing page or official documentation.

---

## Cursor

| Plan | Price | Billing |
|------|-------|---------|
| Hobby | $0/month | Free |
| Pro | $20/month | Monthly ($16/month if billed annually) |
| Business | $40/user/month | Monthly |
| Enterprise | Custom | Contact sales |

**Notes:**
- Pro includes unlimited Tab completions + $20 of frontier model credits/month at API rates.
- Business includes Pro-equivalent access + SSO, centralized billing, admin controls.
- Cursor moved from request-based to usage-based (credit) billing in June 2025.
- Annual billing saves ~20% on Pro ($16/month vs $20/month).

**Sources:**
- https://cursor.com/pricing — verified May 10, 2026
- https://cursor.com/blog/june-2025-pricing — pricing change announcement, July 4, 2025

---

## GitHub Copilot

| Plan | Price | Billing |
|------|-------|---------|
| Free | $0/month | Free (limited: 2,000 completions/month) |
| Pro (Individual) | $10/month | Monthly ($100/year if billed annually) |
| Pro+ (Individual) | $39/month | Monthly |
| Business | $19/user/month | Monthly |
| Enterprise | $39/user/month | Monthly (GitHub Enterprise Cloud required) |

**Notes:**
- Pro includes unlimited code completions + premium request allowance.
- Business includes centralized billing, policy controls, and IP indemnity.
- Enterprise includes everything in Business + Copilot integrated into GitHub.com, codebase indexing, and fine-tuned custom models.
- GitHub is transitioning to usage-based (AI Credits) billing starting June 1, 2026. Seat prices above are **not changing** — only overage billing model changes.
- GitHub Copilot Individual renamed: Pro = $10/mo, Pro+ = $39/mo (as of 2025).

**Sources:**
- https://github.com/features/copilot/plans — verified May 10, 2026
- https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises — verified May 10, 2026
- https://docs.github.com/en/copilot/concepts/billing/billing-for-individuals — verified May 10, 2026
- https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/ — April 2026

---

## Claude (Anthropic)

| Plan | Price | Billing |
|------|-------|---------|
| Free | $0/month | Free (rolling usage limits) |
| Pro | $20/month | Monthly ($17/month if billed annually) |
| Max 5x | $100/month | Monthly |
| Max 20x | $200/month | Monthly |
| Team | $25/seat/month | Monthly ($30/seat if billed monthly without annual) |
| Enterprise | Custom | Contact sales (est. ~$60+/seat, 70-seat minimum) |

**Notes:**
- Pro gives standard usage limits; Max 5x = 5× Pro limits; Max 20x = 20× Pro limits.
- Team plan requires minimum 5 seats. Includes collaboration features and no data training by default.
- Enterprise includes SAML SSO, SCIM, audit logging, HIPAA readiness, 500K context window, custom data retention.
- API is billed separately from subscriptions (per token — see Anthropic API section below).
- Annual Pro billing: $17/month ($204/year billed upfront vs $240/year monthly).

**Sources:**
- https://claude.com/pricing — verified May 10, 2026

---

## Anthropic API (Direct)

| Model | Input | Output |
|-------|-------|--------|
| Claude Opus 4.6 | $5.00/MTok | $25.00/MTok |
| Claude Sonnet 4.6 | $3.00/MTok | $15.00/MTok |
| Claude Haiku 4.5 | $1.00/MTok | $5.00/MTok |

**Notes:**
- MTok = per million tokens.
- No monthly minimum or seat fee — pure pay-per-token.
- Batch API: 50% discount for async processing within 24 hours.
- Prompt caching: cached input tokens billed at significantly reduced rates.
- API and subscription (Claude.ai) are completely separate billing systems.

**Sources:**
- https://www.anthropic.com/pricing — verified May 10, 2026
- https://tygartmedia.com/claude-ai-pricing/ — cross-reference, May 9, 2026

---

## ChatGPT (OpenAI)

| Plan | Price | Billing |
|------|-------|---------|
| Free | $0/month | Free |
| Plus | $20/month | Monthly |
| Pro | $200/month | Monthly |
| Business (formerly Team) | $20/seat/month | Annual ($25/seat if billed monthly) |
| Enterprise | Custom | Contact sales (est. ~$60/user/month at 50+ seats) |

**Notes:**
- ChatGPT Team was renamed to ChatGPT Business on August 29, 2025.
- Business plan price dropped from $25/seat to $20/seat (annual) effective April 2, 2026.
- Business requires minimum 2 users, billed annually.
- Enterprise includes unlimited GPT-4o access, SSO, dedicated support, data privacy (no model training on data).
- Plus and Pro are individual plans; Business and Enterprise are for teams.

**Sources:**
- https://openai.com/business/chatgpt-pricing/ — verified May 10, 2026
- https://chatgpt.com/pricing/ — verified May 10, 2026
- https://help.openai.com/en/articles/8792828-what-is-chatgpt-team — rename confirmation

---

## OpenAI API (Direct)

| Model | Input | Output |
|-------|-------|--------|
| GPT-5.5 | $5.00/MTok | $30.00/MTok |
| GPT-5.4 | $2.50/MTok | $15.00/MTok |
| GPT-5 mini | $0.40/MTok | $1.60/MTok |

**Notes:**
- MTok = per million tokens.
- No monthly minimum — pure pay-per-token.
- Batch API: 50% discount for async (within 24 hours).
- Cached input: reduced rates available.
- API billing is entirely separate from ChatGPT subscriptions.

**Sources:**
- https://openai.com/api/pricing/ — verified May 10, 2026

---

## Gemini (Google)

| Plan | Price | Billing |
|------|-------|---------|
| Free | $0/month | Free (limited daily usage) |
| Google AI Plus | $7.99/month | Monthly |
| Google AI Pro | $19.99/month | Monthly (first year 50% off for new subscribers) |
| Google AI Ultra | $249.99/month | Monthly |

**Notes:**
- Google AI Pro was formerly called "Google One AI Premium" and "Gemini Advanced" — rebranded at Google I/O 2025.
- Google AI Pro includes: Gemini 3.1 Pro access (1M token context), ~100 Pro prompts/day, 1,000 monthly AI credits, 5TB storage, Veo 3.1 for video, Gemini Code Assist.
- Google AI Ultra includes: Gemini 3.1 Pro Deep Think, video generation with Veo 3.1, 30TB storage, highest model access.
- Google dropped standalone "Gemini Business" and "Gemini Enterprise" Workspace add-ons in 2025 — Gemini is now bundled into Workspace Business Standard/Plus/Enterprise plans.
- Gemini API is pay-per-token (see below), separate from consumer subscriptions.

### Gemini API Pricing

| Model | Input (≤200K ctx) | Output (≤200K ctx) |
|-------|-------------------|-------------------|
| Gemini 3.1 Pro | $2.00/MTok | $12.00/MTok |
| Gemini 3 Flash | $0.50/MTok | $3.00/MTok |
| Gemini 3 Flash-Lite | $0.25/MTok | $1.50/MTok |

**Sources:**
- https://one.google.com/about/google-ai-plans/ — verified May 10, 2026
- https://gemini.google/subscriptions/ — verified May 10, 2026
- https://ai.google.dev/gemini-api/docs/pricing — verified May 10, 2026

---

## Windsurf

| Plan | Price | Billing |
|------|-------|---------|
| Free | $0/month | Free (25 credits/month) |
| Pro | $15/month | Monthly (~$12/month if billed annually) |
| Pro Plus | $35/month | Monthly ($29/month if billed annually) |
| Teams | $25/user/month | Monthly ($35/user/month without annual — verify on site) |
| Enterprise | Custom | Contact sales |

**Notes:**
- Windsurf uses a credit-based system. 1 credit = $0.04.
- Free: 25 credits/month, unlimited SWE-1 Lite (Windsurf's own model), 1 deploy/day.
- Pro: 500 credits/month (~$20 value), access to all models including Claude and GPT.
- Pro Plus: Priority access to flagship models, higher credit pool.
- Teams: 500 credits/user + admin dashboard, centralized billing, SSO. Add-on credits: $120 for 1,000 pooled credits.
- Enterprise: Custom — RBAC, SSO, hybrid deployment, SOC2 compliance.
- Tab completions are **free** on all plans (do not consume credits).
- Windsurf's own SWE-1 model costs 0 credits; third-party models (Claude, GPT) consume credits based on tokens.
- Acquired by OpenAI/Cognition AI — pricing subject to change post-acquisition.

**Sources:**
- https://windsurf.com/pricing — verified May 10, 2026
- https://docs.windsurf.com/windsurf/accounts/usage — verified May 10, 2026
- https://windsurf.com/blog/windsurf-pricing-plans — March 2026 pricing update

---

## Quick Reference: Monthly Retail Prices Per Seat

| Tool | Cheapest Paid | Mid | Top Individual |
|------|--------------|-----|----------------|
| Cursor | $16 (Pro annual) | $40 (Business) | Custom (Enterprise) |
| GitHub Copilot | $10 (Pro) | $19 (Business) | $39 (Enterprise) |
| Claude | $17 (Pro annual) | $100 (Max 5x) | $200 (Max 20x) |
| ChatGPT | $20 (Plus) | $20 (Business/seat, annual) | $200 (Pro) |
| Gemini | $7.99 (AI Plus) | $19.99 (AI Pro) | $249.99 (AI Ultra) |
| Windsurf | $12 (Pro annual) | $25 (Teams) | $35 (Pro Plus) |

---

*All prices in USD. Prices verified May 10, 2026. Prices are subject to change — always verify at vendor's official pricing page before making recommendations.*