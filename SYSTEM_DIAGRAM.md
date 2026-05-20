# Re-Audit System Architecture Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICE CHANGE DETECTION                      │
└─────────────────────────────────────────────────────────────────┘

Developer modifies OFFICIAL_PRICES in code
                    ↓
        lib/audit/engine.ts updated
                    ↓
    Admin triggers price check manually
                    ↓
    POST /api/admin/trigger-price-check
                    ↓
        Calls /api/detect-changes
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DETECT CHANGES LOGIC                         │
└─────────────────────────────────────────────────────────────────┘

Query MongoDB for audits with:
  - pricingSnapshot exists
  - email exists
                    ↓
For each audit:
  ├─ Compare snapshot vs OFFICIAL_PRICES
  ├─ Find changed tools
  └─ Filter to tools in this audit
                    ↓
If changes found:
  ├─ Re-run audit engine
  ├─ Calculate new savings
  ├─ Create history entry
  ├─ Update database
  └─ Send email
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EMAIL NOTIFICATION                         │
└─────────────────────────────────────────────────────────────────┘

Email sent to: tautumhare@gmail.com
Contains:
  ├─ Explanation of what changed
  ├─ Old vs new savings comparison
  ├─ "View Updated Report" button (black)
  └─ "Re-Audit with Latest Data" button (green)
                    ↓
User clicks "Re-Audit" button
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RE-AUDIT ENDPOINT                          │
└─────────────────────────────────────────────────────────────────┘

GET /api/audit/[auditId]/reaudit
                    ↓
Fetch audit from database
                    ↓
Re-run audit engine with:
  - Current OFFICIAL_PRICES
  - User's original tool data
                    ↓
Update database:
  ├─ New findings
  ├─ New savings
  ├─ Updated snapshot
  └─ Add to reAuditHistory
                    ↓
Redirect to /report/[reportId]
                    ↓
User sees updated report
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Audit Document                           │
└─────────────────────────────────────────────────────────────────┘

{
  auditId: "abc123",                    // Unique identifier
  email: "tautumhare@gmail.com",        // User email
  reportId: "xyz789",                   // Public report ID
  
  // Original audit data
  teamSize: 10,
  techTeamSize: 5,
  primaryUseCase: "Coding",
  tools: [
    {
      name: "Cursor",
      plan: "Pro",
      seats: 5,
      activeUsers: 4,
      monthlySpend: 100,
      // ... other fields
    }
  ],
  
  // Current findings
  findings: [
    {
      toolName: "Cursor",
      recommendedAction: "Remove 1 unused seat",
      estimatedMonthlySaving: 20,
      severity: "medium",
      // ... other fields
    }
  ],
  totalMonthlySavings: 20,
  totalAnnualSavings: 240,
  
  // Pricing snapshot (for change detection)
  pricingSnapshot: {
    "Cursor": {
      "Hobby": 0,
      "Pro": 20,        // ← This is what we compare
      "Business": 40
    },
    "GitHub Copilot": { ... },
    // ... other tools
  },
  
  // Re-audit history (audit trail)
  reAuditHistory: [
    {
      triggeredAt: "2026-05-20T10:30:00Z",
      changedTools: ["Cursor"],
      oldFindings: [ ... ],
      newFindings: [ ... ],
      oldTotalMonthlySavings: 20,
      newTotalMonthlySavings: 45
    },
    // ... more entries as prices change
  ],
  
  createdAt: "2026-05-19T14:00:00Z",
  updatedAt: "2026-05-20T10:30:00Z"
}
```

---

## Email Template Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔔 PRICING CHANGE ALERT                                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  AI tool pricing has changed                             │ │
│  │                                                           │ │
│  │  Pricing changed for: Cursor                             │ │
│  │                                                           │ │
│  │  Why this matters:                                       │ │
│  │  Your potential savings increased by $25/mo due to       │ │
│  │  this change. We've automatically updated your audit     │ │
│  │  with the latest pricing data.                           │ │
│  │                                                           │ │
│  │  ┌─────────────────┐    ┌─────────────────┐             │ │
│  │  │  Previous       │    │  Updated        │             │ │
│  │  │  Savings        │    │  Savings        │             │ │
│  │  │                 │    │                 │             │ │
│  │  │  $20/mo         │    │  $45/mo         │             │ │
│  │  └─────────────────┘    └─────────────────┘             │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  View Updated Report →                              │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Re-Audit with Latest Data →                        │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Click "Re-Audit" to run a fresh analysis with your     │ │
│  │  current tool usage and the new pricing.                │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Credex · credex.rocks                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         API ROUTES                              │
└─────────────────────────────────────────────────────────────────┘

/api/
├── audit/
│   ├── POST /                          Create new audit
│   └── [auditId]/
│       ├── GET /reaudit                ✅ NEW: Re-run audit
│       └── report/
│           └── POST /                  Generate report + email
│
├── detect-changes/
│   └── POST /                          ✅ UPDATED: Check prices
│
└── admin/
    ├── trigger-price-check/
    │   └── POST /                      ✅ NEW: Manual trigger
    └── backfill-snapshots/
        └── POST /                      (existing)

Legend:
✅ NEW      = Created for this feature
✅ UPDATED  = Modified for this feature
(existing)  = Already existed
```

