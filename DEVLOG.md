# DEVLOG.md

## Day 1 — 2026-05-06

**Hours worked:** 1

**What I did:**
Received the Credex assignment in the evening and carefully read through the entire specification document. Broke down the requirements into MVP features, engineering deliverables, entrepreneurial deliverables, and infrastructure tasks. Started understanding the actual product problem instead of treating it as only a coding assignment.

**What I learned:**
The assignment is more focused on shipping a believable product and documenting engineering decisions than building a technically complex system. I also learned that the audit logic should be deterministic and explainable rather than fully AI-driven.

**Blockers / what I'm stuck on:**
Initially struggled to understand the complete user flow, especially how the shareable audit report and lead capture system were supposed to work together.

**Plan for tomorrow:**
Research competitors, AI infrastructure pricing, startup tooling workflows, and define the overall architecture and product direction.

---

## Day 2 — 2026-05-07

**Hours worked:** 2

**What I did:**
Researched the AI tooling ecosystem including Cursor, ChatGPT, Claude, Gemini, Copilot, and AI infrastructure pricing. Studied how startups typically spend money on AI subscriptions and APIs. Brainstormed the audit logic structure and recommendation flow. Planned the frontend and backend stack using Next.js, MongoDB, Gemini API, and Resend.

**What I learned:**
Most startups overpay because of duplicated tools, unused seats, wrong plans, and monthly billing inefficiencies. I also learned that the hardest part of the assignment is making the audit recommendations feel financially believable.

**Blockers / what I'm stuck on:**
Spent time deciding whether to use AI for recommendation logic or only for summary generation. Eventually decided to keep the audit engine rule-based for consistency and explainability.

**Plan for tomorrow:**
Initialize the project, configure the environment, deploy the first version, and build the landing page.

---

## Day 3 — 2026-05-08

**Hours worked:** 2

**What I did:**
Initialized the Next.js project with TypeScript and Tailwind CSS. Configured the project structure and deployed the initial version to Vercel. Built the first version of the landing page with a startup-style SaaS UI. Implemented the primary CTA flow directing users toward the AI spend audit form.

**What I learned:**
A clean and minimal landing page creates significantly better perceived product quality than trying to overdesign everything. Also learned more about responsive layout optimization and component organization in Next.js App Router.

**Blockers / what I'm stuck on:**
Spent extra time refining the visual hierarchy and CTA positioning to make the product feel more polished and conversion-oriented.

**Plan for tomorrow:**
Build the audit form system, add dynamic tool inputs, connect MongoDB, and implement backend submission handling.

---

## Day 4 — 2026-05-09

**Hours worked:** 3

**What I did:**
Implemented the dynamic AI tool input system and improved the form UX. Added backend integration for storing audit submissions in MongoDB. Designed the audit data schema and connected frontend form submissions with backend API routes. Added additional fields such as active users, billing cycle, usage intensity, and contract status to improve recommendation quality.

**What I learned:**
The quality of the audit engine depends heavily on the quality of the input structure. Adding fields like active users and billing cycle made the recommendation logic much more realistic and defensible.

**Blockers / what I'm stuck on:**
Managing dynamic tool cards cleanly in the frontend while maintaining validation and persistence became more complex than expected.

**Plan for tomorrow:**
Build the pricing data structure, implement the audit recommendation engine, and integrate Gemini-generated summaries.

---

## Day 5 — 2026-05-10

**Hours worked:** 3

**What I did:**
Created the PRICING_DATA.md structure and collected official pricing references for supported AI tools. Implemented the backend audit engine using deterministic recommendation rules. Connected the audit engine to the frontend and generated structured audit results. Integrated Gemini API to generate personalized audit summaries based on the calculated report data.

**What I learned:**
The most important architectural decision was separating deterministic financial calculations from AI-generated summaries. The backend engine handles all calculations while Gemini only improves readability and personalization.

**Blockers / what I'm stuck on:**
Balancing recommendation accuracy with simplicity was difficult. I had to avoid making the audit logic overly complicated while still keeping the output believable.

**Plan for tomorrow:**
Implement email delivery, report sharing flow, and complete the ARCHITECTURE.md documentation.

---

## Day 6 — 2026-05-11

**Hours worked:** 2

**What I did:**
Integrated Resend for transactional email delivery. Implemented the report email flow and generated shareable audit URLs. Worked on the overall architecture documentation including data flow, scaling considerations, and stack justification. Improved backend structure and clarified how audit reports move through the system.

**What I learned:**
The shareable report system is not just a technical feature but also a growth mechanism. Public audit URLs allow users to share savings reports, which creates a lightweight viral loop for product discovery.

**Blockers / what I'm stuck on:**
Spent time understanding the best approach for generating report URLs dynamically without hardcoding environment-specific domains.

**Plan for tomorrow:**
Improve audit result UI, add tests for the audit engine, polish responsiveness, complete remaining documentation files, and finalize deployment quality.
