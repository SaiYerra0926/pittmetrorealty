# ⚡ Quick Email Deployment Guide

## 🎯 What You Need to Do on Production Server

### 1. Install Package (REQUIRED)

```bash
npm install nodemailer
```

### 2. Copy These Files to Server

- `api/email.js` (NEW - must exist)
- `server.js` (UPDATE - must have email routes)

### 3. Restart Server

```bash
pm2 restart all
# or however you restart your server
```

---

## 📋 Exact Steps

### Step 1: SSH to Server
```bash
ssh user@3.12.102.126
cd /path/to/your/project
```

### Step 2: Install Nodemailer
```bash
npm install nodemailer
```

### Step 3: Copy Files (from your local machine)
```bash
# From your LOCAL computer:
scp api/email.js user@3.12.102.126:/path/to/project/api/email.js
scp server.js user@3.12.102.126:/path/to/project/server.js
```

### Step 4: Verify Files
```bash
# On server:
ls -la api/email.js  # Should exist
grep "emailRoutes" server.js  # Should show import
grep "sell-inquiry" server.js  # Should show route
```

### Step 5: Restart
```bash
pm2 restart all
# Check logs:
pm2 logs
```

### Step 6: Test
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123","preferredContact":"email","description":"Test"}'
```

---

## ✅ Success Indicators

After restart, server logs should show:
```
📧 Email API: POST http://localhost:3001/api/email/sell-inquiry
📧 Email API: POST http://localhost:3001/api/email/buy-inquiry
```

---

## 🔧 Optional: SMTP Configuration

For emails to actually send, add to `.env` on server:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@hotmail.com
SMTP_PASS=your-app-password
```

---

**That's it!** The email routes will work after these steps.