---

## State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIT LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────┘

[1] User creates audit
        ↓
    ┌───────────┐
    │  CREATED  │  - Initial findings calculated
    │           │  - pricingSnapshot = null
    └───────────┘  - reAuditHistory = []
        ↓
[2] User requests report
        ↓
    ┌───────────┐
    │  EMAILED  │  - Email sent to user
    │           │  - reportId generated
    └───────────┘  - pricingSnapshot saved
        ↓
[3] Price changes in code
        ↓
    ┌───────────┐
    │ OUTDATED  │  - Snapshot ≠ OFFICIAL_PRICES
    │           │  - Detected by /api/detect-changes
    └───────────┘  - Email sent to user
        ↓
[4] User clicks re-audit OR system auto-updates
        ↓
    ┌───────────┐
    │  UPDATED  │  - New findings calculated
    │           │  - pricingSnapshot updated
    └───────────┘  - reAuditHistory += new entry
        ↓
    (cycle repeats from step 3)
```

---

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                   SYSTEM COMPONENTS                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │
│  (Next.js)   │
└──────┬───────┘
       │
       │ HTTP Requests
       ↓
┌──────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Audit    │  │  Detect    │  │  Re-Audit  │           │
│  │  Creation  │  │  Changes   │  │  Endpoint  │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │               │               │                    │
└────────┼───────────────┼───────────────┼────────────────────┘
         │               │               │
         ↓               ↓               ↓
┌──────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Audit Engine (lib/audit/engine.ts)             │ │
│  │                                                        │ │
│  │  - OFFICIAL_PRICES (source of truth)                  │ │
│  │  - runAuditEngine() (calculates findings)             │ │
│  │  - analyzeTool() (per-tool analysis)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└────────┬───────────────┬───────────────┬────────────────────┘
         │               │               │
         ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │    Resend    │  │    Gemini    │
│  (Database)  │  │   (Email)    │  │     (AI)     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Data Flow Example

```
┌─────────────────────────────────────────────────────────────────┐
│              EXAMPLE: Cursor Price Increase                     │
└─────────────────────────────────────────────────────────────────┘

[Initial State]
OFFICIAL_PRICES.Cursor.Pro = $20
User's audit:
  - 5 seats × $20 = $100/mo
  - 1 unused seat
  - Savings: $20/mo
  - pricingSnapshot.Cursor.Pro = $20

        ↓ TIME PASSES ↓

[Price Change]
Developer updates code:
OFFICIAL_PRICES.Cursor.Pro = $25

        ↓

[Detection]
Admin triggers: POST /api/admin/trigger-price-check
  ↓
System calls: POST /api/detect-changes
  ↓
Query finds user's audit
  ↓
Compare:
  snapshot.Cursor.Pro ($20) ≠ current.Cursor.Pro ($25)
  ↓
