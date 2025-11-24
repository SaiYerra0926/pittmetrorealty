# 📝 Correct curl Commands for Testing Email Endpoints

## ✅ Test Sell Inquiry Endpoint

### One-line version (copy-paste ready):

```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123-456-7890","preferredContact":"email","description":"Test inquiry"}'
```

### Multi-line version (easier to read):

```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "123-456-7890",
    "preferredContact": "email",
    "description": "Test inquiry description"
  }'
```

---

## ✅ Test Buy Inquiry Endpoint

### One-line version:

```bash
curl -X POST http://3.12.102.126:3001/api/email/buy-inquiry -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"Buyer","email":"buyer@example.com","phone":"123-456-7890","budget":"300k-500k","timeline":"1-3-months","preferredAreas":"Pittsburgh","firstTimeBuyer":false,"additionalInfo":"Looking for a house"}'
```

### Multi-line version:

```bash
curl -X POST http://3.12.102.126:3001/api/email/buy-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Buyer",
    "email": "buyer@example.com",
    "phone": "123-456-7890",
    "budget": "300k-500k",
    "timeline": "1-3-months",
    "preferredAreas": "Pittsburgh",
    "firstTimeBuyer": false,
    "additionalInfo": "Looking for a house"
  }'
```

---

## ⚠️ Common Mistakes

### ❌ WRONG (Missing JSON body):
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry
```
**Result:** `"Cannot read properties of undefined (reading 'firstName')"`

### ❌ WRONG (Missing Content-Type header):
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry -d '{"firstName":"Test"}'
```
**Result:** Body might not be parsed correctly

### ✅ CORRECT:
```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123","preferredContact":"email","description":"Test"}'
```

---

## 📋 Required Fields

### For Sell Inquiry:
- `firstName` (required)
- `lastName` (required)
- `email` (required)
- `phone` (required)
- `preferredContact` (required: "email", "phone", or "text")
- `description` (required)

### For Buy Inquiry:
- `firstName` (required)
- `lastName` (required)
- `email` (required)
- `phone` (required)
- `budget` (optional)
- `timeline` (optional)
- `preferredAreas` (optional)
- `firstTimeBuyer` (optional: true/false)
- `additionalInfo` (optional)

---

## ✅ Expected Success Response

```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "..."
}
```

---

## 🔧 If You Get SMTP Error

If you get an error about SMTP credentials, that's normal - it means:
- ✅ The route is working correctly
- ✅ The request body is being parsed correctly
- ⚠️ You just need to configure SMTP in `.env` file

The route itself is functional!

