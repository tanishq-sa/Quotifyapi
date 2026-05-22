const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const database = require('./database-adapter');
const { getLimitsByPlan } = require('./config/plan-limits');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// SECURITY: Validate JWT secret
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('🚨 CRITICAL SECURITY ERROR: JWT_SECRET must be set and at least 32 characters long');
  process.exit(1);
}

// Generate JWT token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    provider: user.provider
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// JWT Authentication Middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }

  req.user = decoded;
  next();
}

// Flexible Authentication Middleware (JWT or API Key)
async function authenticateFlexible(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Try JWT token first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }
  
  // Try API key
  if (apiKey) {
    try {
      const keyData = await database.validateApiKey(apiKey);
      if (keyData) {
        // SECURITY: Prevent admins from using API keys
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tanishqsaini872@gmail.com';
        if (keyData.email === ADMIN_EMAIL) {
          console.log(`🚨 SECURITY ALERT: Admin attempted API key authentication: ${keyData.email} (IP: ${req.ip})`);
          return res.status(403).json({
            error: 'API key authentication not allowed',
            message: 'Administrator accounts must use JWT authentication. Please login through the web interface.'
          });
        }
        
        req.user = {
          id: keyData.user_id,
          email: keyData.email,
          name: keyData.name,
          plan: keyData.plan,
          provider: keyData.provider
        };
        return next();
      } else {
        // API key doesn't exist - return authentication error
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid. Please check your key or contact support.'
        });
      }
    } catch (error) {
      console.error('API key validation error:', error);
    }
  }
  
  return res.status(401).json({
    error: 'Access denied',
    message: 'No valid token or API key provided'
  });
}

// API Key Authentication Middleware
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header or api_key query parameter'
    });
  }

  try {
    const keyData = await database.validateApiKey(apiKey);
    
    if (!keyData) {
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked'
      });
    }

    // SECURITY: Prevent admins from using API keys
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tanishqsaini872@gmail.com';
    if (keyData.email === ADMIN_EMAIL) {
      console.log(`🚨 SECURITY ALERT: Admin attempted API key authentication: ${keyData.email} (IP: ${req.ip})`);
      return res.status(403).json({
        error: 'API key authentication not allowed',
        message: 'Administrator accounts must use JWT authentication. Please login through the web interface.'
      });
    }

    // Update last used timestamp
    await database.logApiUsage({
      user_id: keyData.user_id,
      api_key_id: keyData.id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: 0
    });

    req.user = {
      id: keyData.user_id,
      email: keyData.email,
      name: keyData.name,
      plan: keyData.plan,
      provider: keyData.provider,
      api_key_id: keyData.id
    };

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred while validating your API key'
    });
  }
}

// Rate limiting based on user plan
function getRateLimitByPlan(plan) {
  return getLimitsByPlan(plan);
}

// Check if user has exceeded rate limits
async function checkRateLimit(userId, plan) {
  const limits = getRateLimitByPlan(plan);
  
  // Pro users have unlimited access
  if (plan === 'pro') {
    return { allowed: true, remaining: -1 };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyCount = await database.getDailyUsageCount(userId, today);
    
    if (limits.daily > 0 && dailyCount >= limits.daily) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        limit: limits.daily
      };
    }

    return {
      allowed: true,
      remaining: limits.daily - dailyCount,
      limit: limits.daily
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: -1 }; // Allow on error
  }
}

// Rate limiting middleware
async function rateLimitByPlan(req, res, next) {
  if (!req.user) {
    return next();
  }

  const rateLimitResult = await checkRateLimit(req.user.id, req.user.plan);
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You have exceeded your daily limit of ${rateLimitResult.limit} requests`,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
      plan: req.user.plan
    });
  }

  // Add rate limit info to response headers
  res.set({
    'X-RateLimit-Limit': rateLimitResult.limit,
    'X-RateLimit-Remaining': rateLimitResult.remaining,
    'X-RateLimit-Plan': req.user.plan
  });

  next();
}

// Configure Passport strategies
function configurePassport() {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await database.findUserByProvider('google', profile.id);
      
      if (user) {
        return done(null, user);
      }

      // Create new user
      user = await database.createUser({
        email: profile.emails[0].value,
        name: profile.displayName,
        provider: 'google',
        provider_id: profile.id
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));


  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await database.findUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// Admin authentication middleware - SECURE VERSION
async function authenticateAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // SECURITY: Only allow specific admin email from environment
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tanishqsaini872@gmail.com';
    
    // Check if user email matches the admin email
    if (req.user.email !== ADMIN_EMAIL) {
      console.log(`🚨 SECURITY ALERT: Unauthorized admin access attempt from ${req.user.email} (IP: ${req.ip})`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'This endpoint requires administrator privileges'
      });
    }

    // Double-check in database for additional security
    const isAdmin = await database.isAdmin(req.user.id);
    if (!isAdmin) {
      console.log(`🚨 SECURITY ALERT: Database admin check failed for ${req.user.email} (IP: ${req.ip})`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'This endpoint requires administrator privileges'
      });
    }

    // Log admin access for security monitoring
    console.log(`✅ Admin access granted to ${req.user.email} (IP: ${req.ip})`);
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred while verifying admin privileges'
    });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateJWT,
  authenticateApiKey,
  authenticateFlexible,
  authenticateAdmin,
  rateLimitByPlan,
  checkRateLimit,
  configurePassport
};
