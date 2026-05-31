const express = require('express');
const router = express.Router();

// Middleware to ensure all error responses contain both 'error' and 'message' properties
router.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(obj) {
        if (res.statusCode >= 400 && obj && typeof obj === 'object') {
            if (obj.error && !obj.message) {
                // If message is missing, fallback to error description
                obj.message = obj.error;
                
                // Map generic categories if error is a known short code
                if (res.statusCode === 400 && obj.error !== 'Validation error' && !obj.error.includes('mismatch') && !obj.error.includes('signature')) {
                    obj.message = obj.error;
                    obj.error = 'Validation error';
                } else if (res.statusCode === 404 && obj.error !== 'User not found' && obj.error !== 'Not found') {
                    obj.message = obj.error;
                    obj.error = 'Not found';
                } else if (res.statusCode === 500 && obj.error !== 'Internal server error' && obj.error !== 'Configuration error') {
                    obj.message = obj.error;
                    obj.error = 'Internal server error';
                }
            }
        }
        return originalJson.call(this, obj);
    };
    next();
});
const Razorpay = require('razorpay');
const { authenticateJWT, generateToken } = require('../auth');
const database = require('../database-adapter');

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


// Shared plan configurations for subscription creation
// IMPORTANT: The amount is determined by the plan configuration in Razorpay Dashboard, not here!
const planConfigs = {
    monthly: {
        amount: 3900, // INR 39 in paise (for reference only - actual amount comes from Razorpay plan)
        currency: 'INR',
        description: 'Quotify API Basic Plan - Monthly Billing',
        plan_id: 'plan_RhsDup97U5InAI' // Quotify Basic Subscription - ₹39/month
    },
    yearly: {
        amount: 19900, // INR 199 in paise (for reference only - actual amount comes from Razorpay plan)
        currency: 'INR',
        description: 'Quotify API Pro Plan - Monthly Billing',
        plan_id: 'plan_RhsEUETmI3zDJN' // ⚠️ UPDATE THIS if you create a new plan with ₹199/month
    }
};

// Plan name mapping: frontend plan name → backend (Razorpay) plan name
const frontendToBackendPlan = {
    'basic': 'monthly',
    'pro': 'yearly'
};

/**
 * Shared helper for creating Razorpay subscriptions.
 * Used by both /create and /create-subscription endpoints.
 * @param {object} options
 * @param {number} options.userId - The authenticated user's ID
 * @param {string} options.backendPlan - 'monthly' or 'yearly'
 * @param {string} options.originalPlan - The original plan name from the request
 * @param {string} [options.uid] - Optional user UID
 * @param {boolean} [options.verifyPlan=false] - Whether to verify the plan exists in Razorpay before creating
 * @returns {Promise<object>} The response payload
 */
