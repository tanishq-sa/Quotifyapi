# 🔧 Admin API Troubleshooting Guide

## 📋 Available Admin API Endpoints

The admin API is mounted at `/api/v1/admin/` and requires authentication. Here are all available endpoints:

### **System Management**
- `GET /api/v1/admin/stats` - Get system statistics
- `GET /api/v1/admin/analytics?days=30` - Get usage analytics

### **User Management**
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/users/:userId` - Get specific user details
- `PUT /api/v1/admin/users/:userId/plan` - Update user plan
- `POST /api/v1/admin/users/create-with-key` - Create user with API key
- `DELETE /api/v1/admin/users/:userId` - Delete user

### **API Key Management**
- `GET /api/v1/admin/keys` - Get admin API keys
- `POST /api/v1/admin/keys/generate` - Generate new admin API key
- `PUT /api/v1/admin/keys/regenerate` - Regenerate admin API key

---

## 🔍 Common Issues & Solutions

### **1. "Admin API not found" Error**

**Possible Causes:**
- Incorrect URL path
- Server not running
- Route not properly mounted

**Solutions:**
```bash
# Check if server is running
curl http://localhost:3000/api/v1/admin/stats

# Verify correct URL format
# ✅ Correct: /api/v1/admin/stats
# ❌ Wrong: /admin/stats
# ❌ Wrong: /api/admin/stats
```

### **2. "Authentication required" Error**

**Cause:** Missing or invalid authentication

**Solutions:**
```bash
# Using JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/stats

# Using API key
curl -H "x-api-key: YOUR_API_KEY" \
     http://localhost:3000/api/v1/admin/stats
```

### **3. "Access denied" Error**

**Cause:** User is not an admin

**Solutions:**
1. Verify user has admin role in database
2. Check if ADMIN_EMAIL environment variable is set correctly
3. Ensure user email matches admin email

### **4. "Rate limit exceeded" Error**

**Cause:** Too many admin requests

**Solutions:**
- Wait 15 minutes for rate limit to reset
- Check rate limit headers in response
- Reduce request frequency

---

## 🧪 Testing Admin API

### **Step 1: Test Basic Connectivity**
```bash
# Test if admin routes are accessible
curl -v http://localhost:3000/api/v1/admin/stats
```

### **Step 2: Test Authentication**
```bash
# Test with JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/stats

# Test with API key
curl -H "x-api-key: YOUR_API_KEY" \
     http://localhost:3000/api/v1/admin/stats
```

### **Step 3: Test Admin Authorization**
```bash
# This should work only for admin users
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/users
```

---

## 🔐 Authentication Methods

### **Method 1: JWT Token (Recommended)**
1. Login via Google OAuth: `GET /auth/google`
2. Get JWT token from callback
3. Use token in Authorization header

### **Method 2: API Key**
1. Generate API key via admin dashboard
2. Use API key in x-api-key header

---

## 📊 Example API Calls

### **Get System Statistics**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/stats
```

### **Get All Users**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/users
```

### **Update User Plan**
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan": "pro"}' \
     http://localhost:3000/api/v1/admin/users/123/plan
```

### **Create User with API Key**
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "plan": "basic"}' \
     http://localhost:3000/api/v1/admin/users/create-with-key
```

---

## 🚨 Debug Steps

### **1. Check Server Logs**
```bash
# Look for error messages in server console
# Check for authentication failures
# Verify route mounting
```

### **2. Verify Environment Variables**
```bash
# Check if ADMIN_EMAIL is set
echo $ADMIN_EMAIL

# Check if JWT_SECRET is set
echo $JWT_SECRET
```

### **3. Test Database Connection**
```bash
# Check if database is accessible
# Verify admin user exists
# Check user roles
```

### **4. Check Route Mounting**
```bash
# Verify admin routes are properly mounted
# Check for any middleware conflicts
# Ensure proper error handling
```

---

## 🔧 Quick Fixes

### **Fix 1: Restart Server**
```bash
# Stop server (Ctrl+C)
# Start server again
npm start
```

### **Fix 2: Check Admin Status**
```bash
# Verify user is admin in database
# Check admin email configuration
# Ensure proper authentication
```

### **Fix 3: Clear Rate Limits**
```bash
# Wait for rate limit reset
# Or restart server to clear rate limits
```

---

## 📞 Need Help?

If you're still having issues:

1. **Check server console** for error messages
2. **Verify your authentication** method
3. **Test with curl** commands above
4. **Check environment variables** are set correctly
5. **Ensure you're using the correct URL** format

The admin API should be working at `/api/v1/admin/` with proper authentication! 🚀
