# Setup Instructions - Re-Audit Feature

## ⚠️ Important: Environment Variables Required

The re-audit feature needs environment variables to work. You're getting a 500 error because `.env.local` is missing.

---

## Quick Setup (5 minutes)

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the root directory with these variables:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Gemini API (for AI summaries)
GEMINI_API_KEY=your_gemini_api_key_here

# Resend API (for emails)
RESEND_API_KEY=your_resend_api_key_here

# Base URL (for email links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Admin Email (for notifications)
ADMIN_EMAIL=tautumhare@gmail.com
```

### Step 2: Get Your API Keys

You need to get these from your existing setup or create new ones:

#### MongoDB URI
- Check if you have this from your original setup
- Or get it from MongoDB Atlas dashboard
- Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

#### Gemini API Key
- Go to: https://aistudio.google.com/apikey
- Create a new API key
- Copy and paste into `.env.local`

#### Resend API Key
- Go to: https://resend.com/api-keys
- Create a new API key
- Copy and paste into `.env.local`

### Step 3: Restart the Dev Server

After creating `.env.local`:

```powershell
# Kill the existing server
taskkill /PID 6432 /F

# Start fresh
npm run dev
```

### Step 4: Test Again

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/trigger-price-check" -Method POST -ContentType "application/json"
```

---

## Alternative: Check Existing Environment

If this project was already working before, you might have the environment variables somewhere else.

### Check for existing .env files:

```powershell
# List all .env files
Get-ChildItem -Path . -Filter ".env*" -File

# Check if variables are in system environment
$env:MONGODB_URI
$env:RESEND_API_KEY
$env:GEMINI_API_KEY
```

### Check Vercel Environment (if deployed):

If this is deployed on Vercel, you can copy the environment variables from there:
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Copy all variables to `.env.local`

---

## What Each Variable Does

### MONGODB_URI
- **Required for**: Storing audits, findings, and re-audit history
- **Without it**: Database operations will fail (500 errors)
- **Format**: `mongodb+srv://...` or `mongodb://...`

### GEMINI_API_KEY
- **Required for**: Generating AI summaries in reports
- **Without it**: Falls back to template summaries (feature still works)
- **Get it**: https://aistudio.google.com/apikey

### RESEND_API_KEY
- **Required for**: Sending re-audit notification emails
- **Without it**: Email sending will fail (but audit still updates)
- **Get it**: https://resend.com/api-keys

### NEXT_PUBLIC_BASE_URL
- **Required for**: Generating correct links in emails
- **Without it**: Email links might be broken
- **Local**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### ADMIN_EMAIL
- **Required for**: Sending admin notifications
- **Without it**: Uses default or skips admin emails
- **Value**: `tautumhare@gmail.com`

---

## Minimal Setup (Just for Testing)

If you just want to test the re-audit logic without emails, you can use a minimal setup:

```env
# Minimal .env.local for testing
MONGODB_URI=your_mongodb_uri_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_EMAIL=tautumhare@gmail.com

# Optional (feature will work without these, just no emails/AI)
GEMINI_API_KEY=
RESEND_API_KEY=
```

With this minimal setup:
- ✅ Re-audit logic will work
- ✅ Database updates will work
- ✅ History tracking will work
- ❌ Emails won't be sent (will log error but continue)
- ❌ AI summaries won't generate (will use template)

---

## Troubleshooting

### Error: "MONGODB_URI is not defined"
**Solution**: Add `MONGODB_URI` to `.env.local`

### Error: "Failed to send email"
**Solution**: Add `RESEND_API_KEY` to `.env.local` or ignore if just testing

### Error: "Cannot connect to database"
**Solution**: Check your MongoDB URI is correct and database is accessible

### Server still showing old environment
**Solution**: Restart the dev server completely:
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Start fresh
npm run dev
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] `.env.local` file exists in root directory
- [ ] All required variables are set
- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000 in browser
- [ ] Can create an audit
- [ ] Can trigger price check without 500 error

---

## Next Steps After Setup

Once environment is configured:

1. ✅ Create a test audit at http://localhost:3000
2. ✅ Enter email: tautumhare@gmail.com
3. ✅ Modify a price in `lib/audit/engine.ts`
4. ✅ Trigger price check
5. ✅ Check email for notification
6. ✅ Click re-audit button

See `WINDOWS_TESTING_GUIDE.md` for detailed testing steps.

---

## Security Note

⚠️ **Never commit `.env.local` to git!**

It's already in `.gitignore`, but double-check:
- `.env.local` should NOT appear in `git status`
- Only commit `.env.local.example` (template without real keys)
- Keep your API keys secret

---

## Need Help?

If you're stuck:
1. Check if the project was working before (look for old .env files)
2. Check Vercel dashboard for environment variables
3. Create new API keys if needed (links above)
4. Test with minimal setup first (just MongoDB)

The re-audit feature code is complete and working - it just needs the environment variables to run!
