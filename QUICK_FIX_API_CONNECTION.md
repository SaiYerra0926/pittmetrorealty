# Quick Fix: API Connection Error

## 🚨 Error
```
Unable to connect to API server at http://3.12.102.126:3001/api
```

## ✅ Immediate Actions (Do These First!)

### 1. **Check if Server is Running** (Most Common Issue)

**On your EC2 server:**
```bash
# SSH into server
ssh ec2-user@3.12.102.126

# Check if server is running
ps aux | grep node

# If not running, start it:
cd /path/to/amitagarwalestateshowcase
node server.js

# OR use PM2 (recommended for production):
pm2 start server.js --name api-server
pm2 save
pm2 startup  # Run this once to auto-start on reboot
```

---

### 2. **Check AWS Security Group** (Very Common Issue!)

**This is the #1 cause of connection issues!**

1. Go to **AWS Console → EC2 → Instances**
2. Select your instance (IP: 3.12.102.126)
3. Click **Security** tab
4. Click on the **Security Group**
5. Click **Edit Inbound Rules**
6. **Add Rule:**
   - **Type:** Custom TCP
   - **Port:** 3001
   - **Source:** 0.0.0.0/0 (or your specific IP for security)
   - **Description:** API Server Port
7. Click **Save Rules**

**Test:**
```bash
# From your local machine
curl http://3.12.102.126:3001/api/health
```

---

### 3. **Check EC2 Firewall** (If Security Group is OK)

**On your EC2 server:**
```bash
# Check firewall status
sudo firewall-cmd --list-all

# If port 3001 is not listed, add it:
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

---

### 4. **Verify Server is Listening on All Interfaces**

**Check `server.js` line 104:**
```javascript
app.listen(PORT, '0.0.0.0', () => {  // ✅ Must be '0.0.0.0'
```

**If it says `'localhost'` or `'127.0.0.1'`, change it to `'0.0.0.0'`**

---

### 5. **Test API Directly**

**From your browser, open:**
```
http://3.12.102.126:3001/api/health
```

**Should return:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "..."
}
```

**If this doesn't work, the server is not accessible from the internet.**

---

## 🔧 Additional Fixes

### Fix CORS (Already Updated in server.js)

The CORS configuration has been updated to include:
- `https://pittmetrorealty.com`
- `https://www.pittmetrorealty.com`

**Restart server after updating:**
```bash
# Stop current server (Ctrl+C)
# Then restart:
node server.js
```

---

### Fix Mixed Content (HTTPS → HTTP)

**Problem:** Browser blocks HTTP requests from HTTPS pages.

**Quick Test:**
1. Open browser console on https://pittmetrorealty.com
2. Look for "Mixed Content" errors

**Solutions:**

**Option 1: Use HTTPS for API (Best)**
- Set up SSL certificate
- Use domain: `https://api.pittmetrorealty.com`
- Update `VITE_API_URL`

**Option 2: Use Proxy (Netlify)**
- Add to `netlify.toml`:
```toml
[[redirects]]
  from = "/api/*"
  to = "http://3.12.102.126:3001/api/:splat"
  status = 200
  force = true
```

**Option 3: Temporary - Allow Mixed Content (Not Recommended)**
- Only for testing
- Browser settings → Allow insecure content

---

## 📋 Checklist

Run through this checklist:

- [ ] Server is running (`ps aux | grep node`)
- [ ] Port 3001 is open in AWS Security Group
- [ ] Port 3001 is open in EC2 firewall
- [ ] Server listens on `0.0.0.0:3001` (not localhost)
- [ ] Can access `http://3.12.102.126:3001/api/health` from browser
- [ ] CORS includes `https://pittmetrorealty.com`
- [ ] `VITE_API_URL` is set in Netlify environment variables
- [ ] Frontend was rebuilt after setting `VITE_API_URL`

---

## 🧪 Test Commands

**1. Test from local machine:**
```bash
curl http://3.12.102.126:3001/api/health
```

**2. Test CORS:**
```bash
curl -H "Origin: https://pittmetrorealty.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://3.12.102.126:3001/api/health
```

**3. Test from server itself:**
```bash
curl http://localhost:3001/api/health
```

---

## 🎯 Most Likely Solution

**90% of the time, it's the AWS Security Group!**

1. Open AWS Console
2. EC2 → Your Instance → Security Group
3. Add Inbound Rule for port 3001
4. Test: `curl http://3.12.102.126:3001/api/health`

---

## 📞 Still Not Working?

1. **Check server logs** on EC2
2. **Check browser console** for detailed error
3. **Check AWS CloudWatch** logs
4. **Verify** server is actually running

---

**Files Updated:**
- ✅ `server.js` - Added www.pittmetrorealty.com to CORS

**Next Steps:**
1. Update AWS Security Group (port 3001)
2. Restart server
3. Test connection

