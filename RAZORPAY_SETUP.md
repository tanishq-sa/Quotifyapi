# 🚀 Razorpay Payment Integration Setup

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **API Keys**: Get your Key ID and Key Secret from Razorpay Dashboard
3. **Plans**: Create subscription plans in Razorpay Dashboard

## 🔧 Environment Variables Setup

Add these variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Legacy Plan IDs (for one-time payments)
RAZORPAY_BASIC_PLAN_ID=plan_basic_monthly
RAZORPAY_PRO_PLAN_ID=plan_pro_monthly

# Subscription Plan IDs (for monthly/yearly billing)
RAZORPAY_MONTHLY_PLAN_ID=plan_monthly_subscription
RAZORPAY_YEARLY_PLAN_ID=plan_yearly_subscription
```

## 📝 Razorpay Dashboard Setup

### 1. Create Plans

1. Go to Razorpay Dashboard → Products → Plans
2. Create two plans:

**Basic Plan:**
- Plan ID: `plan_basic_monthly`
- Amount: ₹39.00
- Billing Period: Monthly
- Description: "Quotify API Basic Plan - 500 requests/day"

**Pro Plan:**
- Plan ID: `plan_pro_monthly`
- Amount: ₹199.00
- Billing Period: Monthly
- Description: "Quotify API Pro Plan - Unlimited requests"

### 2. Get API Keys

1. Go to Settings → API Keys
2. Generate new API keys (Test mode for development)
3. Copy Key ID and Key Secret

## 🧪 Testing

### Test Mode
- Use Razorpay test mode for development
- Test cards: 4111 1111 1111 1111 (Visa)
- Use any future expiry date and any CVV

### Production Mode
- Switch to live mode in Razorpay Dashboard
- Update API keys in production environment

## 🔄 Payment Flow

1. **User clicks pricing button** → `initiatePayment(plan)` called
2. **Create order** → POST `/api/v1/payments/create-order`
3. **Razorpay checkout** → Opens payment modal
4. **Payment success** → POST `/api/v1/payments/verify-payment`
5. **Update user plan** → Database updated with new plan
6. **Redirect to profile** → User sees updated plan

## 🛠️ API Endpoints

### Create Payment Order
```
POST /api/v1/payments/create-order
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "plan": "basic" | "pro"
}
```

### Verify Payment
```
POST /api/v1/payments/verify-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "order_id": "order_xxx",
  "payment_id": "pay_xxx",
  "signature": "signature_xxx"
}
```

### Get Current Plan
```
GET /api/v1/payments/current-plan
Authorization: Bearer <jwt_token>
```

## 🔒 Security Features

- ✅ Payment signature verification
- ✅ JWT authentication required
- ✅ Plan validation
- ✅ Order amount validation
- ✅ User-specific order creation

## 🎨 UI Features

- ✅ Clickable pricing buttons
- ✅ Loading states during payment
- ✅ Hover effects and animations
- ✅ Plan-specific color themes
- ✅ Error handling and user feedback

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
   - Ensure keys are from correct environment (test/live)

2. **"Plan not found"**
   - Verify plan IDs in Razorpay Dashboard
   - Check RAZORPAY_BASIC_PLAN_ID and RAZORPAY_PRO_PLAN_ID

3. **"Payment verification failed"**
   - Check signature verification logic
   - Ensure webhook URL is configured (if using)

4. **"User not found"**
   - Ensure user is logged in with valid JWT
   - Check database connection

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📞 Support

For Razorpay-specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For Quotify API issues:
- Check server logs
- Verify database connectivity
- Test API endpoints individually
