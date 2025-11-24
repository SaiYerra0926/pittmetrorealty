# Email Setup Guide for Sell & Buy Page Inquiries

## ✅ Implementation Complete

The email functionality has been successfully implemented for both **Sell** and **Buy** pages. When customers submit their information, a professionally formatted email will be sent to **saibabu345@gmail.com** (for testing).

---

## 📧 Email Recipient

**Recipient Email:** `aggarwal_a@hotmail.com`

All Sell and Buy page inquiries will be sent to this email address.

To change the recipient email, update the `recipientEmail` variable in:
- `api/email.js` (lines 352 and 401)

---

## 🔧 SMTP Configuration

To enable email sending, you need to configure SMTP settings in your `.env` file:

### Option 1: Gmail SMTP (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Pitt Metro Realty" as the name
   - Copy the generated 16-character password

3. **Add to `.env` file:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Option 2: Hotmail/Outlook SMTP

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=aggarwal_a@hotmail.com
SMTP_PASS=your-password
```

### Option 3: Other SMTP Providers

For other providers (SendGrid, Mailgun, etc.), update the SMTP settings accordingly.

---

## 📋 Email Format

The emails are sent in **HTML format** with a professional design including:

### For Sell Page:
- Personal Information (Name, Email, Phone, Preferred Contact)
- Property Details & Requirements (Description)
- Submission Information (Date/Time, Source)

### For Buy Page:
- Personal Information (Name, Email, Phone)
- Property Preferences (Budget, Timeline, Preferred Areas, First-Time Buyer)
- Additional Information
- Submission Information (Date/Time, Source)

Both HTML and plain text versions are included for maximum compatibility.

---

## 🚀 How It Works

1. **Customer fills out the form** on Sell or Buy page
2. **Clicks "Submit Application"** or "Submit Buyer Information"
3. **Form data is validated** (required fields checked)
4. **Email is sent** to `saibabu345@gmail.com` via API
5. **Success/Error notification** is shown to the customer
6. **Form is reset** after successful submission

---

## 🔌 API Endpoints

- **POST** `/api/email/sell-inquiry` - Send sell inquiry email
- **POST** `/api/email/buy-inquiry` - Send buy inquiry email

Both endpoints accept JSON data with the form fields and return:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "..."
}
```

---

## 🧪 Testing

1. **Start your server:**
   ```bash
   npm run server
   ```

2. **Fill out the form** on the Sell or Buy page
3. **Submit the form**
4. **Check the email** at `saibabu345@gmail.com`
5. **Verify** all information is correctly formatted

---

## ⚠️ Important Notes

- **SMTP credentials are required** for emails to actually send
- **Without SMTP configuration**, the email sending will fail
- **Gmail requires App Passwords** (not regular passwords) when 2FA is enabled
- **The email format is already approved** and matches the proposal in `EMAIL_FORMAT_PROPOSAL.md`

---

## 📝 Next Steps

1. **Configure SMTP settings** in your `.env` file
2. **Test email sending** by submitting a form
3. **Verify email delivery** at `saibabu345@gmail.com`
4. **Update recipient email** to `aggarwal_a@hotmail.com` when ready for production

---

## 🐛 Troubleshooting

### Email not sending?
- Check SMTP credentials in `.env` file
- Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set
- Check server logs for error messages
- For Gmail, ensure you're using an App Password, not your regular password

### Email sent but not received?
- Check spam/junk folder
- Verify recipient email address is correct
- Check SMTP provider's sending limits

### Form submission error?
- Check browser console for errors
- Verify API server is running
- Check network tab for API request/response

---

## 📄 Files Modified/Created

1. **`api/email.js`** - Email service with HTML templates
2. **`src/lib/api/email.ts`** - Frontend API client
3. **`src/pages/Sell.tsx`** - Updated to send emails on submit
4. **`src/pages/Buy.tsx`** - Updated to send emails on submit
5. **`server.js`** - Added email routes
6. **`EMAIL_FORMAT_PROPOSAL.md`** - Email format documentation

---

## ✨ Features

- ✅ Professional HTML email formatting
- ✅ Plain text fallback for compatibility
- ✅ Form validation before sending
- ✅ Loading states during submission
- ✅ Success/Error toast notifications
- ✅ Automatic form reset after success
- ✅ Reply-To set to customer's email
- ✅ Submission timestamp included
- ✅ Source identification (Sell/Buy page)

