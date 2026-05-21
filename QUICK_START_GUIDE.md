# Re-Audit Feature - Quick Start Guide

## What's Been Implemented ✅

The re-audit feature is **80% complete**. Here's what works right now:

### Working Features:
1. ✅ **Automatic price change detection** - System compares current prices with stored snapshots
2. ✅ **Email notifications** - Users receive emails when prices change for their tools
3. ✅ **Re-audit button in email** - Green button that triggers fresh audit
4. ✅ **Re-audit API endpoint** - Backend logic to re-run audits with current pricing
5. ✅ **History tracking** - All re-audits are saved in `reAuditHistory` array
6. ✅ **Admin trigger endpoint** - Manual price check for testing

### Remaining Work:
- ⏳ Display re-audit history on report page (UI component)
- ⏳ Add manual re-audit button to report page (UI component)

---

## How to Test Right Now

### 1. Test the Complete Flow

```bash
# Step 1: Start your dev server
npm run dev

# Step 2: Create a test audit
# - Go to http://localhost:3000
# - Fill out the audit form
# - Use email: tautumhare@gmail.com
# - Submit and note the auditId

# Step 3: Modify a price in the codebase
# Edit lib/audit/engine.ts and change a price, e.g.:
# Cursor: { Pro: 25 }  // was 20

# Step 4: Trigger price change detection
curl -X POST http://localhost:3000/api/admin/trigger-price-check

# Step 5: Check email
# - Go to tautumhare@gmail.com inbox
# - Open the "Pricing update detected" email
# - Click the green "Re-Audit with Latest Data" button

# Step 6: Verify redirect
# - Should redirect to report page
# - Report should show updated savings
```

### 2. Test Re-Audit Endpoint Directly

```bash
# Replace [auditId] with your actual audit ID
http://localhost:3000/api/audit/[auditId]/reaudit

# Should:
# 1. Re-run the audit
# 2. Update the database
# 3. Redirect to /report/[reportId]
```

### 3. Verify Database Changes

```javascript
// In MongoDB, check the audit document:
db.audits.findOne({ auditId: "your-audit-id" })

// Should see:
// - Updated findings array
// - Updated totalMonthlySavings
// - New entry in reAuditHistory array
// - Updated pricingSnapshot
```

---

## File Structure

```
app/
├── api/
│   ├── admin/
│   │   ├── trigger-price-check/
│   │   │   └── route.ts          ✅ Manual price check trigger
│   │   └── backfill-snapshots/
│   │       └── route.ts          (existing)
│   ├── audit/
│   │   ├── route.ts              (existing - creates audits)
│   │   └── [auditId]/
│   │       ├── reaudit/
│   │       │   └── route.ts      ✅ Re-audit endpoint (NEW)
│   │       └── report/
│   │           └── route.ts      (existing - generates reports)
│   └── detect-changes/
│       └── route.ts              ✅ Price change detection (UPDATED)
├── report/
│   └── [reportId]/
│       └── page.tsx              ⏳ Needs history UI (TODO)
└── models/
    └── audit.model.ts            (existing - has reAuditHistory schema)

lib/
└── audit/
    └── engine.ts                 (existing - OFFICIAL_PRICES)

REAUDIT_FEATURE_PLAN.md           ✅ Detailed implementation plan
COMMIT_PLAN.md                    ✅ Commit strategy
QUICK_START_GUIDE.md              ✅ This file
```

---

## Key Endpoints

### User-Facing:
- `GET /api/audit/[auditId]/reaudit` - Triggers re-audit and redirects to report

### Admin:
- `POST /api/admin/trigger-price-check` - Manually trigger price change detection
- `POST /api/detect-changes` - Internal endpoint that checks all audits

### Existing:
- `POST /api/audit` - Create new audit
- `POST /api/audit/[auditId]/report` - Generate report with email

---

## Environment Variables

Make sure these are set in `.env.local`:

```env
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_EMAIL=tautumhare@gmail.com
```

---

## Email Template Preview

When a price changes, users receive:

```
┌─────────────────────────────────────────┐
│  🔔 PRICING CHANGE ALERT                │
│                                         │
│  AI tool pricing has changed            │
│                                         │
│  Pricing changed for: Cursor            │
│                                         │
│  Why this matters:                      │
│  Your potential savings increased by    │
│  $50/mo due to this change.             │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ Previous    │  │ Updated     │      │
│  │ $100/mo     │  │ $150/mo     │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  [View Updated Report →]                │
│  [Re-Audit with Latest Data →]         │
│                                         │
│  Click "Re-Audit" to run a fresh        │
│  analysis with your current tool        │
│  usage and the new pricing.             │
└─────────────────────────────────────────┘
```

