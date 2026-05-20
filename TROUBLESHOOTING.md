# Troubleshooting Guide

## Current Error: "<!DOCTYPE "... is not valid JSON"

This error means the API is returning an HTML error page instead of JSON. This happens when the database connection fails.

---

## Quick Fix (2 minutes)

### Step 1: Check Environment Configuration

Visit this URL in your browser:
```
http://localhost:3000/api/health
```

This will show you which environment variables are missing.

### Step 2: Create `.env.local` File

If you see "MONGODB_URI: false", you need to create `.env.local`:

**Create file**: `.env.local` (in the root directory, same level as `package.json`)

**Add this content**:
```env
MONGODB_URI=your_mongodb_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_EMAIL=tautumhare@gmail.com
```

### Step 3: Get Your MongoDB URI

You need to get this from one of these places:

**Option A: From Vercel (if deployed)**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Copy `MONGODB_URI` value

**Option B: From MongoDB Atlas**
1. Go to https://cloud.mongodb.com
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password

**Option C: Check if you have it somewhere**
```powershell
# Search for .env files in project
Get-ChildItem -Path . -Filter ".env*" -Recurse -File

# Check if it's in system environment
$env:MONGODB_URI
```

### Step 4: Restart Server

After creating `.env.local`:

```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Start fresh
npm run dev
```

### Step 5: Verify

```powershell
# Check health endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/health"

# Should show: "status": "healthy"
```

### Step 6: Test Again

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST -ContentType "application/json"

# Should now work!
```

---

## Common Errors and Solutions

### Error: "MONGODB_URI is not defined"

**Cause**: `.env.local` file doesn't exist or doesn't have MONGODB_URI

**Solution**:
1. Create `.env.local` in root directory
2. Add `MONGODB_URI=your_connection_string`
3. Restart server

### Error: "MongooseServerSelectionError"

**Cause**: MongoDB URI is wrong or database is not accessible

**Solution**:
1. Check MongoDB URI format: `mongodb+srv://username:password@cluster.mongodb.net/database`
2. Verify password is correct (no special characters need URL encoding)
3. Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for testing)
4. Test connection with MongoDB Compass

### Error: "Failed to send email"

**Cause**: RESEND_API_KEY is missing or invalid

**Solution**:
1. Get API key from https://resend.com/api-keys
2. Add to `.env.local`: `RESEND_API_KEY=re_...`
3. Restart server

**Note**: Email failure won't break the re-audit feature - it will just log an error and continue.

### Error: "Port 3000 is already in use"

**Cause**: Another Next.js server is running

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with actual number)
taskkill /PID [PID] /F

# Or use different port
$env:PORT=3001; npm run dev
```

### Error: Server not picking up .env.local changes

**Cause**: Server needs restart to load new environment variables

**Solution**:
```powershell
# Complete restart
taskkill /F /IM node.exe
npm run dev
```

---

## Diagnostic Commands

### Check if .env.local exists
```powershell
Test-Path .env.local
# Should return: True
```

### View .env.local content (safely)
```powershell
Get-Content .env.local | ForEach-Object { 
    if ($_ -match '^([^=]+)=') { 
        "$($matches[1])=***" 
    } else { 
        $_ 
    } 
}
# Shows variable names without exposing values
```

### Check environment variables loaded
```powershell
# In PowerShell
$env:MONGODB_URI
$env:RESEND_API_KEY
$env:GEMINI_API_KEY

# Should show values (or nothing if not set)
```

### Test MongoDB connection
```powershell
# Using mongosh
mongosh "your_mongodb_uri_here"

# Should connect successfully
```

### Check API health
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/health" | Select-Object -ExpandProperty Content
```

---

## Step-by-Step Verification

Run these commands in order:

```powershell
# 1. Check if .env.local exists
Test-Path .env.local
# Expected: True

# 2. Check if server is running
Invoke-WebRequest -Uri "http://localhost:3000"
# Expected: 200 OK

# 3. Check environment configuration
Invoke-WebRequest -Uri "http://localhost:3000/api/health"
# Expected: "status": "healthy"

# 4. Test price check endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST -ContentType "application/json"
# Expected: "success": true
```

If any step fails, see the error solutions above.

---

## Minimal Working Configuration

If you just want to test the re-audit logic without emails, use this minimal `.env.local`:

```env
# Minimal configuration (just for testing logic)
MONGODB_URI=your_mongodb_uri_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_EMAIL=tautumhare@gmail.com

# Optional (can be empty for testing)
GEMINI_API_KEY=
RESEND_API_KEY=
```

With this setup:
- ✅ Re-audit logic works
- ✅ Database updates work
- ✅ History tracking works
- ❌ Emails won't send (will log error but continue)
- ❌ AI summaries won't generate (will use template)

---

## Still Not Working?

### Check Server Logs

Look at the terminal where `npm run dev` is running. You should see error messages that explain what's wrong.

Common log messages:
- `MONGODB_URI is not set` → Create .env.local
- `MongooseServerSelectionError` → Check MongoDB URI
- `Failed to send email` → Check RESEND_API_KEY (or ignore if just testing)

### Test Individual Components

```powershell
# Test if you can create an audit
# Go to http://localhost:3000 and fill out the form

# Test if database is accessible
# Use MongoDB Compass to connect

# Test if Resend works
# Go to https://resend.com/api-keys and test your key
```

### Get Help

If still stuck:
1. Check `SETUP_INSTRUCTIONS.md` for detailed setup
2. Check `WINDOWS_TESTING_GUIDE.md` for Windows-specific commands
3. Look at server logs for specific error messages
4. Verify all environment variables are set correctly

---

## Success Checklist

Once everything is working, you should be able to:

- [ ] Visit http://localhost:3000 (homepage loads)
- [ ] Visit http://localhost:3000/api/health (shows "healthy")
- [ ] Create an audit (form submission works)
- [ ] Trigger price check (no 500 error)
- [ ] See "affectedUsers: 0" (or higher if you have audits)

If all checkboxes are checked, the feature is working! 🎉

---

## Next Steps After Setup

Once environment is configured and working:

1. Create a test audit with email
2. Modify a price in `lib/audit/engine.ts`
3. Trigger price check
4. Check email for notification
5. Click re-audit button
6. Verify it works

See `WINDOWS_TESTING_GUIDE.md` for detailed testing steps.
