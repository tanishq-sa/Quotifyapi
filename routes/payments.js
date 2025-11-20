const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { authenticateJWT } = require('../auth');
const { updateUserPlan, findUserById } = require('../database');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Debug: Check if Razorpay keys are configured
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Razorpay API keys not configured!');
    console.error('Missing:', {
        key_id: !process.env.RAZORPAY_KEY_ID,
        key_secret: !process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.log('✅ Razorpay API keys configured');
    console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('Key Secret length:', process.env.RAZORPAY_KEY_SECRET.length);
}


// Create subscription (monthly/yearly billing)
router.post('/create', authenticateJWT, async (req, res) => {
    try {
        const { plan, uid } = req.body;
        const userId = req.user.id;
        
        // Debug: Log received data
        console.log('Received subscription request:', {
            plan: plan,
            uid: uid,
            userId: userId,
            body: req.body
        });
        
        // Validate plan
        if (!plan || !['monthly', 'yearly'].includes(plan)) {
            console.log('Invalid plan received:', plan);
            return res.status(400).json({ 
                success: false, 
                error: `Invalid plan. Must be monthly or yearly. Received: ${plan}` 
            });
        }
        
        // Plan configurations - using correct plan IDs from Razorpay dashboard
        // IMPORTANT: The amount is determined by the plan configuration in Razorpay Dashboard, not here!
        // Make sure the plan_id points to a plan with the correct amount (₹39 for basic, ₹199 for pro)
        const planConfigs = {
            monthly: {
                amount: 3900, // INR 39 in paise (for reference only - actual amount comes from Razorpay plan)
                currency: 'INR',
                description: 'Quotify API Basic Plan - Monthly Billing',
                plan_id: 'plan_RGn7Uhj1COfGtE' // ⚠️ UPDATE THIS if you create a new plan with ₹39/month
                // The current plan_id shows ₹5 - you need to create a new plan with ₹39 in Razorpay Dashboard
            },
            yearly: {
                amount: 19900, // INR 199 in paise (for reference only - actual amount comes from Razorpay plan)
                currency: 'INR',
                description: 'Quotify API Pro Plan - Monthly Billing',
                plan_id: 'plan_RGn84v22hHCPTg' // ⚠️ UPDATE THIS if you create a new plan with ₹199/month
                // Make sure this plan_id points to a plan with ₹199/month in Razorpay Dashboard
            }
        };
        
        const config = planConfigs[plan];
        
        // Check if Razorpay is properly configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'Payment system not configured. Please contact support.'
            });
        }
        
        // Check if plan_id is configured
        if (!config.plan_id) {
            return res.status(500).json({
                success: false,
                error: `${plan} plan not configured. Please contact support.`
            });
        }
        
        // Create Razorpay subscription for monthly recurring billing
        // 10 years = 120 months of monthly billing
        const subscriptionOptions = {
            plan_id: config.plan_id,
            customer_notify: 1,
            quantity: 1,
            total_count: 120, // 10 years = 120 months of monthly billing
            start_at: Math.floor(Date.now() / 1000) + 10, // Start 10 seconds from now
            notes: {
                user_id: userId.toString(),
                uid: uid || '',
                plan: plan,
                description: config.description,
                billing_period: 'monthly',
                total_months: 120,
                valid_until: '2034-12-31' // 10 years from now
            }
        };
        
        console.log('Creating Razorpay subscription:', {
            plan_id: subscriptionOptions.plan_id,
            total_count: subscriptionOptions.total_count,
            billing_period: 'monthly',
            duration: '10 years (120 months)',
            start_at: new Date(subscriptionOptions.start_at * 1000).toISOString(),
            full_options: subscriptionOptions
        });
        
        const subscription = await razorpay.subscriptions.create(subscriptionOptions);
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            plan: plan,
            amount: config.amount,
            currency: config.currency,
            razorpayKey: process.env.RAZORPAY_KEY_ID, // Include key in response
            billingInfo: {
                period: 'monthly',
                total_charges: 120,
                duration: '10 years'
            }
        });
        
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        
        // Provide specific error messages based on the error type
        let errorMessage = 'Failed to create subscription';
        if (error.statusCode === 401) {
            errorMessage = 'Payment system authentication failed. Please contact support.';
        } else if (error.statusCode === 400) {
            errorMessage = 'Invalid subscription request. Please try again.';
        } else if (error.code === 'BAD_REQUEST_ERROR') {
            errorMessage = 'Payment system configuration error. Please contact support.';
        }
        
        res.status(500).json({ 
            success: false, 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Activate subscription (called after successful payment)
router.post('/activate', authenticateJWT, async (req, res) => {
    try {
        const { uid } = req.body;
        const userId = req.user.id;
        
        if (!uid) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing user UID' 
            });
        }
        
        // Update user plan to premium with extended validity until 2050
        const expiryDate = new Date('2050-12-31');
        await updateUserPlan(userId, 'pro', expiryDate);
        
        res.json({
            success: true,
            message: 'Subscription activated successfully!',
            plan: 'pro',
            expiry_date: expiryDate.toISOString(),
            isPremium: true
        });
        
    } catch (error) {
        console.error('Error activating subscription:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to activate subscription' 
        });
    }
});

