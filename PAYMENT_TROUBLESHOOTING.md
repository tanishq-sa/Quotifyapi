# 🔧 Payment Verification Troubleshooting Guide

## 📋 Quick Diagnostic Steps

When you see "Payment verification failed. Please contact support.", follow these steps:

### **Step 1: Check Browser Console** 🖥️

1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Look for these log messages:

```javascript
💳 Payment completed, verifying...
📡 Verification response status: XXX
📦 Verification data: {...}
```

### **Step 2: Check Server Logs** 📊

Look for these patterns in your Vercel/server logs:

```
🔍 Verifying subscription payment:
✅ Signature verified successfully
✅ Subscription fetched:
✅ Payment verified with Razorpay:
📝 Updating user plan in database:
✅ User plan updated successfully
```

---

## 🚨 Common Errors & Solutions

### **Error 1: "Missing subscription verification data"**

**Symptom:**

```json
{
  "success": false,
  "error": "Missing subscription verification data",
  "received": {
    "has_subscription_id": false,
    "has_payment_id": true,
    "has_signature": true
  }
}
```

**Cause:** Razorpay didn't return all required fields

**Solution:**

1. Check if Razorpay Checkout is properly initialized
2. Verify `subscription_id` is passed in the options
3. Make sure you're using subscription flow, not orders

---

### **Error 2: "Invalid payment signature"**

**Symptom:**

```
❌ Signature mismatch with payment_id|subscription_id!
```

**Causes & Solutions:**

#### **A. Wrong Razorpay Key Secret**

```bash
# Check your environment variables
echo $RAZORPAY_KEY_SECRET

# Verify in Vercel Dashboard:
# Settings → Environment Variables → RAZORPAY_KEY_SECRET
```

**Fix:** Update with correct key from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)

#### **B. Test Mode vs Live Mode Mismatch**

- Using **Test Key ID** with **Live Key Secret** (or vice versa)

**Fix:** Ensure both keys are from the same mode:

- Test: `rzp_test_XXXXX` + `test_secret_XXXXX`
- Live: `rzp_live_XXXXX` + `live_secret_XXXXX`

---

### **Error 3: "Subscription is not active"**

**Symptom:**

```json
{
  "success": false,
  "error": "Subscription is not active. Status: cancelled",
  "subscription_status": "cancelled"
}
```

**Causes:**

- Subscription was cancelled before verification
- Payment failed during authorization
- Subscription expired

**Solution:**

1. Check subscription status in [Razorpay Dashboard](https://dashboard.razorpay.com/app/subscriptions)
2. If cancelled, create a new subscription
3. If payment failed, ask user to retry with different payment method

---

### **Error 4: "Failed to update subscription in database"**

**Symptom:**

```json
{
  "success": false,
  "error": "Failed to update subscription in database",
  "db_error": "..."
}
```

**Causes:**

- Database connection timeout
- Invalid user ID
- Database permissions issue

**Solution:**

1. Check PostgreSQL connection in Vercel logs
2. Verify `DATABASE_URL` environment variable
3. Test database connection:

```bash
psql $DATABASE_URL -c "SELECT 1;"
```

---

### **Error 5: "Payment not successful. Status: refunded"**

**Symptom:**

```
⚠️ Payment refunded but subscription is active
```

**This is NORMAL!** ✅

Razorpay uses a ₹5 authorization charge to verify the payment method. This charge is **automatically refunded** after subscription creation. The subscription itself is what matters.

**No action needed** - the system handles this automatically.

---

## 🔍 Detailed Debugging

### **Enable Development Mode Logging**

Add to your `.env`:

```bash
NODE_ENV=development
```

This will show detailed error messages in API responses.

### **Check Razorpay Webhook Logs**

1. Go to [Razorpay Dashboard → Webhooks](https://dashboard.razorpay.com/app/webhooks)
2. Check recent webhook deliveries
3. Look for failed deliveries or errors

### **Verify Plan Configuration**

```javascript
// In routes/payments.js, check plan IDs:
const planConfigs = {
    monthly: {
        plan_id: 'plan_RhsDup97U5InAI' // ₹39/month
    },
    yearly: {
        plan_id: 'plan_RhsEUETmI3zDJN' // ₹199/month
    }
};
```

**Verify these plan IDs exist in your Razorpay Dashboard:**

1. Go to [Subscriptions → Plans](https://dashboard.razorpay.com/app/subscriptions/plans)
2. Check if plan IDs match
3. Verify amounts are correct (₹39 = 3900 paise, ₹199 = 19900 paise)

---

## 🧪 Test Payment Flow

### **Using Razorpay Test Mode**

1. Use test credentials:
   - Key ID: `rzp_test_XXXXX`
   - Key Secret: `test_secret_XXXXX`

2. Test card numbers:
   - **Success:** `4111 1111 1111 1111`
   - **Failure:** `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

3. Test UPI:
   - **Success:** `success@razorpay`
   - **Failure:** `failure@razorpay`

### **Verify Complete Flow**

```bash
# 1. Check Razorpay keys are set
curl https://your-domain.vercel.app/api/health

# 2. Create subscription
curl -X POST https://your-domain.vercel.app/api/v1/payments/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly"}'

# 3. Check logs for subscription creation
# 4. Complete payment in Razorpay Checkout
# 5. Check verification logs
```

---

## 📞 Still Having Issues?

### **Collect This Information:**

1. **Browser Console Logs:**
   - Screenshot of console errors
   - Network tab showing failed requests

2. **Server Logs:**
   - Last 50 lines from Vercel logs
   - Any error stack traces

3. **Razorpay Dashboard:**
   - Subscription ID
   - Payment ID
   - Subscription status

4. **Environment:**
   - Are you using Test or Live mode?
   - Which payment method was used?
   - What plan was selected?

### **Contact Support:**

Email: [Your Support Email]

Include:

- User email
- Timestamp of failed payment
- Subscription ID (if available)
- Error message from console
- Server logs

---

## ✅ Success Indicators

When payment works correctly, you should see:

**Browser Console:**

```
💳 Payment completed, verifying...
📡 Verification response status: 200
📦 Verification data: { success: true, ... }
🎉 Subscription Successful!
```

**Server Logs:**

```
🔍 Verifying subscription payment: { subscription_id: 'sub_...', ... }
✅ Signature verified successfully
✅ Subscription fetched: { status: 'active', ... }
✅ Payment verified with Razorpay: { status: 'captured', ... }
📝 Updating user plan in database: { userId: 123, userPlan: 'basic', ... }
✅ User plan updated successfully
✅ Subscription verification completed successfully
```

**User Experience:**

1. Razorpay checkout opens
2. User completes payment
3. Alert shows "🎉 Subscription Successful!"
4. Redirects to profile page
5. Profile shows new plan with "✓ Current Plan" badge

---

## 🔐 Security Checklist

- [ ] Razorpay keys are stored in environment variables (not in code)
- [ ] Using HTTPS in production
- [ ] JWT tokens are properly validated
- [ ] Signature verification is enabled
- [ ] Webhook secret is configured (if using webhooks)
- [ ] Database credentials are secure
- [ ] API keys are not exposed in client-side code

---

## 📚 Additional Resources

- [Razorpay Subscriptions Documentation](https://razorpay.com/docs/api/subscriptions/)
- [Razorpay Payment Verification](https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [PostgreSQL Connection Issues](https://www.postgresql.org/docs/current/libpq-connect.html)

---

**Last Updated:** November 21, 2026
**Version:** 1.0.0
