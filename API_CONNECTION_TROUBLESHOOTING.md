# API Connection Troubleshooting Guide

## ❌ Error: "Unable to connect to API server at http://3.12.102.126:3001/api"

### Problem
The frontend (https://pittmetrorealty.com) cannot connect to the API server at http://3.12.102.126:3001/api.

---

## 🔍 Possible Causes & Solutions

### 1. **Server Not Running** ⚠️

**Check:**
```bash
# SSH into your EC2 server
ssh ec2-user@3.12.102.126

# Check if server is running
ps aux | grep node
# OR
netstat -tulpn | grep 3001
```

**Solution:**
```bash
# Start the server
cd /path/to/amitagarwalestateshowcase
node server.js

# OR use PM2 to keep it running
pm2 start server.js
pm2 save
```

---

### 2. **Firewall/Security Group Not Allowing Port 3001** 🔥

**Check AWS Security Group:**
1. Go to AWS EC2 Console
2. Select your instance
3. Check Security Group rules
4. Ensure **Inbound Rule** allows:
   - **Type:** Custom TCP
   - **Port:** 3001
   - **Source:** 0.0.0.0/0 (or your specific IP)

**Check EC2 Firewall:**
```bash
# On your EC2 server
sudo firewall-cmd --list-all
# OR
sudo iptables -L -n

# If needed, allow port 3001
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

### 3. **CORS Configuration** 🌐

**Current Issue:** The frontend is on HTTPS but API is on HTTP. This can cause CORS issues.

**Fix in `server.js`:**

Update the CORS configuration to properly handle the production frontend:

```javascript
const allowedOrigins = [
  'https://pittmetrorealty.com',
  'https://www.pittmetrorealty.com',  // Add www version
  'https://pittmetrorealty.netlify.app',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001'
];
```

---

### 4. **Mixed Content (HTTPS → HTTP)** 🔒

**Problem:** Browsers block HTTP requests from HTTPS pages (mixed content).

**Solutions:**

**Option A: Use HTTPS for API (Recommended)**
- Set up SSL certificate for your API server
- Use domain name instead of IP
- Update `VITE_API_URL` to `https://api.pittmetrorealty.com`

**Option B: Use HTTP for Frontend (Not Recommended)**
- Only for testing, not production

**Option C: Use Proxy (Quick Fix)**
- Configure your frontend hosting (Netlify) to proxy API requests

---

### 5. **API URL Configuration** ⚙️

**Check your build environment variables:**

The frontend needs `VITE_API_URL` set during build time.

**For Netlify:**
1. Go to Site Settings → Environment Variables
2. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `http://3.12.102.126:3001/api` (or HTTPS if available)

**For local build:**
```bash
# Create .env file
echo "VITE_API_URL=http://3.12.102.126:3001/api" > .env

# Rebuild
npm run build
```

---

### 6. **Server Binding** 🖥️

**Verify server is listening on all interfaces:**

In `server.js`, ensure:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // This listens on all network interfaces
});
```

---

## 🧪 Testing Steps

### Step 1: Test API Server Directly

```bash
# From your local machine
curl http://3.12.102.126:3001/api/health

# Should return:
# {"success":true,"message":"API is running",...}
```

### Step 2: Test from Browser

Open in browser:
```
http://3.12.102.126:3001/api/health
```

### Step 3: Test CORS

```bash
curl -H "Origin: https://pittmetrorealty.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://3.12.102.126:3001/api/health
```

### Step 4: Check Server Logs

```bash
# On EC2 server, check if requests are reaching the server
# Look for incoming requests in server logs
```

---

## ✅ Quick Fix Checklist

- [ ] Server is running (`node server.js` or `pm2 list`)
- [ ] Port 3001 is open in AWS Security Group
- [ ] Port 3001 is open in EC2 firewall
- [ ] CORS includes `https://pittmetrorealty.com`
- [ ] `VITE_API_URL` is set in build environment
- [ ] Server is listening on `0.0.0.0:3001`
- [ ] Can access `http://3.12.102.126:3001/api/health` from browser

---

## 🔧 Recommended Production Setup

### 1. Use Domain Name Instead of IP

**Better:** `https://api.pittmetrorealty.com`  
**Instead of:** `http://3.12.102.126:3001`

### 2. Use HTTPS for API

- Set up SSL certificate (Let's Encrypt)
- Use Nginx as reverse proxy
- Update `VITE_API_URL` to HTTPS

### 3. Use Environment-Specific URLs

```env
# Development
VITE_API_URL=http://localhost:3001/api

# Production
VITE_API_URL=https://api.pittmetrorealty.com/api
```

---

## 🆘 Still Not Working?

1. **Check browser console** for detailed error
2. **Check server logs** for incoming requests
3. **Test with curl** to isolate network issues
4. **Check AWS CloudWatch** for server logs
5. **Verify DNS** if using domain name

---

## 📝 Files to Update

1. **`server.js`** - Update CORS origins
2. **`.env`** (on server) - Set `VITE_API_URL`
3. **Build environment** (Netlify) - Set `VITE_API_URL`
4. **AWS Security Group** - Open port 3001

---

**Most Common Issue:** Security Group not allowing port 3001 from internet!

