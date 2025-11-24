# 🚀 Production Server Deployment Checklist

## Complete Guide for Deploying Email Functionality and All Changes

---

## 📋 Pre-Deployment Checklist

### ✅ Files That Need to Be Deployed

1. **`api/email.js`** (NEW FILE - REQUIRED)
   - Email service with all templates
   - Location: `api/email.js`
   - **Action:** Copy this file to production server

2. **`server.js`** (UPDATE EXISTING)
   - Must include email route imports and routes
   - Location: `server.js`
   - **Action:** Update existing file or replace entirely

3. **`package.json`** (UPDATE EXISTING)
   - Must include `nodemailer` dependency
   - Location: `package.json`
   - **Action:** Update or ensure `nodemailer` is listed

4. **Frontend Files** (if deploying frontend)
   - `src/lib/api/email.ts` (NEW)
   - `src/pages/Sell.tsx` (UPDATED)
   - `src/pages/Buy.tsx` (UPDATED)

---

## 📦 Packages to Install on Production Server

### Required Package

```bash
npm install nodemailer
```

### Verify Installation

```bash
npm list nodemailer
# Should show: nodemailer@7.0.10 (or similar version)
```

---

## 🔧 Step-by-Step Deployment Instructions

### Step 1: Connect to Production Server

```bash
# SSH into your production server
ssh user@3.12.102.126
# or use your preferred method
```

### Step 2: Navigate to Project Directory

```bash
cd /path/to/your/project
# Replace with your actual project path
```

### Step 3: Install Nodemailer Package

```bash
# Install the required package
npm install nodemailer

# Verify installation
npm list nodemailer
```

### Step 4: Deploy New Files

#### Option A: Using SCP (from your local machine)

```bash
# From your LOCAL machine (not on server):
# Copy email.js to server
scp api/email.js user@3.12.102.126:/path/to/your/project/api/email.js

# Copy updated server.js to server
scp server.js user@3.12.102.126:/path/to/your/project/server.js

# Copy updated package.json (if nodemailer is not already there)
scp package.json user@3.12.102.126:/path/to/your/project/package.json
```

#### Option B: Using Git (if using version control)

```bash
# On production server:
cd /path/to/your/project
git pull origin main  # or your branch name
npm install  # This will install nodemailer if it's in package.json
```

#### Option C: Manual Copy (using nano/vim)

```bash
# On production server:
# 1. Create api/email.js
nano api/email.js
# Paste the entire content from your local api/email.js
# Save: Ctrl+X, then Y, then Enter

# 2. Update server.js
nano server.js
# Add the email route import at the top (around line 6):
# import * as emailRoutes from './api/email.js';
# Add email routes after review routes (around line 99):
# // Email routes
# app.post('/api/email/sell-inquiry', (req, res) => {
#   console.log('📧 Sell inquiry email route hit - URL:', req.url, 'Method:', req.method);
#   emailRoutes.sendSellInquiryEmail(req, res);
# });
# app.post('/api/email/buy-inquiry', (req, res) => {
#   console.log('📧 Buy inquiry email route hit - URL:', req.url, 'Method:', req.method);
#   emailRoutes.sendBuyInquiryEmail(req, res);
# });
```

### Step 5: Verify Files Are in Place

```bash
# Check if email.js exists
ls -la api/email.js

# Check if server.js has email routes
grep -n "emailRoutes" server.js
grep -n "sell-inquiry" server.js
grep -n "buy-inquiry" server.js

# Check if nodemailer is installed
npm list nodemailer
```

### Step 6: Configure SMTP (Optional but Recommended)

```bash
# Edit .env file on production server
nano .env
# or
vi .env
```

Add these variables (if not already present):

```env
# SMTP Configuration for Email Sending
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@hotmail.com
SMTP_PASS=your-app-password
```

**Note:** For Hotmail/Outlook:
- Use `smtp-mail.outlook.com` as host
- Port: `587`
- You may need to use an App Password instead of your regular password

### Step 7: Restart the Server

#### If using PM2:

```bash
# Restart all processes
pm2 restart all

# Or restart specific app
pm2 restart pittmetrorealty-api

# Check status
pm2 status

# View logs
pm2 logs
```

#### If using systemd:

```bash
sudo systemctl restart pittmetrorealty
# or whatever your service name is

# Check status
sudo systemctl status pittmetrorealty
```