Changed tools: ["Cursor"]

        ↓

[Re-Calculation]
Re-run audit engine:
  - 5 seats × $25 = $125/mo (new spend)
  - 1 unused seat × $25 = $25/mo (new saving)
  - Total savings: $25/mo (was $20/mo)

        ↓

[Database Update]
Update audit:
  findings: [new recommendations]
  totalMonthlySavings: $25 (was $20)
  pricingSnapshot.Cursor.Pro: $25 (was $20)
  reAuditHistory: [
    {
      triggeredAt: now,
      changedTools: ["Cursor"],
      oldTotalMonthlySavings: $20,
      newTotalMonthlySavings: $25
    }
  ]

        ↓

[Email Sent]
To: tautumhare@gmail.com
Subject: Pricing update detected
Body:
  - "Cursor pricing changed"
  - "Old savings: $20/mo"
  - "New savings: $25/mo"
  - [View Report] button
  - [Re-Audit] button

        ↓

[User Action]
User clicks [Re-Audit] button
  ↓
GET /api/audit/abc123/reaudit
  ↓
Re-runs audit (in case user's data changed)
  ↓
Redirects to /report/xyz789
  ↓
User sees updated report
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                             │
└─────────────────────────────────────────────────────────────────┘

[Scenario 1: Email Delivery Fails]
detect-changes runs
  ↓
Email send fails (Resend error)
  ↓
Catch error, log to console
  ↓
Continue processing other audits
  ↓
Return success with affected count
(Email failure doesn't break the flow)

        ↓

[Scenario 2: Audit Not Found]
User clicks re-audit link
  ↓
GET /api/audit/invalid-id/reaudit
  ↓
Query returns null
  ↓
Return 404 error
  ↓
User sees error page

        ↓

[Scenario 3: Database Connection Fails]
detect-changes runs
  ↓
connectDB() fails
  ↓
Catch error in try-catch
  ↓
Return 500 error
  ↓
Admin sees error in logs

        ↓

[Scenario 4: No Audits to Process]
detect-changes runs
  ↓
Query returns empty array
  ↓
affectedUsers = 0
  ↓
Return success with 0 count
(Not an error, just no work to do)
```

---

## Future Architecture (Phase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                  SCALABLE ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

[Current: Synchronous]
Admin trigger → Process all audits → Send all emails
(Works for <100 audits)

        ↓ UPGRADE TO ↓

[Future: Queue-Based]

Admin trigger
  ↓
Add job to queue (BullMQ)
  ↓
┌─────────────────────────────────────────────────────────────┐
│                      Job Queue                              │
│                                                             │
│  [Job 1: Check audit abc123]                               │
│  [Job 2: Check audit def456]                               │
│  [Job 3: Check audit ghi789]                               │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
  ↓
Worker processes jobs in parallel
  ↓
Each job:
  - Checks one audit
  - Re-runs if needed
  - Sends email
  - Updates database
  ↓
Results aggregated
  ↓
Admin sees summary

Benefits:
- Handles thousands of audits
- Parallel processing
- Retry failed jobs
- Rate limiting built-in
- Better monitoring
```

---

## Monitoring Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                    METRICS TO TRACK                             │
└─────────────────────────────────────────────────────────────────┘

Email Performance:
├─ Delivery rate: 99.5%
├─ Open rate: 42%
├─ Click-through rate (Re-Audit): 18%
└─ Bounce rate: 0.5%

Re-Audit Activity:
├─ Total re-audits triggered: 156
├─ Automatic (price change): 120
├─ Manual (user initiated): 36
└─ Average time to re-audit: 1.2 seconds

Price Changes:
├─ Total price changes detected: 8
├─ Tools affected: Cursor, ChatGPT, Claude
├─ Audits affected: 120
└─ Average savings change: +$15/mo

System Health:
├─ API response time: 250ms avg
├─ Database query time: 50ms avg
├─ Email send time: 500ms avg
└─ Error rate: 0.1%
```

This visual documentation should help anyone understand the system architecture and data flow!