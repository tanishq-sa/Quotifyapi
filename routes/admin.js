const express = require('express');
const { authenticateFlexible, authenticateAdmin } = require('../auth');
const database = require('../database-adapter');

const router = express.Router();

// SECURITY: Rate limiting for admin endpoints
const adminRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many admin requests',
    message: 'Admin rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
function validateUserId(req, res, next) {
  const userId = req.params.userId;
  
  // SECURITY: Validate user ID format
  if (!userId || !/^\d+$/.test(userId)) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a positive integer'
    });
  }
  
  // SECURITY: Prevent extremely large numbers
  if (parseInt(userId) > 999999999) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID is too large'
    });
  }
  
  next();
}

function validatePlan(req, res, next) {
  const { plan } = req.body;
  
  // SECURITY: Validate plan input
  if (!plan || typeof plan !== 'string') {
    return res.status(400).json({
      error: 'Invalid plan',
      message: 'Plan is required and must be a string'
    });
  }
  
  // SECURITY: Only allow specific plan values
  const allowedPlans = ['free', 'basic', 'pro'];
  if (!allowedPlans.includes(plan.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid plan',
      message: 'Plan must be one of: free, basic, pro'
    });
  }
  
  // Normalize plan to lowercase
  req.body.plan = plan.toLowerCase();
  next();
}

// All admin routes require authentication, admin privileges, and rate limiting
router.use(adminRateLimit);
router.use(authenticateFlexible);
router.use(authenticateAdmin);

// Ensure admin has API key middleware
router.use(async (req, res, next) => {
  try {
    const hasKeys = await database.hasApiKeys(req.user.id);
    if (!hasKeys) {
      console.log(`🔄 Admin ${req.user.email} has no API keys, creating one...`);
      await database.createFirstAdminApiKey(req.user.id);
      console.log(`✅ Created API key for admin ${req.user.email}`);
    }
    next();
  } catch (error) {
    console.error('Error ensuring admin has API key:', error);
    next(); // Continue even if API key creation fails
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await database.getSystemStats();
    res.json({
      stats,
      message: 'System statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve system statistics'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await database.getAllUsers();
    res.json({
      users,
      total: users.length,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    });
  }
});

// Update user plan - SECURE VERSION
router.put('/users/:userId/plan', validateUserId, validatePlan, async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;
    
    // SECURITY: Prevent admin from changing their own plan
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Cannot change your own plan'
      });
    }
    
    const updated = await database.updateUserPlan(userId, plan);
    
    if (updated) {
      console.log(`✅ Admin ${req.user.email} updated user ${userId} plan to ${plan}`);
      res.json({
        message: 'User plan updated successfully',
        user_id: userId,
        new_plan: plan
      });
    } else {
      res.status(404).json({
        error: 'User not found',
        message: 'No user found with the specified ID'
      });
    }
  } catch (error) {
    console.error('Update user plan error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user plan'
    });
  }
});

// Make user admin - DISABLED FOR SECURITY
router.put('/users/:userId/admin', validateUserId, async (req, res) => {
  // SECURITY: Disable admin promotion to prevent unauthorized access
  console.log(`🚨 SECURITY ALERT: Admin promotion attempt blocked from ${req.user.email} (IP: ${req.ip})`);
  
  return res.status(403).json({
    error: 'Access denied',
    message: 'Admin promotion is disabled for security reasons. Only the system administrator can grant admin access.'
  });
});

// Get user details - SECURE VERSION
router.get('/users/:userId', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await database.findUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the specified ID'
      });
    }
    
    // Get user's API keys
    const apiKeys = await database.getUserApiKeys(userId);
    
    // Get user's usage stats
    const usageStats = await database.getUserUsageStats(userId, 30);
    const todayUsage = await database.getDailyUsageCount(userId);
    
    console.log(`✅ Admin ${req.user.email} accessed user details for ${user.email}`);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        provider: user.provider || 'N/A',
        created_at: user.created_at,
        updated_at: user.updated_at,
        api_key_count: apiKeys ? apiKeys.length : 0,
        today_requests: todayUsage || 0
      },
      api_keys: apiKeys || [],
      usage_stats: usageStats || [],
      today_usage: todayUsage || 0,
      message: 'User details retrieved successfully'
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user details'
    });
  }
});

// Regenerate API key for a user (Admin only)
router.post('/users/:userId/api-keys/:keyId/regenerate', validateUserId, async (req, res) => {
  try {
    const { userId, keyId } = req.params;
    
    // SECURITY: Validate keyId
    if (!keyId || !/^\d+$/.test(keyId)) {
      return res.status(400).json({
        error: 'Invalid key ID',
        message: 'Key ID must be a positive integer'
      });
    }
    
    const keyIdInt = parseInt(keyId);
    if (keyIdInt > 999999999) {
      return res.status(400).json({
        error: 'Invalid key ID',
        message: 'Key ID is too large'
      });
    }
    
    // Check if user exists
    const user = await database.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the specified ID'
      });
    }
    
    // Get the existing API key
    const existingKeys = await database.getUserApiKeys(userId);
    const existingKey = existingKeys.find(k => k.id === keyIdInt);
    
    if (!existingKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'No API key found with the specified ID for this user'
      });
    }
    
    console.log(`🔄 Admin ${req.user.email} regenerating API key ${keyIdInt} for user ${user.email}`);
    
    // Regenerate the API key
    const newApiKey = await database.regenerateApiKey(userId, keyIdInt);
    
    console.log(`✅ Admin ${req.user.email} regenerated API key for user ${user.email}`);
    
    res.json({
      success: true,
      message: 'API key regenerated successfully',
      api_key: {
        id: newApiKey.id,
        key_value: newApiKey.key_value,
        name: newApiKey.name,
        created_at: newApiKey.created_at
      }
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to regenerate API key'
    });
  }
});

