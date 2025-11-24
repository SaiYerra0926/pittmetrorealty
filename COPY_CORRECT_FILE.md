# ✅ Copy Correct Email File to Server

## Problem
The server has the **TypeScript file** (`src/lib/api/email.ts`) in `api/email.js` instead of the **JavaScript file**.

## Solution
Copy the correct `api/email.js` file from your local machine to the server.

## Step-by-Step Fix

### Step 1: Verify Local File is Correct

On your **local machine**, check:
```bash
head -1 api/email.js
```

Should show: `import nodemailer from 'nodemailer';`

### Step 2: Copy to Server

From your **local machine** (Windows PowerShell or Git Bash):

```bash
scp api/email.js ec2-user@3.12.102.126:/home/ec2-user/amitagarwalestateshowcase/api/email.js
```

**Note:** The path shows `/home/ec2-user/amitagarwalestateshowcase/amitagarwalestateshowcase/` which suggests a nested directory. You may need:

```bash
scp api/email.js ec2-user@3.12.102.126:/home/ec2-user/amitagarwalestateshowcase/amitagarwalestateshowcase/api/email.js
```

### Step 3: Verify on Server

On your **server**, check:
```bash
head -1 api/email.js
```

Should show: `import nodemailer from 'nodemailer';`

**NOT:** `export interface SellInquiryData {`

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
# Then:
node server.js
```

## Quick Fix (If SCP Doesn't Work)

If you can't use SCP, you can manually create the file on the server:

1. On your **local machine**, open `api/email.js`
2. Copy the entire file content
3. On the **server**, run:
   ```bash
   nano api/email.js
   ```
4. Delete all content (Ctrl+K repeatedly)
5. Paste the correct content
6. Save (Ctrl+X, then Y, then Enter)

## Verify It Works

After restarting, test:
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123","preferredContact":"email","description":"Test"}'
```

Should return success (or SMTP error if not configured, but route will work).