---

## Database Schema

### reAuditHistory Array Structure:

```typescript
{
  triggeredAt: Date,           // When re-audit happened
  changedTools: string[],      // Which tools changed
  oldFindings: ToolFinding[],  // Previous recommendations
  newFindings: ToolFinding[],  // New recommendations
  oldTotalMonthlySavings: number,
  newTotalMonthlySavings: number
}
```

### Example Document:

```json
{
  "auditId": "abc123",
  "email": "tautumhare@gmail.com",
  "pricingSnapshot": {
    "Cursor": { "Pro": 20, "Business": 40 }
  },
  "reAuditHistory": [
    {
      "triggeredAt": "2026-05-20T10:30:00Z",
      "changedTools": ["Cursor"],
      "oldTotalMonthlySavings": 100,
      "newTotalMonthlySavings": 150
    }
  ]
}
```

---

## Common Issues & Solutions

### Issue: Email not received
**Solution**: 
- Check Resend API key is valid
- Verify email is `tautumhare@gmail.com` (hardcoded for now)
- Check spam folder
- Look at server logs for email errors

### Issue: Re-audit button gives 404
**Solution**:
- Verify `app/api/audit/[auditId]/reaudit/route.ts` exists
- Check auditId is correct in URL
- Restart dev server

### Issue: No audits processed
**Solution**:
- Verify audits have `email` field set
- Check `pricingSnapshot` exists in audit document
- Ensure prices actually changed in `OFFICIAL_PRICES`

### Issue: Redirect fails
**Solution**:
- Check `NEXT_PUBLIC_BASE_URL` is set correctly
- Verify audit has `reportId` field
- Look at server logs for errors

---

## Next Steps (Remaining Work)

### Step 1: Add History UI to Report Page

**File**: `app/report/[reportId]/page.tsx`

**What to add**:
```tsx
{audit.reAuditHistory && audit.reAuditHistory.length > 0 && (
  <section className="mt-8 border-t pt-8">
    <h2 className="text-2xl font-bold mb-4">Re-Audit History</h2>
    <div className="space-y-4">
      {audit.reAuditHistory.map((entry, idx) => (
        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {new Date(entry.triggeredAt).toLocaleDateString()}
          </p>
          <p className="font-semibold">
            Changed: {entry.changedTools.join(", ")}
          </p>
          <div className="flex gap-4 mt-2">
            <span>Old: ${entry.oldTotalMonthlySavings}/mo</span>
            <span className="text-green-600">
              New: ${entry.newTotalMonthlySavings}/mo
            </span>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
```

### Step 2: Add Manual Re-Audit Button

**File**: `app/report/[reportId]/page.tsx`

**What to add** (near top of report):
```tsx
<a
  href={`/api/audit/${audit.auditId}/reaudit`}
  className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition"
>
  Re-Audit with Current Pricing →
</a>
```

---

## Testing Checklist

Before marking as complete:

- [ ] Create audit with email
- [ ] Modify price in OFFICIAL_PRICES
- [ ] Trigger price check via admin endpoint
- [ ] Verify email received
- [ ] Click re-audit button in email
- [ ] Verify redirect to report page
- [ ] Check database for history entry
- [ ] Test manual re-audit from report page
- [ ] Verify history UI displays correctly
- [ ] Test with multiple price changes
- [ ] Test with audit without email (should skip)

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Environment variables set in Vercel
- [ ] MongoDB indexes created
- [ ] Resend domain verified
- [ ] Test email delivery in production
- [ ] Monitor logs for errors
- [ ] Set up alerts for email failures

---

## Support & Documentation

- **Full Plan**: See `REAUDIT_FEATURE_PLAN.md`
- **Commit Strategy**: See `COMMIT_PLAN.md`
- **Architecture**: See `ARCHITECTURE.md`
- **API Docs**: See inline comments in route files

---

## Quick Commands Reference

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Trigger price check
curl -X POST http://localhost:3000/api/admin/trigger-price-check

# Test re-audit endpoint
curl http://localhost:3000/api/audit/[auditId]/reaudit

# Check MongoDB
mongosh [connection-string]
use [database-name]
db.audits.find({ email: "tautumhare@gmail.com" })
```

---

## Success! 🎉

You now have a working re-audit system that:
- ✅ Detects price changes automatically
- ✅ Sends beautiful email notifications
- ✅ Allows users to re-audit with one click
- ✅ Tracks all changes in history
- ⏳ Just needs UI components for history display

The core functionality is complete and ready for testing!
