# ⚡ Quick Fix: Email Routes 404 Error

## Problem
Getting `404 - API endpoint not found` when submitting Sell/Buy forms because the remote server doesn't have email routes.

## ✅ Solution: Deploy Email Routes to Remote Server

### Option 1: Quick Manual Fix (5 minutes)

**SSH into your remote server and run these commands:**

```bash
# 1. Navigate to your project directory
cd /path/to/your/project

# 2. Install nodemailer (if not already installed)
npm install nodemailer

# 3. Create api/email.js file (copy content from local api/email.js)
# You can use nano, vim, or any editor
nano api/email.js
# Paste the entire content from your local api/email.js file
# Save and exit (Ctrl+X, then Y, then Enter)

# 4. Update server.js
# Add this import at the top (around line 6):
# import * as emailRoutes from './api/email.js';

# Add these routes after review routes (around line 99):
# // Email routes
# app.post('/api/email/sell-inquiry', (req, res) => {
#   console.log('📧 Sell inquiry email route hit - URL:', req.url, 'Method:', req.method);
#   emailRoutes.sendSellInquiryEmail(req, res);
# });
# app.post('/api/email/buy-inquiry', (req, res) => {
#   console.log('📧 Buy inquiry email route hit - URL:', req.url, 'Method:', req.method);
#   emailRoutes.sendBuyInquiryEmail(req, res);
# });

# 5. Restart your server
# If using PM2:
pm2 restart all

# If running directly:
# Stop current server (Ctrl+C) then:
node server.js
```

### Option 2: Copy Files from Local (Recommended)

**From your local machine:**

```bash
# 1. Copy email.js to remote server
scp api/email.js user@3.12.102.126:/path/to/your/project/api/email.js

# 2. Copy updated server.js to remote server
scp server.js user@3.12.102.126:/path/to/your/project/server.js

# 3. SSH into server and install nodemailer
ssh user@3.12.102.126
cd /path/to/your/project
npm install nodemailer

# 4. Restart server
pm2 restart all
# or
node server.js
```

### Option 3: Use Git (If using version control)

```bash
# On remote server:
cd /path/to/your/project
git pull origin main  # or your branch name
npm install  # to get nodemailer
pm2 restart all
```

## ✅ Verify It Works

### 1. Check Server Logs
After restart, you should see:
```
📧 Email API: POST http://localhost:3001/api/email/sell-inquiry
📧 Email API: POST http://localhost:3001/api/email/buy-inquiry
```

### 2. Test the Endpoint
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123-456-7890","preferredContact":"email","description":"Test"}'
```

### 3. Test from Frontend
- Fill out Sell or Buy form
- Submit it
- Should see success message (not 404 error)

## 📋 Files Needed on Remote Server

1. ✅ `api/email.js` - Email service (NEW)
2. ✅ `server.js` - Updated with email routes (UPDATE)
3. ✅ `package.json` - Should have nodemailer (UPDATE)
4. ✅ `node_modules/nodemailer` - Install with `npm install nodemailer`

## ⚠️ Important

- **Server MUST be restarted** after adding routes
- **nodemailer MUST be installed** (`npm install nodemailer`)
- **File paths are case-sensitive** on Linux servers

## 🐛 Still Not Working?

1. Check server logs for errors
2. Verify `api/email.js` exists and is readable
3. Verify `server.js` has the email route imports
4. Check file permissions: `ls -la api/email.js`
5. Verify nodemailer is installed: `npm list nodemailer`

