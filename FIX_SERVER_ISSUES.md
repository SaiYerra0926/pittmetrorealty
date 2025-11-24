# 🔧 Fix Server Issues

## Issue 1: "Cannot read properties of undefined (reading 'firstName')"

**Problem:** The curl command is not sending JSON data.

**Solution:** Use the correct curl command with JSON body:

```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123-456-7890","preferredContact":"email","description":"Test inquiry"}'
```

## Issue 2: "SyntaxError: Unexpected token 'export'"

**Problem:** The `api/email.js` file on the server contains TypeScript code (interfaces).

**Solution:** The file on the server is corrupted. You need to copy the correct JavaScript file.

### Step 1: Check the file on server

```bash
# On server, check first 20 lines:
head -20 api/email.js
```

If you see `export interface`, the file is wrong.

### Step 2: Copy correct file from local machine

```bash
# From your LOCAL machine:
scp api/email.js ec2-user@3.12.102.126:/home/ec2-user/amitagarwalestateshowcase/api/email.js
```

### Step 3: Verify the file

```bash
# On server, check first line should be:
head -1 api/email.js
# Should show: import nodemailer from 'nodemailer';
```

### Step 4: Restart server

```bash
# Stop current server (Ctrl+C)
# Then start:
node server.js
```

## Quick Fix Commands

### On Server:

```bash
# 1. Check current file
head -20 api/email.js

# 2. If it has TypeScript, delete it
rm api/email.js

# 3. Copy correct file from local (run from local machine):
# scp api/email.js ec2-user@3.12.102.126:/home/ec2-user/amitagarwalestateshowcase/api/email.js

# 4. Verify
head -1 api/email.js

# 5. Restart
node server.js
```

### Test with correct curl:

```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123","preferredContact":"email","description":"Test"}'
```