async function createSubscriptionHelper({ userId, backendPlan, originalPlan, uid, verifyPlan = false }) {
    const config = planConfigs[backendPlan];
    
    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        const err = new Error('Payment system not configured. Please contact support.');
        err.clientStatus = 500;
        throw err;
    }
    
    // Check if plan_id is configured
    if (!config || !config.plan_id) {
        const err = new Error(`${backendPlan} plan not configured. Please contact support.`);
        err.clientStatus = 500;
        throw err;
    }
    
    // Optional: verify plan exists in Razorpay before creating subscription
    if (verifyPlan) {
        try {
            const planDetails = await razorpay.plans.fetch(config.plan_id);
            const planAmount = planDetails.item.amount / 100;
            console.log('✅ Plan verified:', {
                plan_id: planDetails.id,
                amount_in_rupees: `₹${planAmount}`,
                currency: planDetails.item.currency,
                plan_name: planDetails.item.name
            });
            
            // Warn if plan amount doesn't match expected amount
            if (planAmount !== (config.amount / 100)) {
                console.error('❌ CRITICAL: Plan amount mismatch!', {
                    expected: `₹${config.amount / 100}`,
                    actual: `₹${planAmount}`
                });
                const err = new Error(
                    `Plan amount mismatch! Plan ${config.plan_id} is ₹${planAmount} but expected ₹${config.amount / 100}. Update in Razorpay Dashboard.`
                );
                err.clientStatus = 400;
                err.details = {
                    plan_id: config.plan_id,
                    expected_amount: `₹${config.amount / 100}`,
                    actual_amount: `₹${planAmount}`,
                    action: 'Please update the plan amount in Razorpay Dashboard → Products → Plans'
                };
                throw err;
            }
        } catch (planError) {
            if (planError.clientStatus) throw planError; // Re-throw our own errors
            console.error('❌ Plan verification failed:', planError.error?.description || planError.message);
            const err = new Error(`Plan not found: ${config.plan_id}. Verify in your Razorpay account.`);
            err.clientStatus = 400;
            err.details = process.env.NODE_ENV === 'development' ? {
                plan_id: config.plan_id,
                razorpay_error: planError.error?.description || planError.message
            } : undefined;
            throw err;
        }
    }
    
    // Create Razorpay subscription (120 months = 10 years)
    const subscriptionOptions = {
        plan_id: config.plan_id,
        customer_notify: 1,
        quantity: 1,
        total_count: 120,
        notes: {
            user_id: userId.toString(),
            uid: uid || '',
            plan: backendPlan,
            original_plan: originalPlan,
            description: config.description,
            billing_period: 'monthly',
            total_months: 120,
            valid_until: '2034-12-31'
        }
    };
    
    console.log('Creating Razorpay subscription:', {
        plan_id: subscriptionOptions.plan_id,
        total_count: subscriptionOptions.total_count,
        billing_period: 'monthly',
        duration: '10 years (120 months)'
    });
    
    const subscription = await razorpay.subscriptions.create(subscriptionOptions);
    
    return {
        success: true,
        subscriptionId: subscription.id,
        plan: backendPlan,
        originalPlan: originalPlan,
        amount: config.amount,
        currency: config.currency,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        billingInfo: {
            period: 'monthly',
            total_charges: 120,
            duration: '10 years'
        }
    };
}

/**
 * Format a subscription creation error into a client response.
 */
function formatSubscriptionError(error, config) {
    // If it's one of our own errors with a known status, use it
    if (error.clientStatus) {
        return {
            statusCode: error.clientStatus,
            body: {
                success: false,
                error: error.message,
                details: error.details
            }
        };
    }
    
    let errorMessage = 'Failed to create subscription';
    let statusCode = 500;
    
    if (error.statusCode === 401) {
        errorMessage = 'Payment system authentication failed. Please contact support.';
        statusCode = 401;
    } else if (error.statusCode === 400) {
        if (error.error?.code === 'BAD_REQUEST_ERROR' && error.error?.description?.includes('id provided does not exist')) {
            errorMessage = `Plan ID not found: ${config?.plan_id}. Please verify in Razorpay Dashboard.`;
        } else {
            errorMessage = error.error?.description || 'Invalid subscription request. Please try again.';
        }
        statusCode = 400;
    } else if (error.code === 'BAD_REQUEST_ERROR') {
        errorMessage = error.error?.description || 'Payment system configuration error. Please contact support.';
        statusCode = 400;
    }
    
    return {
        statusCode,
        body: {
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                plan_id: config?.plan_id,
                razorpay_error: error.error?.description || error.message,
                error_code: error.error?.code
            } : undefined
        }
    };
}

