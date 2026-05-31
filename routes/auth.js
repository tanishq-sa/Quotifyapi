const express = require('express');
const passport = require('passport');
const { generateToken, authenticateJWT, authenticateFlexible } = require('../auth');
const database = require('../database-adapter');
const { ADMIN_EMAIL } = require('../config/admin');

const router = express.Router();

// Google OAuth Routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Ensure ALL users have an API key (not just admins)
      try {
        const hasKeys = await database.hasApiKeys(req.user.id);
        if (!hasKeys) {
          const isAdmin = req.user.email === ADMIN_EMAIL;
          const keyName = isAdmin ? 'Admin Default Key' : 'Personal Key';
          const apiKey = await database.createApiKey(req.user.id, keyName);
          console.log(`✅ Created first API key for user ${req.user.email}`);
        } else {
          console.log(`ℹ️  User ${req.user.email} already has API keys`);
        }
      } catch (error) {
        console.error('Error creating API key:', error);
        // Don't fail the login if API key creation fails
      }
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);


// Get current user info (requires JWT)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await database.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Remove sensitive data
    const { api_key, ...userInfo } = user;
    
    res.json({
      user: userInfo,
      message: 'User information retrieved successfully'
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user information'
    });
  }
});

// Refresh JWT token
router.post('/refresh', authenticateJWT, async (req, res) => {
  try {
    const user = await database.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    const newToken = generateToken(user);
    
    res.json({
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateJWT, (req, res) => {
  res.json({
    message: 'Logged out successfully',
    note: 'Please remove the token from your client-side storage'
  });
});

// Get user's API keys
router.get('/keys', authenticateFlexible, async (req, res) => {
  try {
    const apiKeys = await database.getUserApiKeys(req.user.id);
    
    // Remove sensitive key values for security
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      is_active: key.is_active,
      created_at: key.created_at,
      last_used: key.last_used
    }));
    
    res.json({
      api_keys: safeApiKeys,
      message: 'API keys retrieved successfully'
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve API keys'
    });
  }
});

// Generate new API key
router.post('/keys/generate', authenticateFlexible, async (req, res) => {
  try {
    const { name = 'Default Key' } = req.body;
    
    // Check if user is admin
    const isAdmin = await database.isAdmin(req.user.id);
    
    if (isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin users must generate API keys through the admin dashboard'
      });
    }
    
    // SECURITY: For regular users, create new API key first, then deactivate old ones
    const newApiKey = await database.createApiKey(req.user.id, name);
    
    // Deactivate all existing API keys except the one we just created
    await database.deactivateUserApiKeys(req.user.id, newApiKey.id);
    
    res.json({
      api_key: {
        id: newApiKey.id,
        key_value: newApiKey.key_value,
        name: newApiKey.name,
        created_at: newApiKey.created_at
      },
      message: 'API key generated successfully',
      warning: 'Please save this API key securely. It will not be shown again. All previous API keys have been deactivated.'
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate API key'
    });
  }
});

// Regenerate API key
router.put('/keys/:keyId/regenerate', authenticateJWT, async (req, res) => {
  try {
    const { keyId } = req.params;
    const { name } = req.body;
    
    // Check if user is admin
    const isAdmin = await database.isAdmin(req.user.id);
    
    if (isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin users must manage API keys through the admin dashboard'
      });
    }
    
    // First revoke the old key
    await database.revokeApiKey(keyId, req.user.id);
    
    // Generate new key
    const newApiKey = await database.createApiKey(req.user.id, name || 'Regenerated Key');
    
    res.json({
      api_key: {
        id: newApiKey.id,
        key_value: newApiKey.key_value,
        name: newApiKey.name,
        created_at: newApiKey.created_at
      },
      message: 'API key regenerated successfully',
      warning: 'The old API key has been revoked. Please update your applications with the new key.'
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to regenerate API key'
    });
  }
});

// Revoke API key
router.delete('/keys/:keyId', authenticateJWT, async (req, res) => {
  try {
    const { keyId } = req.params;
    
    // Check if user is admin
    const isAdmin = await database.isAdmin(req.user.id);
    
    if (isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin users must manage API keys through the admin dashboard'
      });
    }
    
    const success = await database.revokeApiKey(keyId, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'The specified API key was not found or does not belong to you'
      });
    }
    
    res.json({
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to revoke API key'
    });
  }
});

// Get API key usage stats
router.get('/keys/:keyId/usage', authenticateJWT, async (req, res) => {
  try {
    const { keyId } = req.params;
    const { days = 30 } = req.query;
    
    const usageStats = await database.getUserUsageStats(req.user.id, parseInt(days));
    
    res.json({
      usage_stats: usageStats,
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

module.exports = router;
