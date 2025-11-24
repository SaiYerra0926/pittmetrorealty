# 🚨 URGENT: Fix api/email.js on Server

## Problem
Server file has TypeScript code instead of JavaScript. The file should start with `import nodemailer from 'nodemailer';` but it starts with TypeScript interfaces.

## Solution: Copy Correct File

### Step 1: On Your Local Machine

Verify the correct file exists:
```powershell
# In PowerShell, check first line:
Get-Content api/email.js -TotalCount 1
# Should show: import nodemailer from 'nodemailer';
```

### Step 2: Copy to Server

**Option A: Using SCP (Recommended)**

From your **local machine** (PowerShell or Git Bash):

```powershell
# Try this path first:
scp api/email.js ec2-user@3.12.102.126:/home/ec2-user/amitagarwalestateshowcase/api/email.js

# If that doesn't work, try the nested path:
scp api/email.js ec2-user@3.12.102.126:/home/ec2-user/amitagarwalestateshowcase/amitagarwalestateshowcase/api/email.js
```

**Option B: Manual Copy (If SCP Fails)**

1. On **local machine**: Open `api/email.js` and copy ALL content
2. On **server**: 
   ```bash
   # Delete the wrong file
   rm api/email.js
   
   # Create new file
   nano api/email.js
   
   # Paste the entire content from local file
   # Save: Ctrl+X, then Y, then Enter
   ```

### Step 3: Verify on Server

```bash
# Check first line:
head -1 api/email.js

# Should show: import nodemailer from 'nodemailer';
# NOT: export interface SellInquiryData {
```

### Step 4: Check File Location

The error shows the file is at:
```
/home/ec2-user/amitagarwalestateshowcase/amitagarwalestateshowcase/api/email.js
```

Notice the **double directory**. Make sure you're copying to the correct location.

On server, check:
```bash
# Find where the file actually is:
find ~ -name "email.js" -type f 2>/dev/null

# Check which file server.js is trying to load:
grep "email.js" server.js
```

### Step 5: Restart Server

```bash
# Stop current server (Ctrl+C)
# Then:
node server.js
```

## Quick Test

After fixing, test:
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123","preferredContact":"email","description":"Test"}'
```

## What the Correct File Should Look Like

First 10 lines should be:
```javascript
import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For testing, we can use Gmail SMTP or a service like Ethereal Email
  // In production, configure with actual SMTP credentials from .env
  
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
```

**NOT:**
```typescript
/**
 * Email API Client
 * Handles sending inquiry emails for Sell and Buy pages
 */

export interface SellInquiryData {
```

