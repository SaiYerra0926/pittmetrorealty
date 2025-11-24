# ✅ Correct Way to Test Email Endpoint

## The Error
```
{"success":false,"message":"Failed to send email","error":"Cannot read properties of undefined (reading 'firstName')"}
```

This means the route is working, but the request body is empty or not parsed correctly.

## ✅ Correct curl Command

### Test Sell Inquiry (with proper JSON body):

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

### Or in one line:

```bash
curl -X POST http://3.12.102.126:3001/api/email/sell-inquiry -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"123-456-7890","preferredContact":"email","description":"Test"}'
```

### Test Buy Inquiry:

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

## Expected Success Response

```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "..."
}
```

## If You Get SMTP Error

If you get an error about SMTP, that's normal - it means the route is working but email sending needs SMTP configuration. The route itself is functional!