// Verify subscription payment (webhook handler)
router.post('/verify-subscription', authenticateJWT, async (req, res) => {
    try {
        const { subscription_id, payment_id, signature } = req.body;
        const userId = req.user.id;
        
        if (!subscription_id || !payment_id || !signature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing subscription verification data' 
            });
        }
        
        // Verify payment signature
        const crypto = require('crypto');
        const body = subscription_id + '|' + payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        
        if (expectedSignature !== signature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid payment signature' 
            });
        }
        
        // Get subscription details to extract plan information
        const subscription = await razorpay.subscriptions.fetch(subscription_id);
        const plan = subscription.notes?.plan || subscription.notes?.original_plan;
        const originalPlan = req.body.plan || subscription.notes?.original_plan;
        
        // Map backend plan to frontend plan
        const planMapping = {
            'monthly': 'basic',
            'yearly': 'pro'
        };
        const frontendPlan = planMapping[plan] || originalPlan || 'pro';
        
        // Determine the user plan based on subscription
        let userPlan = 'pro';
        if (plan === 'monthly' || frontendPlan === 'basic') {
            userPlan = 'basic';
        } else if (plan === 'yearly' || frontendPlan === 'pro') {
            userPlan = 'pro';
        }
        
        // Update user plan with extended validity until 2034 (10 years from now)
        const expiryDate = new Date('2034-12-31');
        await updateUserPlan(userId, userPlan, expiryDate);
        
        res.json({
            success: true,
            message: `Successfully subscribed to ${frontendPlan.charAt(0).toUpperCase() + frontendPlan.slice(1)} plan! Monthly billing for 10 years (120 months).`,
            plan: frontendPlan,
            userPlan: userPlan,
            expiry_date: expiryDate.toISOString(),
            subscription_id: subscription_id,
            type: 'subscription',
            billing_info: {
                period: 'monthly',
                total_charges: 120,
                duration: '10 years'
            }
        });
        
    } catch (error) {
        console.error('Error verifying subscription:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to verify subscription' 
        });
    }
});

// Get current user's plan
router.get('/current-plan', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await findUserById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            plan: user.plan || 'free'
        });
        
    } catch (error) {
        console.error('Error getting current plan:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get current plan' 
        });
    }
});

// Get Razorpay public key (for frontend)
router.get('/razorpay-key', (req, res) => {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        
        if (!keyId) {
            return res.status(500).json({
                success: false,
                error: 'Payment system not configured'
            });
        }
        
        res.json({
            success: true,
            key: keyId
        });
    } catch (error) {
        console.error('Error getting Razorpay key:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment key'
        });
    }
});

