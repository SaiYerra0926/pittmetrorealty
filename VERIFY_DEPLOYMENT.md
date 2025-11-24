# ✅ Verify Email Routes Deployment

## Step 1: Check if Files Exist on Server

Run these commands on your production server:

```bash
# Check if email.js exists
ls -la api/email.js

# Check if server.js has email routes
grep -n "emailRoutes" server.js
grep -n "sell-inquiry" server.js
grep -n "buy-inquiry" server.js
```

## Step 2: Check if Nodemailer is Installed

```bash
npm list nodemailer
```

If not installed:
```bash
npm install nodemailer
```

## Step 3: Check Server Logs

```bash
# If using PM2:
pm2 logs

# Look for these lines on server startup:
# 📧 Email API: POST http://localhost:3001/api/email/sell-inquiry
# 📧 Email API: POST http://localhost:3001/api/email/buy-inquiry
```

## Step 4: Test with Correct curl Command

```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123","preferredContact":"email","description":"Test"}'
```

## If Still Getting 404

The routes are NOT deployed. You need to:

1. **Copy `api/email.js` to server**
2. **Update `server.js` with email routes**
3. **Restart server**

See `PRODUCTION_DEPLOYMENT_CHECKLIST.md` for full instructions.

