# 🚀 Deploy Email Routes to Remote Server

## Issue
The remote server at `http://3.12.102.126:3001` doesn't have the email routes, causing 404 errors when submitting Sell/Buy forms.

## ✅ Files That Need to Be Deployed

### 1. **`api/email.js`** (NEW FILE)
   - Location: `api/email.js`
   - This is the email service with all email templates and sending logic
   - **Action:** Copy this entire file to the remote server

### 2. **`server.js`** (UPDATE EXISTING)
   - Location: `server.js`
   - **Changes needed:**
     - Add import: `import * as emailRoutes from './api/email.js';`
     - Add routes:
       ```javascript
       // Email routes
       app.post('/api/email/sell-inquiry', (req, res) => {
         console.log('📧 Sell inquiry email route hit - URL:', req.url, 'Method:', req.method);
         emailRoutes.sendSellInquiryEmail(req, res);
       });
       app.post('/api/email/buy-inquiry', (req, res) => {
         console.log('📧 Buy inquiry email route hit - URL:', req.url, 'Method:', req.method);
         emailRoutes.sendBuyInquiryEmail(req, res);
       });
       ```

### 3. **`package.json`** (UPDATE EXISTING)
   - **Action:** Ensure `nodemailer` is installed
   - Run on remote server: `npm install nodemailer`

## 📋 Deployment Steps

### Step 1: Install Nodemailer on Remote Server
```bash
# SSH into your remote server
ssh user@3.12.102.126

# Navigate to your project directory
cd /path/to/your/project

# Install nodemailer
npm install nodemailer
```

### Step 2: Copy `api/email.js` to Remote Server
```bash
# From your local machine, copy the file
scp api/email.js user@3.12.102.126:/path/to/your/project/api/email.js
```

### Step 3: Update `server.js` on Remote Server
```bash
# Option A: Copy entire server.js
scp server.js user@3.12.102.126:/path/to/your/project/server.js

# Option B: Manually add the email routes to existing server.js
```

### Step 4: Restart the Server
```bash
# If using PM2:
pm2 restart pittmetrorealty-api
# or
pm2 restart all

# If using systemd:
sudo systemctl restart pittmetrorealty

# If running directly:
# Stop the current server (Ctrl+C)
# Then start it again:
node server.js
# or
npm run server
```

## ✅ Verification Steps

### 1. Check Server Logs
After restarting, you should see:
```
📧 Email API: POST http://localhost:3001/api/email/sell-inquiry
📧 Email API: POST http://localhost:3001/api/email/buy-inquiry
```

### 2. Test the Endpoint
```bash
# From your local machine or browser
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123-456-7890","preferredContact":"email","description":"Test"}'
```

Expected response:
```json
{
  "success": false,
  "message": "Missing required fields: firstName, lastName, email, phone"
}
```
(If you get this, the route is working! The error is expected because we didn't send all required fields.)

### 3. Test from Frontend
- Fill out the Sell page form
- Submit it
- Check browser console - should see success message
- Check server logs - should see "📧 Sell inquiry email route hit"

## 🔧 Quick Fix (If You Can't Deploy Immediately)

If you need to test locally first, update your frontend to use localhost:

1. Create `.env.local` file:
```env
VITE_API_URL=http://localhost:3001/api
```

2. Restart your frontend dev server:
```bash
npm run dev
```

3. Make sure your local server is running:
```bash
npm run server
```

## ⚠️ Important Notes

1. **SMTP Configuration**: The email service needs SMTP credentials to actually send emails. See `EMAIL_SETUP_GUIDE.md` for configuration.

2. **Server Restart Required**: The server MUST be restarted after adding the routes for them to take effect.

3. **File Permissions**: Make sure the `api/email.js` file has proper read permissions.

4. **Node Modules**: Ensure `nodemailer` is installed in `node_modules` on the remote server.

## 🐛 Troubleshooting

### Still Getting 404?
1. Verify `api/email.js` exists on remote server
2. Verify `server.js` has the email route imports and routes
3. Check server logs for startup errors
4. Verify server was restarted after changes
5. Check file paths are correct (case-sensitive on Linux)

### Email Not Sending?
1. Check SMTP configuration in `.env` on remote server
2. Check server logs for email sending errors
3. See `EMAIL_SETUP_GUIDE.md` for SMTP setup

### Routes Not Found?
1. Check server.js has the email route imports at the top
2. Check routes are added BEFORE the 404 handler
3. Verify no syntax errors in server.js (check server startup logs)

