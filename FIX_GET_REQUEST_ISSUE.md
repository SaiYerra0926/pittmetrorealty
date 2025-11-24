# 🔧 Fix: GET Request Instead of POST

## Problem
The error shows `"requestedMethod":"GET"` but the email routes only accept POST requests.

## Root Cause
The frontend might be:
1. Making a GET request due to browser behavior
2. Not properly setting the method in the fetch call
3. Being redirected or cached

## ✅ Solution Applied

### 1. Updated `src/lib/api/email.ts`
- Explicitly forces `method: 'POST'` in fetch options
- Added better logging to debug the issue
- Ensures method cannot be overridden

### 2. Updated `server.js`
- Added OPTIONS handlers for CORS preflight requests
- Added better logging to see what method is received

## 📋 Deployment Steps

### Step 1: Deploy Updated Files

```bash
# From your local machine:
scp src/lib/api/email.ts user@3.12.102.126:/path/to/project/src/lib/api/email.ts
scp server.js user@3.12.102.126:/path/to/project/server.js
```

### Step 2: Rebuild Frontend (if needed)

If you're using a build process:
```bash
npm run build
```

### Step 3: Restart Server

```bash
# On server:
pm2 restart all
# or
node server.js
```

## 🧪 Testing

After deployment, check browser console for:
```
📧 Email API: Sending request to http://3.12.102.126:3001/api/email/sell-inquiry
📧 Email API: Method: POST (forced)
```

And server logs should show:
```
📧 Sell inquiry email route hit - URL: /api/email/sell-inquiry Method: POST
```

## ⚠️ If Still Getting GET Requests

1. **Clear browser cache** - Old JavaScript might be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check browser console** - Look for the logging messages
4. **Check network tab** - Verify the actual HTTP method being sent

## 🔍 Debugging

If the issue persists, check:
1. Browser console logs for the email API calls
2. Server logs for the actual method received
3. Network tab in browser DevTools to see the request details

The code now explicitly forces POST method, so if you still see GET, it might be:
- Browser caching old JavaScript
- A redirect happening
- A proxy/load balancer changing the method