// Create subscription endpoint (alias for compatibility)
router.post('/create-subscription', authenticateJWT, async (req, res) => {
    // Reuse the same logic as /create endpoint
    try {
        const { plan, uid } = req.body;
        const userId = req.user.id;
        
        // Debug: Log received data
        console.log('Received subscription request (create-subscription):', {
            plan: plan,
            uid: uid,
            userId: userId,
            body: req.body
        });
        
        // Map frontend plan names to backend plan names
        const planMapping = {
            'basic': 'monthly',
            'pro': 'yearly'
        };
        
        const backendPlan = planMapping[plan] || plan;
        
        // Validate plan
        if (!backendPlan || !['monthly', 'yearly'].includes(backendPlan)) {
            console.log('Invalid plan received:', plan, 'mapped to:', backendPlan);
            return res.status(400).json({ 
                success: false, 
                error: `Invalid plan. Must be basic/monthly or pro/yearly. Received: ${plan}` 
            });
        }
        
        // Plan configurations - using Razorpay Subscriptions for monthly recurring billing
        // IMPORTANT: The amount is determined by the plan configuration in Razorpay Dashboard, not here!
        // Make sure the plan_id points to a plan with the correct amount (₹39 for basic, ₹199 for pro)
        const planConfigs = {
            monthly: {
                amount: 3900, // INR 39 in paise (for reference only - actual amount comes from Razorpay plan)
                currency: 'INR',
                description: 'Quotify API Basic Plan - Monthly Billing',
                plan_id: 'plan_RGn7Uhj1COfGtE' // ⚠️ UPDATE THIS if you create a new plan with ₹39/month
                // The current plan_id shows ₹5 - you need to create a new plan with ₹39 in Razorpay Dashboard
            },
            yearly: {
                amount: 19900, // INR 199 in paise (for reference only - actual amount comes from Razorpay plan)
                currency: 'INR',
                description: 'Quotify API Pro Plan - Monthly Billing',
                plan_id: 'plan_RGn84v22hHCPTg' // ⚠️ UPDATE THIS if you create a new plan with ₹199/month
                // Make sure this plan_id points to a plan with ₹199/month in Razorpay Dashboard
            }
        };
        
        const config = planConfigs[backendPlan];
        
        // Check if Razorpay is properly configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'Payment system not configured. Please contact support.'
            });
        }
        
        // Check if plan_id is configured
        if (!config.plan_id) {
            return res.status(500).json({
                success: false,
                error: `${backendPlan} plan not configured. Please contact support.`
            });
        }
        
        // Create Razorpay Subscription for monthly recurring billing
        // 10 years = 120 months of monthly billing
        const subscriptionOptions = {
            plan_id: config.plan_id,
            customer_notify: 1,
            quantity: 1,
            total_count: 120, // 10 years = 120 months of monthly billing
            start_at: Math.floor(Date.now() / 1000) + 10, // Start 10 seconds from now
            notes: {
                user_id: userId.toString(),
                uid: uid || '',
                plan: backendPlan,
                original_plan: plan,
                description: config.description,
                billing_period: 'monthly',
                total_months: 120,
                valid_until: '2034-12-31' // 10 years from now
            }
        };
        
        console.log('Creating Razorpay subscription:', {
            plan_id: subscriptionOptions.plan_id,
            total_count: subscriptionOptions.total_count,
            billing_period: 'monthly',
            duration: '10 years (120 months)',
            start_at: new Date(subscriptionOptions.start_at * 1000).toISOString(),
            full_options: subscriptionOptions
        });
        
        const subscription = await razorpay.subscriptions.create(subscriptionOptions);
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            plan: backendPlan,
            originalPlan: plan,
            amount: config.amount,
            currency: config.currency,
            razorpayKey: process.env.RAZORPAY_KEY_ID, // Include key in response
            billingInfo: {
                period: 'monthly',
                total_charges: 120,
                duration: '10 years'
            }
        });
        
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        
        // Provide specific error messages based on the error type
        let errorMessage = 'Failed to create subscription';
        if (error.statusCode === 401) {
            errorMessage = 'Payment system authentication failed. Please contact support.';
        } else if (error.statusCode === 400) {
            errorMessage = 'Invalid subscription request. Please try again.';
        } else if (error.code === 'BAD_REQUEST_ERROR') {
            errorMessage = 'Payment system configuration error. Please contact support.';
        }
        
        res.status(500).json({ 
            success: false, 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
