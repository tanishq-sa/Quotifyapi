const express = require('express');
const { authenticateJWT, authenticateFlexible } = require('../auth');
const database = require('../database');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateFlexible, async (req, res) => {
  try {
    const user = await database.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Remove sensitive data
    const { api_key, ...userProfile } = user;
    
    res.json({
      profile: userProfile,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name is required'
      });
    }

    // Update user profile in database
    const query = 'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const success = await new Promise((resolve, reject) => {
      database.db.run(query, [name.trim(), req.user.id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });

    if (!success) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      updated_fields: ['name']
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user profile'
    });
  }
});

// Get API usage statistics
router.get('/usage', authenticateFlexible, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const usageStats = await database.getUserUsageStats(req.user.id, parseInt(days));
    
    // Get today's usage count
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = await database.getDailyUsageCount(req.user.id, today);
    
    // Get user's current plan limits
    const user = await database.findUserByEmail(req.user.email);
    const planLimits = {
      free: { daily: 50, perMinute: 3 },
      basic: { daily: 500, perMinute: 20 },
      pro: { daily: -1, perMinute: -1 }
    };
    
    const currentLimits = planLimits[user.plan] || planLimits.free;
    
    res.json({
      usage_stats: usageStats,
      today_usage: todayUsage,
      plan: user.plan,
      limits: currentLimits,
      period_days: parseInt(days),
      message: 'Usage statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve usage statistics'
    });
  }
});

// Get current plan information
router.get('/plan', authenticateJWT, async (req, res) => {
  try {
    const user = await database.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    const planInfo = {
      free: {
        name: 'Free',
        daily_requests: 50,
        per_minute_requests: 3,
        features: ['Random quotes only', '50 requests per day', '3 requests per minute', 'Basic support'],
        price: 0
      },
      basic: {
        name: 'Basic',
        daily_requests: 500,
        per_minute_requests: 20,
        features: ['All quote categories', '500 requests per day', '20 requests per minute', 'Usage analytics'],
        price: 0.99
      },
      pro: {
        name: 'Pro',
        daily_requests: -1,
        per_minute_requests: -1,
        features: ['All quote categories', 'Unlimited requests', 'Advanced analytics', 'Priority support'],
        price: 4.99
      }
    };

    const currentPlan = planInfo[user.plan] || planInfo.free;
    
    res.json({
      current_plan: {
        id: user.plan,
        ...currentPlan
      },
      available_plans: planInfo,
      message: 'Plan information retrieved successfully'
    });
  } catch (error) {
    console.error('Get plan info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve plan information'
    });
  }
});

// Upgrade plan (placeholder for Stripe integration)
router.post('/upgrade', authenticateJWT, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!plan || !['basic', 'pro'].includes(plan)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Valid plan (basic or pro) is required'
      });
    }

    // TODO: Integrate with Stripe for payment processing
    // For now, we'll just return a message about the upgrade process
    
    res.json({
      message: 'Plan upgrade initiated',
      plan: plan,
      note: 'Payment processing integration coming soon. For now, contact support to upgrade your plan.',
      stripe_integration: 'pending'
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process plan upgrade'
    });
  }
});

// Get user's favorite quotes
router.get('/favorites', authenticateJWT, async (req, res) => {
  try {
    const favorites = await database.getUserFavorites(req.user.id);
    
    res.json({
      favorites: favorites,
      total: favorites.length,
      message: 'Favorite quotes retrieved successfully'
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve favorite quotes'
    });
  }
});

// Add quote to favorites
router.post('/favorites', authenticateJWT, async (req, res) => {
  try {
    const { quote_text, quote_author, quote_category } = req.body;
    
    if (!quote_text || quote_text.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Quote text is required'
      });
    }

    const favoriteId = await database.addFavorite(req.user.id, {
      quote_text: quote_text.trim(),
      quote_author: quote_author || 'Unknown',
      quote_category: quote_category || 'general'
    });
    
    res.json({
      favorite_id: favoriteId,
      message: 'Quote added to favorites successfully'
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add quote to favorites'
    });
  }
});

module.exports = router;
