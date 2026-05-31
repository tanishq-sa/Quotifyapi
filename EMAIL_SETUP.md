# 📧 Email Configuration Setup

## 🔧 Environment Variables

Add these variables to your `.env` file for email functionality:

```env
# Email Configuration (for contact form)
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_USER=support@dazzelr.tech
EMAIL_PASS=your-titan-password
```

## 📋 Titan Mail Setup (Current Configuration)

### 1. Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-factor authentication

### 2. Generate App Password
1. Go to Google Account → Security
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Enter "Quotify API" as the name
5. Copy the generated 16-character password

### 3. Update Environment Variables
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## 🔄 Alternative Email Services

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## 🧪 Testing Email Configuration

1. **Start the server**: `npm start`
2. **Visit contact page**: `http://localhost:3000/contact`
3. **Fill out the form** with test data
4. **Submit the form**
5. **Check your email** for the message

## 📧 Email Features

### What happens when someone submits the contact form:

1. **Message sent to you** (`support@dazzelr.tech`) with:
   - User's contact details
   - Their message
   - Formatted HTML email

2. **Auto-reply sent to user** with:
   - Confirmation message
   - Their message details
   - Contact information

### Email Templates

- **Professional HTML formatting**
- **Responsive design**
- **Clear message structure**
- **Contact details included**

### Contact Form Error Responses

The contact form endpoint (`POST /api/v1/contact`) returns standardized error payloads:

```json
{
  "success": false,
  "error": "Validation error",
  "message": "All fields are required"
}
```

| Status Code | Error Type | Example Message |
|-------------|-----------|-----------------|
| 400 | Validation error | `"All fields are required"` |
| 400 | Validation error | `"Please provide a valid email address"` |
| 500 | Internal server error | `"Something went wrong on the server"` (production) |

## 🚨 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check your email and password
   - Ensure 2FA is enabled for Gmail
   - Use app password, not regular password

2. **"Connection timeout"**
   - Check EMAIL_HOST and EMAIL_PORT
   - Verify firewall settings
   - Try different port (465 for SSL)

3. **"Invalid credentials"**
   - Double-check EMAIL_USER and EMAIL_PASS
   - Make sure app password is correct
   - Test with email client first

4. **"All fields are required" (400 error)**
   - Ensure `name`, `email`, and `message` fields are all provided
   - Verify the form data is sent as JSON with `Content-Type: application/json`

5. **Generic error in production**
   - Set `NODE_ENV=development` locally to see detailed error messages
   - Check server console logs for the full error

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
NODE_ENV=development
```

## 📞 Support

If you need help with email configuration:
- Check the server logs for detailed error messages
- Test your email credentials with a simple email client
- Verify your SMTP server settings

## 🔒 Security Notes

- **Never commit** your `.env` file to version control
- **Use app passwords** instead of regular passwords
- **Keep credentials secure** and rotate them regularly
- **Monitor email logs** for suspicious activity
- **Error responses are sanitized** in production — internal details are never exposed to the client
- **XSS protection** — all user-submitted form data displayed in the frontend is HTML-escaped

