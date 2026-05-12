# REFLECTION.md

## 1. The hardest bug I hit this week, and how I debugged it

The hardest issue I faced was handling dynamic AI tool forms while keeping the frontend state synced with MongoDB submissions and localStorage persistence. Initially, when users added or removed tool cards, some fields were not updating correctly after page refreshes. My first hypothesis was that React Hook Form state was not syncing properly with dynamically generated inputs. I tried manually controlling every field with useState, but that made the form more complex and buggy.

After debugging the payload structure in the browser console and comparing localStorage data with MongoDB documents, I realized the issue was inconsistent field naming inside dynamically added tool objects. I standardized the schema and switched to a cleaner nested structure. That fixed both persistence and backend submission issues.

---

## 2. A decision you reversed mid-week, and what made you reverse it

Initially, my plan was that when a user entered their email address, the application would automatically send the generated audit report directly to the user through email. I started implementing this workflow using Resend for transactional email delivery.

However, during implementation I realized that proper public email delivery would require registering and verifying a custom domain inside Resend. That process involved additional DNS setup, domain purchase, and verification time, which became a distraction from the core product functionality.

After reviewing the assignment requirements more carefully, I realized the important part was not perfect production-grade email infrastructure, but proving the lead capture and backend notification workflow. I reversed the implementation approach and instead configured the system so that whenever a user submits their email, an admin notification is sent to my configured email address.

This allowed me to:

* demonstrate lead capture successfully
* validate backend email integration
* preserve the consultation/lead-generation workflow
* avoid spending excessive time on domain verification during the MVP stage

The change also aligned more closely with the business goal of the product, since Credex primarily benefits from collecting and reviewing high-savings leads rather than simply emailing reports automatically.

---

## 3. What you would build in week 2 if you had it

If I had another week, I would focus on improving the depth and credibility of the audit system. I would add benchmark analysis such as “AI spend per developer compared to similar startups.” I would also improve the recommendation engine by tracking overlapping tooling categories more intelligently.

On the product side, I would add PDF export support, analytics dashboards, and better onboarding for founders unfamiliar with AI infrastructure pricing. I would also improve public share pages with richer Open Graph previews and more polished visual reporting.

---

## 4. How you used AI tools

I used ChatGPT mainly for research-oriented work, brainstorming features, and improving product ideas. For coding assistance on both frontend and backend, I used Claude as an AI coding assistant. Claude helped speed up repetitive implementation tasks and component generation.

I used Gemini specifically for generating personalized audit reports and summaries. However, I did not fully trust AI-generated research or financial recommendations. Sometimes Gemini failed to provide proper sources for research-based suggestions, and occasionally it generated incorrect recommendations that I had to manually verify and fix.

For frontend and backend coding, Claude sometimes changed API naming conventions or modified the architecture unexpectedly. Many times, the AI did not fully understand the project context, and I had to catch those mistakes manually before integrating the code.

---

## 5. Self-rating

### Discipline — 8/10

I maintained progress across multiple days, kept consistent commits, and avoided cramming everything into one session.

### Code Quality — 8/10

The codebase is structured and readable, though some areas could still be refactored further with more time.

### Design Sense — 8/10

I focused heavily on building a clean SaaS-style interface that matched the product’s startup and fintech positioning.

### Problem-Solving — 8/10

I was able to break down ambiguous requirements into smaller technical systems and iterate through blockers systematically.

### Entrepreneurial Thinking — 8/10

I understood the lead-generation and viral-sharing aspects of the assignment, though I would refine the GTM strategy further with more time.
