# Windows PowerShell Testing Guide

## 🪟 PowerShell Commands for Testing

Since you're on Windows, use these PowerShell-specific commands instead of the bash commands in other docs.

---

## Step-by-Step Testing

### 1. Start the Development Server

```powershell
# Open a terminal and run:
npm run dev

# Keep this terminal open - the server needs to stay running
# You should see: "Ready on http://localhost:3000"
```

### 2. Test the Admin Trigger Endpoint

**Open a NEW terminal** (keep the dev server running in the first one) and run:

```powershell
# PowerShell command:
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST -ContentType "application/json"

# Expected response:
# StatusCode: 200
# Content: {"success":true,"message":"Price check triggered successfully","affectedUsers":0}
```

**Alternative using curl.exe** (if you have Git Bash installed):

```powershell
curl.exe -X POST http://localhost:3000/api/admin/trigger-price-check
```

### 3. Create a Test Audit

```powershell
# Open browser and go to:
http://localhost:3000

# Fill out the audit form:
# - Team size: 10
# - Tech team size: 5
# - Primary use case: Coding
# - Add a tool: Cursor Pro, 5 seats, 4 active users, $100/mo
# - Submit the form

# Note the auditId from the URL or response
```

### 4. Generate Report with Email

After creating the audit, enter email when prompted:
- Email: `tautumhare@gmail.com`
- This will save the audit with email and pricing snapshot

### 5. Modify Pricing in Code

Open `lib/audit/engine.ts` and change a price:

```typescript
// Find this section (around line 35):
export const OFFICIAL_PRICES: Record<string, Record<string, number>> = {
  Cursor: {
    Hobby: 0,
    Pro: 25,        // ← Change from 20 to 25
    Business: 40,
    Enterprise: 0,
  },
  // ... rest of the prices
```

Save the file. The dev server will auto-reload.

### 6. Trigger Price Change Detection

```powershell
# In your second terminal:
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST -ContentType "application/json"

# Expected response:
# StatusCode: 200
# Content: {"success":true,"message":"Price check triggered successfully","affectedUsers":1}
```

### 7. Check Email

- Go to your email inbox for `tautumhare@gmail.com`
- Look for email with subject: "Pricing update detected in your AI tools audit"
- You should see:
  - Explanation of what changed
  - Old vs new savings comparison
  - Two buttons: "View Updated Report" and "Re-Audit with Latest Data"

### 8. Test Re-Audit Button

Click the green "Re-Audit with Latest Data" button in the email.

**Or test directly in browser:**

```powershell
# Replace [auditId] with your actual audit ID
# Open in browser:
http://localhost:3000/api/audit/[auditId]/reaudit

# Should redirect to:
http://localhost:3000/report/[reportId]
```

### 9. Verify Database Changes

If you have MongoDB Compass or mongosh:

```powershell
# Connect to your MongoDB
mongosh "your-connection-string"

# Switch to your database
use your-database-name

# Find your audit
db.audits.findOne({ email: "tautumhare@gmail.com" })

# Check for:
# - Updated findings
# - Updated totalMonthlySavings
# - New entry in reAuditHistory array
# - Updated pricingSnapshot
```

---

## PowerShell Command Reference

### Making HTTP Requests

```powershell
# GET request
Invoke-WebRequest -Uri "http://localhost:3000/api/endpoint"

# POST request
Invoke-WebRequest -Uri "http://localhost:3000/api/endpoint" -Method POST -ContentType "application/json"

# POST with body
$body = @{
    key = "value"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/endpoint" -Method POST -Body $body -ContentType "application/json"

# View response content
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/endpoint"
$response.Content
```

### Alternative: Use curl.exe

If you have Git Bash installed, you can use `curl.exe` instead:

```powershell
# Use curl.exe (not curl alias)
curl.exe -X POST http://localhost:3000/api/admin/trigger-price-check

# With verbose output
curl.exe -v -X POST http://localhost:3000/api/admin/trigger-price-check
```