#### If running directly with node:

```bash
# Stop current server (Ctrl+C)
# Then start again:
node server.js
# or
npm run server
```

### Step 8: Verify Server Started Correctly

Check server logs for these messages:

```
🚀 Pitt Metro Realty API server running on port 3001
📧 Email API: POST http://localhost:3001/api/email/sell-inquiry
📧 Email API: POST http://localhost:3001/api/email/buy-inquiry
✅ Server is ready to accept connections!
```

---

## ✅ Verification Steps

### 1. Test Email Endpoint (from server or local machine)

```bash
# Test sell inquiry endpoint
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "123-456-7890",
    "preferredContact": "email",
    "description": "Test inquiry"
  }'
```

**Expected Response:**
- If SMTP is configured: `{"success": true, "message": "Email sent successfully"}`
- If SMTP is not configured: Error about SMTP credentials (but route should work)

### 2. Test from Frontend

1. Go to Sell page
2. Fill out the form
3. Submit
4. Should see success message (not 404 error)
5. Check `aggarwal_a@hotmail.com` for the email

### 3. Check Server Logs

```bash
# If using PM2:
pm2 logs

# If using systemd:
sudo journalctl -u pittmetrorealty -f

# Look for:
# 📧 Sell inquiry email route hit
# ✅ Sell inquiry email sent successfully
```

---

## 📦 Complete Package List

### Backend Dependencies (Required)

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "pg": "^8.16.3",
    "nodemailer": "^7.0.10"  // NEW - Required for email
  }
}
```

### Installation Command

```bash
npm install express cors pg nodemailer
```

---

## 🔐 Environment Variables Needed

### Required for Email Functionality

```env
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@hotmail.com
SMTP_PASS=your-app-password

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (if not already set)
DATABASE_HOST=your_db_host
DATABASE_PORT=5432
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=your_db_name
```

---

## 🚨 Common Issues and Solutions

### Issue 1: "Cannot find module 'nodemailer'"

**Solution:**
```bash
npm install nodemailer
```

### Issue 2: "API endpoint not found" (404)

**Solutions:**
1. Verify `api/email.js` exists: `ls -la api/email.js`
2. Verify `server.js` has email routes: `grep "sell-inquiry" server.js`
3. Verify server was restarted after changes
4. Check server logs for startup errors

### Issue 3: Email not sending

**Solutions:**
1. Check SMTP credentials in `.env` file
2. Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set
3. For Hotmail/Outlook, use App Password (not regular password)
4. Check server logs for SMTP errors

### Issue 4: "Module not found" errors

**Solution:**
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
```

---

## 📝 Quick Deployment Script

Create a file `deploy-email.sh` on your local machine:

```bash
#!/bin/bash

# Configuration
SERVER_USER="your-username"
SERVER_IP="3.12.102.126"
SERVER_PATH="/path/to/your/project"

echo "🚀 Deploying email functionality to production..."

# Copy files
echo "📁 Copying files..."
scp api/email.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/api/email.js
scp server.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/server.js

# SSH and install/restart
echo "📦 Installing packages and restarting..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /path/to/your/project
npm install nodemailer
pm2 restart all
echo "✅ Deployment complete!"
EOF

echo "✅ Done! Check server logs to verify."
```

Make it executable:
```bash
chmod +x deploy-email.sh
./deploy-email.sh
```

---

## ✅ Final Checklist

Before going live, verify:

- [ ] `api/email.js` exists on production server
- [ ] `server.js` has email route imports and routes
- [ ] `nodemailer` package is installed (`npm list nodemailer`)
- [ ] Server has been restarted after changes
- [ ] Server logs show email routes on startup
- [ ] SMTP credentials are configured in `.env` (optional but recommended)
- [ ] Test endpoint returns success (not 404)
- [ ] Frontend can successfully submit forms
- [ ] Emails are being received at `aggarwal_a@hotmail.com`

---

## 📞 Support

If you encounter issues:

1. Check server logs: `pm2 logs` or `journalctl -u your-service`
2. Verify file permissions: `ls -la api/email.js`
3. Test endpoint directly with curl (see Verification Steps)
4. Check that all files are in the correct locations
5. Ensure server was restarted after deployment

---

**Last Updated:** After email functionality implementation  
**Server IP:** 3.12.102.126:3001  
**Recipient Email:** aggarwal_a@hotmail.com

