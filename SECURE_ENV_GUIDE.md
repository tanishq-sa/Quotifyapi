# 🔒 SECURE ENVIRONMENT CONFIGURATION GUIDE

## 🚨 CRITICAL: Your current .env file has MAJOR security vulnerabilities!

### **IMMEDIATE ACTIONS REQUIRED:**

1. **Generate new JWT_SECRET** (32+ characters)
2. **Generate new SESSION_SECRET** (32+ characters)  
3. **Regenerate Google OAuth credentials**
4. **Change NODE_ENV to production**

---

## 🔐 SECURE .ENV CONFIGURATION

Replace your current `.env` file with this secure configuration:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration - MUST be 32+ characters, cryptographically secure
JWT_SECRET=your-super-secure-jwt-secret-key-here-32-chars-minimum-change-this
JWT_EXPIRES_IN=7d

# Google OAuth Configuration - Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Database Configuration
DATABASE_URL=./database.sqlite

# API Configuration
API_BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Session Configuration - MUST be 32+ characters, cryptographically secure
SESSION_SECRET=your-super-secure-session-secret-key-here-32-chars-minimum

# Admin Configuration
ADMIN_EMAIL=your-admin@email.com
```

---

## 🛠️ HOW TO GENERATE SECURE SECRETS

### **1. Generate JWT_SECRET (32+ characters)**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using online generator (use only trusted sites)
# https://generate-secret.vercel.app/32
```

### **2. Generate SESSION_SECRET (32+ characters)**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### **3. Regenerate Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Delete the old OAuth 2.0 client
5. Create a new OAuth 2.0 client
6. Update the credentials in your .env file

---

## 🔒 SECURITY CHECKLIST

- [ ] JWT_SECRET is 32+ characters and cryptographically random
- [ ] SESSION_SECRET is 32+ characters and cryptographically random
- [ ] Google OAuth credentials are regenerated
- [ ] NODE_ENV is set to "production"
- [ ] All URLs use HTTPS in production
- [ ] Admin email is set to your actual admin email
- [ ] .env file is in .gitignore (never commit to version control)
- [ ] Razorpay keys are from the correct environment (test/live)
- [ ] Email credentials use app passwords, not regular passwords

---

## ⚠️ CRITICAL WARNINGS

1. **NEVER commit .env files to version control**
2. **NEVER share secrets in chat/email**
3. **NEVER use default/example secrets in production**
4. **ALWAYS use HTTPS in production**
5. **REGULARLY rotate secrets (every 90 days)**

---

## 🛡️ XSS PROTECTION

Quotify API includes built-in XSS (Cross-Site Scripting) protection:

### Frontend Sanitisation
All dynamic content injected into the DOM is processed through a global `escapeHTML()` function in `public/script.js`. This covers:
- API response payloads displayed in the try-it tool
- API key values shown in request previews
- Error messages rendered in the response area
- URL strings displayed in request details

### Admin Dashboard
The admin dashboard (`public/admin.html`) escapes user-provided data (names, emails) before rendering in confirmation modals to prevent stored XSS attacks.

### Best Practice
If you extend the frontend, always use `escapeHTML()` before inserting any user- or server-sourced string into `innerHTML`:
```javascript
element.innerHTML = `<p>${escapeHTML(untrustedData)}</p>`;
```

---

## 🚨 ERROR HANDLING SECURITY

### Standardised Error Responses
All API routes return a consistent error payload format:
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Human-readable description"
}
```

### Production Error Masking
In production (`NODE_ENV=production`), the global error handler in `server.js`:
- **Masks 500-level errors** — clients only see `"Something went wrong on the server"`
- **Preserves 400-level errors** — validation messages are passed through to help API consumers
- **Suppresses stack traces** — the `details` field is omitted entirely
- **Logs minimal info** — only `error.message` is logged (not the full error object)

In development (`NODE_ENV=development`), full error details including stack traces are returned for debugging.

---

## 🚀 PRODUCTION DEPLOYMENT

For production deployment, set these as environment variables in your hosting platform:

- Vercel: Project Settings > Environment Variables
- Heroku: Settings > Config Vars
- Railway: Variables tab
- DigitalOcean: App Platform > Settings > Environment

---

## 🔍 SECURITY VALIDATION

After updating your .env file, restart your server and verify:

1. No error messages about weak secrets
2. JWT tokens are properly validated
3. Sessions work correctly
4. OAuth login functions properly
5. Admin access is restricted
6. Error responses don't leak internal details (test with `NODE_ENV=production`)
7. XSS payloads in API responses are rendered as plain text

---

**Remember: Security is not optional - it's essential!** 🔐