---

## Common Issues on Windows

### Issue 1: "curl: command not found" or wrong curl

**Problem**: PowerShell's `curl` is an alias for `Invoke-WebRequest`

**Solution**: Use `curl.exe` or `Invoke-WebRequest`

```powershell
# Instead of:
curl -X POST http://localhost:3000/api/endpoint

# Use:
curl.exe -X POST http://localhost:3000/api/endpoint
# OR
Invoke-WebRequest -Uri "http://localhost:3000/api/endpoint" -Method POST
```

### Issue 2: "Unable to connect to remote server"

**Problem**: Dev server isn't running

**Solution**: 
1. Check if dev server is running in another terminal
2. Verify it says "Ready on http://localhost:3000"
3. Try opening http://localhost:3000 in browser first

### Issue 3: Port 3000 already in use

**Problem**: Another process is using port 3000

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Or use a different port
$env:PORT=3001; npm run dev
```

### Issue 4: MongoDB connection fails

**Problem**: MongoDB URI not set or incorrect

**Solution**:
1. Check `.env.local` file exists
2. Verify `MONGODB_URI` is set correctly
3. Test connection with MongoDB Compass

---

## Quick Test Script

Save this as `test-reaudit.ps1`:

```powershell
# test-reaudit.ps1
Write-Host "Testing Re-Audit Feature..." -ForegroundColor Green

# Test 1: Check if server is running
Write-Host "`n1. Checking if dev server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    Write-Host "✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not running. Run 'npm run dev' first." -ForegroundColor Red
    exit 1
}

# Test 2: Trigger price check
Write-Host "`n2. Triggering price check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST -ContentType "application/json"
    $content = $response.Content | ConvertFrom-Json
    Write-Host "✓ Price check triggered" -ForegroundColor Green
    Write-Host "  Affected users: $($content.affectedUsers)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Price check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Green
```

Run it:
```powershell
.\test-reaudit.ps1
```

---

## Environment Setup Checklist

Before testing, ensure:

- [ ] Node.js installed (check: `node --version`)
- [ ] Dependencies installed (run: `npm install`)
- [ ] `.env.local` file exists with:
  - [ ] `MONGODB_URI`
  - [ ] `GEMINI_API_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
  - [ ] `ADMIN_EMAIL=tautumhare@gmail.com`
- [ ] Dev server running (run: `npm run dev`)
- [ ] MongoDB accessible
- [ ] Resend API key valid

---

## Testing Workflow Summary

```
1. Start dev server (npm run dev)
        ↓
2. Create audit at http://localhost:3000
        ↓
3. Enter email: tautumhare@gmail.com
        ↓
4. Modify price in lib/audit/engine.ts
        ↓
5. Trigger check: Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST
        ↓
6. Check email inbox
        ↓
7. Click "Re-Audit" button
        ↓
8. Verify redirect to updated report
        ↓
9. Check MongoDB for history entry
```

---

## Next Steps

After testing works:

1. ✅ Verify email received
2. ✅ Verify re-audit button works
3. ✅ Verify database updated
4. ⏳ Implement history UI on report page
5. ⏳ Implement manual re-audit button

See `COMMIT_PLAN.md` for details on remaining work.

---

## Need Help?

- **Server won't start**: Check for port conflicts, verify dependencies
- **Email not received**: Check Resend API key, verify email in audit
- **Database errors**: Verify MongoDB URI, check connection
- **API errors**: Check server logs in terminal where `npm run dev` is running

---

## Pro Tips

1. **Keep two terminals open**: One for dev server, one for testing
2. **Use MongoDB Compass**: Visual tool for checking database changes
3. **Check browser console**: Look for errors when testing in browser
4. **Monitor server logs**: Watch the terminal where dev server runs
5. **Use Postman**: Alternative to PowerShell for API testing

Happy testing! 🚀
