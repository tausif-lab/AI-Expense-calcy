# PROMPTS.md

## Purpose of LLM Usage

The LLM was used only for generating personalized audit summaries after the deterministic audit engine completed all pricing calculations and recommendation logic.

I intentionally avoided using AI for financial calculations because pricing recommendations need to remain:

* explainable
* testable
* deterministic
* financially defensible

The backend audit engine handles:

* savings calculations
* recommendation generation
* severity detection
* optimization logic

Gemini is only responsible for converting structured audit data into a readable professional report.

---

# Main Prompt Used

```text id="jlwm5z"
You are a senior AI infrastructure cost analyst writing a formal audit report.

Write a professional 200–250 word audit report for the following client:

CLIENT PROFILE:
- Company stage: ${audit.companyStage}
- Total team size: ${audit.teamSize} people
- Tech team size: ${audit.techTeamSize} people
- Primary use case: ${audit.primaryUseCase}
- Has direct API usage: ${audit.hasApiUsage ? "Yes" : "No"}

AI TOOLS IN USE:
${allTools}

TOTAL MONTHLY AI SPEND: $${audit.totalMonthlySpend} ($${audit.totalMonthlySpend * 12}/yr)
POTENTIAL MONTHLY SAVINGS: $${audit.totalMonthlySavings} ($${audit.totalAnnualSavings}/yr)

KEY FINDINGS:
${topFindings || "No critical issues found. Spend appears optimized."}

INSTRUCTIONS:
- Write in formal report style with clear paragraphs: Executive Summary, Key Findings, Recommendations, Next Steps
- Address the user directly ("your team", "you")
- Use all the numbers above — be specific
- If savings > $200/mo, mention Credex (credex.rocks) as a way to capture savings through discounted AI credits sourced from companies that overforecast
- End with one clear, actionable next step
- Do NOT use bullet points or markdown — plain paragraphs only
- Minimum 200 words
```

---

# Why I Structured The Prompt This Way

I structured the prompt to keep the AI tightly constrained around:

* structured financial inputs
* deterministic recommendations
* consistent formatting
* professional tone

I explicitly passed:

* company size
* use case
* monthly spend
* savings opportunities
* audit findings

to reduce hallucinations and ensure the report remained grounded in actual backend calculations.

The instructions section was intentionally strict because earlier versions of the prompt generated:

* overly generic summaries
* inconsistent formatting
* marketing-heavy language
* unsupported financial claims

Adding formatting instructions and explicit numerical references improved consistency significantly.

---

# What I Tried That Didn’t Work

Initially, I experimented with letting Gemini generate optimization recommendations directly from raw form input data. That approach produced inconsistent and unreliable results.

Common problems included:

* invented pricing assumptions
* unrealistic savings estimates
* contradictory recommendations
* recommendations unsupported by actual pricing logic

I also tested shorter prompts, but they often produced vague summaries that ignored important savings information.

Another failed approach was allowing the AI to freely structure the response. Without formatting constraints, outputs became inconsistent in tone and layout, making the audit page feel less professional.

Because of these issues, I moved all recommendation logic into the backend audit engine and restricted the LLM to summary generation only.

---

# Fallback Strategy

If the Gemini API fails or times out, the application falls back to a deterministic templated summary generated directly from backend audit data.

This ensures:

* report generation never fully fails
* users always receive an audit summary
* API outages do not break the product experience

The fallback summary includes:

* company size
* monthly spend
* total savings
* optimization recommendation
* Credex consultation suggestion for high-savings audits