// Create subscription (monthly/yearly billing)
router.post('/create', authenticateJWT, async (req, res) => {
    try {
        const { plan, uid } = req.body;
        const userId = req.user.id;
        
        console.log('Received subscription request:', { plan, uid, userId });
        
        // Validate plan
        if (!plan || !['monthly', 'yearly'].includes(plan)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid plan. Must be monthly or yearly. Received: ${plan}` 
            });
        }
        
        const result = await createSubscriptionHelper({
            userId,
            backendPlan: plan,
            originalPlan: plan,
            uid
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        const { statusCode, body } = formatSubscriptionError(error, planConfigs[req.body.plan]);
        res.status(statusCode).json(body);
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
        await database.updateUserPlan(userId, 'pro', expiryDate);
        
        // Fetch updated user details to generate a new JWT token
        const updatedUser = await database.findUserById(userId);
        const newToken = generateToken(updatedUser);
        
        res.json({
            success: true,
            message: 'Subscription activated successfully!',
            plan: 'pro',
            expiry_date: expiryDate.toISOString(),
            isPremium: true,
            token: newToken
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
        
        console.log('Verifying subscription payment:', {
            subscription_id: subscription_id?.substring(0, 20) + '...',
            payment_id: payment_id?.substring(0, 20) + '...',
            signature_present: !!signature,
            user_id: userId
        });
        
        if (!subscription_id || !payment_id || !signature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing subscription verification data',
                received: {
                    has_subscription_id: !!subscription_id,
                    has_payment_id: !!payment_id,
                    has_signature: !!signature
                }
            });
        }
        
        // Verify payment signature
        // For Razorpay subscriptions, signature is: HMAC SHA256(razorpay_payment_id + "|" + razorpay_subscription_id)
        // Reference: https://razorpay.com/docs/api/subscriptions/#verify-payment
        const crypto = require('crypto');
        const body = payment_id + '|' + subscription_id; // Correct format: payment_id FIRST
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');
        
        console.log('Signature verification:', {
            body_format: 'payment_id|subscription_id',
            expected_signature: expectedSignature.substring(0, 20) + '...',
            received_signature: signature.substring(0, 20) + '...',
            match: expectedSignature === signature
        });
        
        if (expectedSignature !== signature) {
            console.error('❌ Signature mismatch with payment_id|subscription_id!', {
                body: body,
                expected: expectedSignature,
                received: signature,
                key_secret_length: process.env.RAZORPAY_KEY_SECRET?.length || 0
            });
            
            // Try alternative verification (subscription_id first) as fallback
            const altBody = subscription_id + '|' + payment_id;
            const altSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(altBody)
                .digest('hex');
            
            if (altSignature !== signature) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid payment signature',
                    details: process.env.NODE_ENV === 'development' ? {
                        hint: 'Signature verification failed with both formats. Please check Razorpay key secret.',
                        tried_formats: ['payment_id|subscription_id', 'subscription_id|payment_id']
                    } : undefined
                });
            } else {
                console.log('✅ Signature verified with alternative format (subscription_id|payment_id)');
            }
        } else {
            console.log('✅ Signature verified successfully (payment_id|subscription_id)');
        }
        
        // Get subscription details first - this is the primary verification
        let subscription;
        try {
            subscription = await razorpay.subscriptions.fetch(subscription_id);
            console.log('✅ Subscription fetched:', {
                subscription_id: subscription.id,
                status: subscription.status,
                plan_id: subscription.plan_id,
                current_start: subscription.current_start,
                current_end: subscription.current_end
            });
            
            // Check if subscription is active or authenticated
            // For Razorpay subscriptions, status can be: created, authenticated, active, pending, halted, cancelled, completed
            if (!['created', 'authenticated', 'active', 'pending'].includes(subscription.status)) {
                return res.status(400).json({
                    success: false,
                    error: `Subscription is not active. Status: ${subscription.status}`,
                    subscription_status: subscription.status,
                    hint: subscription.status === 'cancelled' ? 'Subscription was cancelled' : 
                          subscription.status === 'completed' ? 'Subscription has completed' : 
                          'Subscription is not in a valid state'
                });
            }
        } catch (subError) {
            console.error('❌ Failed to fetch subscription:', subError);
            return res.status(400).json({
                success: false,
                error: 'Failed to fetch subscription details from Razorpay',
                details: process.env.NODE_ENV === 'development' ? subError.message : undefined
            });
        }
        
        // Verify payment directly with Razorpay as additional security
        // Note: For subscriptions, the initial authorization payment may be refunded automatically
        // This is normal Razorpay behavior - we check subscription status instead
        let payment;
        try {
            payment = await razorpay.payments.fetch(payment_id);
            console.log('✅ Payment verified with Razorpay:', {
                payment_id: payment.id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                note: payment.status === 'refunded' ? 'This is normal for subscription authorization charges' : ''
            });
            
            // For subscriptions, allow refunded payments if subscription is active
            // The initial ₹5 authorization is often refunded after subscription creation
            // This is normal Razorpay behavior - the subscription itself is what matters
            if (payment.status === 'refunded') {
                if (['created', 'authenticated', 'active', 'pending'].includes(subscription.status)) {
                    console.log('ℹ️ Payment was refunded but subscription is active - this is expected for authorization charges');
                    // This is OK - continue with subscription verification
                } else {
                    console.warn('⚠️ Payment refunded and subscription not in valid state:', subscription.status);
                    // Still allow if subscription exists - refunded auth is normal
                }
            } else if (payment.status === 'failed' || payment.status === 'cancelled') {
                // Only reject if payment actually failed (not just refunded)
                if (!['created', 'authenticated', 'active', 'pending'].includes(subscription.status)) {
                    return res.status(400).json({
                        success: false,
                        error: `Payment failed. Status: ${payment.status}`,
                        payment_status: payment.status,
                        subscription_status: subscription.status
                    });
                }
            }
            // For captured/authorized payments, continue normally
        } catch (paymentError) {
            console.error('❌ Failed to verify payment with Razorpay:', paymentError);
            // If payment fetch fails but subscription is active, continue
            // Subscription status is the primary indicator of success
            if (!['created', 'authenticated', 'active', 'pending'].includes(subscription.status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to verify payment and subscription is not active',
                    subscription_status: subscription.status
                });
            }
        }
        
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
        await database.updateUserPlan(userId, userPlan, expiryDate);
        
        // Fetch updated user details to generate a new JWT token
        const updatedUser = await database.findUserById(userId);
        const newToken = generateToken(updatedUser);
        
        res.json({
            success: true,
            message: `Successfully subscribed to ${frontendPlan.charAt(0).toUpperCase() + frontendPlan.slice(1)} plan! Monthly billing for 10 years (120 months).`,
            plan: frontendPlan,
            userPlan: userPlan,
            expiry_date: expiryDate.toISOString(),
            subscription_id: subscription_id,
            type: 'subscription',
            token: newToken,
            billing_info: {
                period: 'monthly',
                total_charges: 120,
                duration: '10 years'
            }
        });
        
    } catch (error) {
        console.error('Error verifying subscription:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to verify subscription';
        let statusCode = 500;
        
        if (error.statusCode === 400 || error.statusCode === 404) {
            errorMessage = error.error?.description || error.message || 'Invalid subscription or payment ID';
            statusCode = 400;
        } else if (error.statusCode === 401) {
            errorMessage = 'Razorpay authentication failed. Please contact support.';
            statusCode = 401;
        }
        
        res.status(statusCode).json({ 
            success: false, 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                error_message: error.message,
                error_code: error.error?.code,
                status_code: error.statusCode
            } : undefined
        });
    }
});

// Get current user's plan
router.get('/current-plan', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await database.findUserById(userId);
        
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

// Create subscription endpoint (alias for compatibility — maps frontend plan names)
router.post('/create-subscription', authenticateJWT, async (req, res) => {
    try {
        const { plan, uid } = req.body;
        const userId = req.user.id;
        
        console.log('Received subscription request (create-subscription):', { plan, uid, userId });
        
        // Map frontend plan names to backend plan names
        const backendPlan = frontendToBackendPlan[plan] || plan;
        
        // Validate plan
        if (!backendPlan || !['monthly', 'yearly'].includes(backendPlan)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid plan. Must be basic/monthly or pro/yearly. Received: ${plan}` 
            });
        }
        
        const result = await createSubscriptionHelper({
            userId,
            backendPlan,
            originalPlan: plan,
            uid,
            verifyPlan: true // This endpoint verifies the plan exists in Razorpay first
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        const backendPlan = frontendToBackendPlan[req.body.plan] || req.body.plan;
        const { statusCode, body } = formatSubscriptionError(error, planConfigs[backendPlan]);
        res.status(statusCode).json(body);
    }
});

// Cancel subscription endpoint
router.post('/cancel-subscription', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('Cancel subscription request from user:', userId);
        
        // Get user details
        const user = await database.findUserById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        const currentPlan = (user.plan || 'free').toLowerCase();
        
        // Check if user has a paid plan
        if (currentPlan === 'free') {
            return res.status(400).json({
                success: false,
                error: 'You are already on the free plan'
            });
        }
        
        console.log('Canceling subscription for user:', {
            userId,
            currentPlan,
            email: user.email,
            currentExpiry: user.plan_expiry
        });
        
        // Downgrade user to free plan via the database adapter
        // This works with both SQLite and PostgreSQL adapters
        await database.updateUserPlan(userId, 'free');
        
        console.log('✅ Subscription canceled for user:', userId, 'Plan set to free');
        
        // Generate a new token reflecting the plan change
        const updatedUser = await database.findUserById(userId);
        const newToken = generateToken(updatedUser);
        
        res.json({
            success: true,
            message: `Subscription canceled. Your plan has been changed from ${currentPlan} to free.`,
            previousPlan: currentPlan,
            currentPlan: 'free',
            token: newToken,
            status: 'canceled'
        });
        
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel subscription. Please try again or contact support.'
        });
    }
});

module.exports = router;