// Get usage analytics - SECURE VERSION
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // SECURITY: Validate days parameter
    const daysInt = parseInt(days);
    if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be a number between 1 and 365'
      });
    }
    
    // Get daily usage for the last N days
    const dailyUsage = await database.getDailyUsageStats(daysInt);
    
    // Get plan distribution
    const planStats = await database.getSystemStats();
    
    console.log(`✅ Admin ${req.user.email} accessed analytics for ${daysInt} days`);
    
    res.json({
      daily_usage: dailyUsage,
      plan_distribution: {
        free: planStats.free_users,
        basic: planStats.basic_users,
        pro: planStats.pro_users,
        total: planStats.total_users
      },
      period_days: daysInt,
      message: 'Analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve analytics'
    });
  }
});

// Generate new admin API key
router.post('/keys/generate', async (req, res) => {
  try {
    const { name = 'Admin Key' } = req.body;
    
    // Check if admin already has an API key
    const hasKeys = await database.hasApiKeys(req.user.id);
    if (hasKeys) {
      return res.status(400).json({
        error: 'API key exists',
        message: 'Admin users can only have one API key. Please regenerate the existing key instead.'
      });
    }
    
    // Create new API key for admin
    const newApiKey = await database.createApiKey(req.user.id, name);
    
    console.log(`✅ Admin ${req.user.email} generated new API key`);
    
    res.json({
      api_key: {
        id: newApiKey.id,
        key_value: newApiKey.key_value,
        name: newApiKey.name,
        created_at: newApiKey.created_at
      },
      message: 'Admin API key generated successfully',
      warning: 'Please save this API key securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Generate admin API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate admin API key'
    });
  }
});

// Regenerate admin API key
router.put('/keys/regenerate', async (req, res) => {
  try {
    const { name = 'Admin Key' } = req.body;
    
    console.log(`🔄 Admin ${req.user.email} (ID: ${req.user.id}) attempting to regenerate API key`);
    
    // First revoke the old key
    await database.deactivateUserApiKeys(req.user.id);
    
    // Generate new key
    const newApiKey = await database.createApiKey(req.user.id, name);
    
    console.log(`✅ Admin ${req.user.email} regenerated API key`);
    
    res.json({
      api_key: {
        id: newApiKey.id,
        key_value: newApiKey.key_value,
        name: newApiKey.name,
        created_at: newApiKey.created_at
      },
      message: 'Admin API key regenerated successfully',
      warning: 'The old API key has been deactivated. Please update your applications with the new key.'
    });
  } catch (error) {
    console.error('Regenerate admin API key error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      userEmail: req.user.email
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to regenerate admin API key',
      details: error.message
    });
  }
});

// Get admin API keys
router.get('/keys', async (req, res) => {
  try {
    const apiKeys = await database.getUserApiKeys(req.user.id);
    
    res.json({
      api_keys: apiKeys,
      message: 'Admin API keys retrieved successfully'
    });
  } catch (error) {
    console.error('Get admin API keys error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve admin API keys'
    });
  }
});

// Debug endpoint to check admin status
router.get('/debug', async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const isAdmin = await database.isAdmin(userId);
    const hasKeys = await database.hasApiKeys(userId);
    
    res.json({
      user_id: userId,
      user_email: userEmail,
      is_admin: isAdmin,
      has_keys: hasKeys,
      message: 'Debug info retrieved successfully'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve debug info',
      details: error.message
    });
  }
});

// Create user with API key
router.post('/users/create-with-key', async (req, res) => {
  try {
    const { username, email, name, plan } = req.body;
    
    // Validate required fields
    if (!username) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Username is required'
      });
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format'
      });
    }
    
    // Validate plan
    const validPlans = ['free', 'basic', 'pro'];
    if (plan && !validPlans.includes(plan.toLowerCase())) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid plan. Must be one of: free, basic, pro'
      });
    }
    
    // Generate email if not provided
    const finalEmail = email || `${username}@quotify.com`;
    const finalPlan = plan || 'free';
    const finalName = name || 'Admin Created Key';
    
    console.log(`🔄 Admin ${req.user.email} creating user with API key:`, {
      username,
      email: finalEmail,
      plan: finalPlan,
      keyName: finalName
    });
    
    // Check if user already exists
    const existingUser = await database.findUserByEmail(finalEmail);
    if (existingUser) {
      return res.status(400).json({
        error: 'User exists',
        message: 'A user with this email already exists'
      });
    }
    
    // Create user
    const userData = {
      email: finalEmail,
      name: username,
      provider: 'local',
      provider_id: `admin_${Date.now()}`,
      plan: finalPlan
    };
    
    const newUser = await database.createUser(userData);
    
    // Create API key for the new user
    const apiKey = await database.createApiKey(newUser.id, finalName);
    
    console.log(`✅ Admin ${req.user.email} created user ${username} with API key`);
    
    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        created_at: newUser.created_at
      },
      api_key: {
        id: apiKey.id,
        key_value: apiKey.key_value,
        name: apiKey.name,
        created_at: apiKey.created_at
      },
      message: 'User and API key created successfully'
    });
  } catch (error) {
    console.error('Create user with API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user and API key',
      details: error.message
    });
  }
});

// Delete user and all associated data
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔄 Admin ${req.user.email} attempting to delete user ID: ${userId}`);
    
    // Get user details first
    const user = await database.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }
    
    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete admin users'
      });
    }
    
    // Delete user and all associated data
    await database.deleteUser(userId);
    
    console.log(`✅ Admin ${req.user.email} deleted user: ${user.name} (${user.email})`);
    
    res.json({
      message: 'User and all associated data deleted successfully',
      deleted_user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete user',
      details: error.message
    });
  }
});



module.exports = router;
