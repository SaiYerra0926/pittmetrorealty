# 🧪 Testing Email Endpoint

## Correct curl Command Syntax

### Test Sell Inquiry Endpoint

```bash
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

### Test Buy Inquiry Endpoint

```bash
curl -X POST http://3.12.102.126:3001/api/email/buy-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "123-456-7890",
    "budget": "300k-500k",
    "timeline": "1-3-months",
    "preferredAreas": "Pittsburgh",
    "firstTimeBuyer": false,
    "additionalInfo": "Test inquiry"
  }'
```

## Expected Responses

### If Route is Deployed (Success):
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "..."
}
```

### If Route is NOT Deployed (Current Issue):
```json
{
  "success": false,
  "message": "API endpoint not found"
}
```

### If Missing Required Fields:
```json
{
  "success": false,
  "message": "Missing required fields: firstName, lastName, email, phone"
}
```

