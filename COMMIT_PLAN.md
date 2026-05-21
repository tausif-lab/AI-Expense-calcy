# Re-Audit Feature - Commit Plan

## Overview
This document outlines the commit strategy for implementing the re-audit feature that sends emails when AI pricing changes and allows users to re-run their audits.

---

## ✅ Commit 1: Filter audits by email in detect-changes

**Branch**: `feat/reaudit-email-filter`

**Files Changed**:
- `app/api/detect-changes/route.ts`

**Changes**:
```typescript
// Before:
const audits = await Audit.find({
  pricingSnapshot: { $ne: null },
}).lean() as any[];

// After:
const audits = await Audit.find({
  pricingSnapshot: { $ne: null },
  email: { $ne: null, $exists: true },
}).lean() as any[];
```

**Commit Message**:
```
feat: filter audits by email in detect-changes endpoint

Only process audits where users provided emails to avoid
unnecessary processing and ensure we can notify users of
pricing changes.

Fixes issue where audits without emails were being processed
but couldn't receive notifications.
```

**Testing**:
- Create audit without email → should be skipped
- Create audit with email → should be processed
- Verify console logs show correct count

---

## ✅ Commit 2: Add re-audit button to pricing change emails

**Branch**: `feat/reaudit-email-button`

**Files Changed**:
- `app/api/detect-changes/route.ts`

**Changes**:
1. Added `reauditUrl` variable
2. Updated email HTML template:
   - Changed "View Updated Audit" to "View Updated Report"
   - Added green "Re-Audit with Latest Data" button
   - Added explanatory text below buttons
   - Improved spacing and visual hierarchy

**Commit Message**:
```
feat: add re-audit button to pricing change emails

Users can now click "Re-Audit with Latest Data" button in
pricing change notification emails to trigger a fresh audit
with current pricing and their latest tool usage.

The button links to /api/audit/[auditId]/reaudit which will
be implemented in the next commit.

Email improvements:
- Two clear CTAs: view report or re-audit
- Green button for re-audit action (primary CTA)
- Explanatory text for user guidance
- Better visual hierarchy
```

**Testing**:
- Trigger price change detection
- Verify email received at tautumhare@gmail.com
- Check both buttons are present and styled correctly
- Verify button links (re-audit will 404 until next commit)

---

## ✅ Commit 3: Create re-audit API endpoint

**Branch**: `feat/reaudit-endpoint`

**Files Changed**:
- `app/api/audit/[auditId]/reaudit/route.ts` (NEW)

**Changes**:
Created new GET endpoint that:
1. Fetches audit by auditId
2. Re-runs audit engine with current OFFICIAL_PRICES
3. Creates history entry with old/new findings
4. Updates audit with new findings and snapshot
5. Redirects to report page

**Commit Message**:
```
feat: create re-audit API endpoint

New GET endpoint at /api/audit/[auditId]/reaudit that:
- Re-runs audit engine with current pricing
- Updates findings and savings estimates
- Tracks changes in reAuditHistory array
- Redirects user to updated report page

This endpoint is triggered by the re-audit button in
pricing change notification emails.

Uses GET instead of POST because:
- Must work with email links (clickable)
- Idempotent operation (safe to retry)
- No sensitive data in URL
```

**Testing**:
```bash
# Visit in browser:
http://localhost:3000/api/audit/[your-audit-id]/reaudit

# Should:
# 1. Re-run audit
# 2. Update database
# 3. Redirect to report page
```

---

## ✅ Commit 4: Add admin endpoint to trigger price checks

**Branch**: `feat/admin-price-check`

**Files Changed**:
- `app/api/admin/trigger-price-check/route.ts` (NEW)

**Changes**:
Created admin endpoint that:
1. Calls `/api/detect-changes` internally
2. Returns success status and affected user count
3. Useful for manual testing and price updates

**Commit Message**:
```
feat: add admin endpoint to trigger price checks

New POST endpoint at /api/admin/trigger-price-check that
manually triggers the price change detection process.

Useful for:
- Testing price change notifications
- Manual price updates in codebase
- Debugging email delivery issues

Returns affected user count for monitoring.
```

**Testing**:
```bash
# Trigger price check:
curl -X POST http://localhost:3000/api/admin/trigger-price-check

# Should return:
# { "success": true, "affectedUsers": 0 }

# To test with actual changes:
# 1. Modify a price in lib/audit/engine.ts
# 2. Run the curl command above
# 3. Check email at tautumhare@gmail.com
```

---

## ⏳ Commit 5: Display re-audit history on report page

**Branch**: `feat/reaudit-history-ui`

**Files to Change**:
- `app/report/[reportId]/page.tsx`

