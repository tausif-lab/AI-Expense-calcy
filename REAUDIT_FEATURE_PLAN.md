# Re-Audit Feature Implementation Plan

## Overview
This feature automatically detects AI pricing changes and sends re-audit emails to users with a button to trigger a fresh audit with updated pricing.

## Current Implementation Status

### ✅ Completed (Commit 1-3)

#### Commit 1: Fix email filtering in detect-changes
- **File**: `app/api/detect-changes/route.ts`
- **Changes**: Added email filter to query (`email: { $ne: null, $exists: true }`)
- **Why**: Ensures we only process audits where users provided emails

#### Commit 2: Enhanced email template with re-audit button
- **File**: `app/api/detect-changes/route.ts`
- **Changes**: 
  - Added `reauditUrl` variable
  - Added green "Re-Audit with Latest Data →" button
  - Added explanatory text below buttons
  - Improved email copy for clarity
- **Why**: Gives users a clear call-to-action to re-run their audit

#### Commit 3: Created re-audit API endpoint
- **File**: `app/api/audit/[auditId]/reaudit/route.ts` (NEW)
- **Functionality**:
  - Accepts GET request with auditId
  - Re-runs audit engine with current OFFICIAL_PRICES
  - Saves new findings and updates pricing snapshot
  - Adds entry to reAuditHistory
  - Redirects user to updated report page
- **Why**: Provides the backend logic for the re-audit button

#### Commit 4: Created manual price check trigger
- **File**: `app/api/admin/trigger-price-check/route.ts` (NEW)
- **Functionality**:
  - Admin endpoint to manually trigger price change detection
  - Calls `/api/detect-changes` internally
  - Returns affected user count
- **Why**: Useful for testing and manual price update scenarios

---

## Remaining Work (Commit 5-6)

### Commit 5: Add pricing change history to report page
**Files to modify**: 
- `app/report/[reportId]/page.tsx`

**Changes needed**:
1. Fetch audit with `reAuditHistory` populated
2. Display history section showing:
   - Date of each re-audit
   - What tools changed
   - Old vs new savings comparison
   - Link to view detailed changes
3. Add visual timeline component

**Implementation**:
```typescript
// In report page, add section:
{audit.reAuditHistory && audit.reAuditHistory.length > 0 && (
  <div className="mt-8 border-t pt-8">
    <h2 className="text-2xl font-bold mb-4">Re-Audit History</h2>
    {audit.reAuditHistory.map((entry, idx) => (
      <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
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
)}
```

### Commit 6: Add re-audit button to report page UI
**Files to modify**:
- `app/report/[reportId]/page.tsx`

**Changes needed**:
1. Add "Re-Audit Now" button at top of report
2. Button should link to `/api/audit/[auditId]/reaudit`
3. Show loading state during re-audit
4. Display success message after redirect

**Implementation**:
```typescript
<a
  href={`/api/audit/${audit.auditId}/reaudit`}
  className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition"
>
  Re-Audit with Current Pricing →
</a>
```

---

## Testing Checklist

### Manual Testing Steps

1. **Test price change detection**:
   ```bash
   # Modify a price in lib/audit/engine.ts OFFICIAL_PRICES
   # Then call:
   curl -X POST http://localhost:3000/api/admin/trigger-price-check
   ```

2. **Verify email sent**:
   - Check that email goes to `tautumhare@gmail.com`
   - Verify both buttons are present
   - Click "Re-Audit" button

3. **Test re-audit endpoint**:
   ```bash
   # Visit in browser:
   http://localhost:3000/api/audit/[auditId]/reaudit
   # Should redirect to report page with updated data
   ```

4. **Verify history tracking**:
   - Check MongoDB that `reAuditHistory` array is populated
   - Verify old and new findings are stored correctly

5. **Test edge cases**:
   - Audit without email (should be skipped)
   - Audit without pricing snapshot (should be skipped)
   - Multiple price changes in same tool
   - Price increase vs decrease scenarios

---

## Architecture Decisions

### Why GET for re-audit instead of POST?
- Email links must be clickable (GET)
- No sensitive data in URL (auditId is already public via reportId)
- Idempotent operation (safe to retry)

### Why redirect instead of JSON response?
- Better UX: user sees updated report immediately
- No need for frontend state management
- Works with email links

### Why store full history instead of just latest?
- Audit trail for compliance
- Users can see pricing trends over time
- Useful for debugging and analytics

### Why hardcoded email for now?
- MVP requirement: single test user
- Easy to change to `audit.email` later
- Prevents accidental spam during development

---

## Future Enhancements

### Phase 2 (Post-MVP)
1. **Scheduled price checks**: Run detect-changes daily via cron
2. **Batch email improvements**: Rate limiting, retry logic
3. **Email preferences**: Let users opt-out of price alerts
4. **Diff visualization**: Show exactly what changed in pricing
5. **Webhook support**: Notify external systems of price changes

### Phase 3 (Scale)
1. **Queue-based processing**: Use BullMQ for async re-audits
2. **Email templates**: Move to proper email template system
3. **Analytics dashboard**: Track re-audit rates, email opens
4. **A/B testing**: Test different email copy and CTAs

---

## Deployment Notes

### Environment Variables Required
```env
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_BASE_URL=https://your-domain.com
ADMIN_EMAIL=tautumhare@gmail.com
```

### Database Indexes
Ensure these indexes exist for performance:
```javascript
db.audits.createIndex({ auditId: 1 })
db.audits.createIndex({ reportId: 1 })
db.audits.createIndex({ email: 1 })
db.audits.createIndex({ pricingSnapshot: 1 })
```

### Monitoring
- Track email delivery success rate
- Monitor re-audit endpoint response times
- Alert on detect-changes failures

---

## Commit Strategy

Each commit should be:
1. **Atomic**: Single logical change
2. **Tested**: Manually verified before commit
3. **Documented**: Clear commit message explaining why

### Suggested Commit Messages

```
feat: filter audits by email in detect-changes endpoint

Only process audits where users provided emails to avoid
unnecessary processing and ensure we can notify users.

---

feat: add re-audit button to pricing change emails

Users can now click "Re-Audit with Latest Data" to trigger
a fresh audit with current pricing. Button links to new
/api/audit/[auditId]/reaudit endpoint.

---

feat: create re-audit API endpoint

New GET endpoint that re-runs audit engine with current
prices, updates findings, and redirects to report page.
Tracks changes in reAuditHistory array.

---

feat: add admin endpoint to trigger price checks

Allows manual triggering of price change detection for
testing and manual price update scenarios.

---

feat: display re-audit history on report page

Shows timeline of pricing changes and how they affected
savings estimates. Helps users understand pricing trends.

---

feat: add re-audit button to report page UI

Users can manually trigger re-audit from report page
without waiting for automatic price change detection.
```

---

## Success Metrics

### MVP Success Criteria
- ✅ Email sent when price changes
- ✅ Re-audit button works in email
- ✅ Re-audit updates findings correctly
- ✅ History tracked in database
- ⏳ History displayed on report page
- ⏳ Manual re-audit button on report page

### Post-Launch Metrics
- Email open rate > 40%
- Re-audit click-through rate > 15%
- Re-audit completion rate > 90%
- Zero email delivery failures

---

## Known Limitations

1. **Hardcoded email**: Currently sends to `tautumhare@gmail.com` only
2. **No rate limiting**: Could send many emails if prices change frequently
3. **No email preferences**: Users can't opt-out
4. **Synchronous processing**: Could timeout with many audits
5. **No retry logic**: Failed emails are logged but not retried

These are acceptable for MVP but should be addressed in Phase 2.