**Changes Needed**:
1. Fetch audit with reAuditHistory
2. Add history section to report page
3. Display timeline of changes
4. Show old vs new savings for each re-audit

**Commit Message** (draft):
```
feat: display re-audit history on report page

Shows timeline of pricing changes and how they affected
savings estimates over time.

Features:
- Chronological list of re-audits
- Date and changed tools for each entry
- Old vs new savings comparison
- Visual indicators for increases/decreases

Helps users understand pricing trends and verify that
automatic re-audits are working correctly.
```

**Implementation Steps**:
1. Read current report page structure
2. Add history section after main findings
3. Style with existing Tailwind classes
4. Test with audit that has history entries

---

## ⏳ Commit 6: Add manual re-audit button to report page

**Branch**: `feat/manual-reaudit-button`

**Files to Change**:
- `app/report/[reportId]/page.tsx`

**Changes Needed**:
1. Add "Re-Audit Now" button at top of report
2. Link to `/api/audit/[auditId]/reaudit`
3. Style consistently with existing buttons
4. Add tooltip explaining what it does

**Commit Message** (draft):
```
feat: add manual re-audit button to report page

Users can now manually trigger a re-audit from the report
page without waiting for automatic price change detection.

Useful when:
- User wants to check for latest pricing
- Tool usage has changed
- Verifying recommendations

Button redirects to re-audit endpoint which updates the
report and redirects back.
```

**Implementation Steps**:
1. Read current report page structure
2. Add button near top (after title)
3. Match styling of existing CTAs
4. Test button functionality

---

## Git Workflow

### For Each Commit:

1. **Create feature branch**:
   ```bash
   git checkout -b feat/branch-name
   ```

2. **Make changes**:
   - Edit files as described
   - Test manually
   - Check diagnostics

3. **Stage and commit**:
   ```bash
   git add [files]
   git commit -m "commit message"
   ```

4. **Push to remote**:
   ```bash
   git push origin feat/branch-name
   ```

5. **Create PR** (if using PR workflow):
   - Title: Same as commit message first line
   - Description: Full commit message
   - Request review from team

6. **Merge to main**:
   ```bash
   git checkout main
   git merge feat/branch-name
   git push origin main
   ```

---

## Testing Strategy

### After Each Commit:

1. **Run diagnostics**:
   ```bash
   npm run lint
   ```

2. **Manual testing**:
   - Test the specific feature added
   - Verify no regressions
   - Check console for errors

3. **Database verification**:
   - Check MongoDB for correct data structure
   - Verify indexes are used
   - Confirm history tracking works

### Full Integration Test (After All Commits):

1. **Create test audit**:
   - Go to homepage
   - Fill out audit form
   - Submit with email

2. **Modify pricing**:
   - Edit `lib/audit/engine.ts` OFFICIAL_PRICES
   - Change one tool's price

3. **Trigger detection**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/trigger-price-check
   ```

4. **Verify email**:
   - Check tautumhare@gmail.com
   - Click "Re-Audit" button
   - Verify redirect to report

5. **Check history**:
   - View report page
   - Verify history section shows change
   - Confirm old/new values are correct

6. **Manual re-audit**:
   - Click "Re-Audit Now" on report
   - Verify it works without price changes

---

## Rollback Plan

If issues are found after deployment:

### Quick Fix (Preferred):
1. Identify the problematic commit
2. Create hotfix branch
3. Fix the issue
4. Deploy immediately

### Rollback (If Necessary):
```bash
# Revert specific commit:
git revert [commit-hash]

# Or rollback to previous version:
git reset --hard [previous-commit]
git push --force origin main
```

### Database Rollback:
If schema changes cause issues:
1. Remove `reAuditHistory` field from affected documents
2. Restore `pricingSnapshot` from backups if needed

---

## Success Criteria

### Per Commit:
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Manual testing passes
- ✅ No console errors

### Overall Feature:
- ✅ Email sent when price changes
- ✅ Re-audit button works
- ✅ History tracked correctly
- ✅ Report page shows history
- ✅ Manual re-audit works
- ✅ No performance degradation

---

## Timeline Estimate

- Commit 1: ✅ Complete (5 min)
- Commit 2: ✅ Complete (15 min)
- Commit 3: ✅ Complete (20 min)
- Commit 4: ✅ Complete (10 min)
- Commit 5: ⏳ Pending (30 min)
- Commit 6: ⏳ Pending (20 min)

**Total**: ~1.5 hours for complete feature

---

## Notes

- All commits should be atomic and independently deployable
- Each commit should pass tests before moving to next
- Commit messages follow conventional commits format
- Feature flags not needed (low risk changes)
- Can deploy incrementally (commits 1-4 are already functional)
