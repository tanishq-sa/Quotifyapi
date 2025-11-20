const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const { inject } = require('@vercel/analytics');
const { getRandomQuoteByType, getRandomQuote, getAvailableTypes, getQuotesCount } = require('./quotes');
const database = require('./database-adapter');
const { configurePassport, authenticateFlexible } = require('./auth');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const quoteRoutes = require('./routes/quotes');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP detection (important for rate limiting)
app.set('trust proxy', 1);

// Initialize database
async function initializeApp() {
  try {
    await database.init();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Configure Passport
configurePassport();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration for OAuth
const SESSION_SECRET = process.env.SESSION_SECRET;

// SECURITY: Validate session secret
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('🚨 CRITICAL SECURITY ERROR: SESSION_SECRET must be set and at least 32 characters long');
  process.exit(1);
}

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // SECURITY: Prevent XSS attacks
    sameSite: 'strict', // SECURITY: Prevent CSRF attacks
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// General rate limiting - allows 2000 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// API-specific rate limiting - more restrictive for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 API requests per windowMs
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please slow down and try again later.',
    retryAfter: '15 minutes',
    tip: 'Consider caching responses on your end to reduce API calls'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create rate limiters at app initialization
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: {
    error: 'Rate limit exceeded',
    message: 'You are making too many requests. Please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 100, // allow 100 requests per 5 minutes at full speed
  delayMs: () => 100, // add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // maximum delay of 5 seconds
});

// Plan-aware rate limiting for suspected abuse
const planAwareStrictLimiter = (req, res, next) => {
  // Skip rate limiting for Pro users
  if (req.user && req.user.plan === 'pro') {
    return next();
  }
  
  // Apply strict rate limiting for non-Pro users
  return strictLimiter(req, res, next);
};

// Plan-aware speed limiting
const planAwareSpeedLimiter = (req, res, next) => {
  // Skip speed limiting for Pro users
  if (req.user && req.user.plan === 'pro') {
    return next();
  }
  
  // Apply speed limiting for non-Pro users
  return speedLimiter(req, res, next);
};

// Plan-based rate limiting middleware
async function planBasedRateLimit(req, res, next) {
  try {
    console.log('🔍 planBasedRateLimit called for:', req.path, 'User:', req.user?.email, 'Plan:', req.user?.plan);
    
    if (!req.user) {
      console.log('⚠️ No user found, skipping rate limit');
      return next(); // Skip if no user (shouldn't happen with authenticateFlexible)
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyUsage = await database.getDailyUsageCount(req.user.id, today);
    
    const planLimits = {
      free: { daily: 50, perMinute: 3 },
      basic: { daily: 500, perMinute: 20 },
      pro: { daily: -1, perMinute: -1 } // -1 means unlimited
    };
    
    const limits = planLimits[req.user.plan] || planLimits.free;
    
    // Check daily limit
    if (limits.daily !== -1 && dailyUsage >= limits.daily) {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        message: `You have reached your daily limit of ${limits.daily} requests for the ${req.user.plan} plan.`,
        plan: req.user.plan,
        daily_limit: limits.daily,
        daily_usage: dailyUsage,
        reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        upgrade_prompt: req.user.plan === 'free' ? 'Upgrade to Basic or Pro plan for higher limits.' : null
      });
    }
    
    // Check per-minute limit (using database for persistence and memory safety)
    if (limits.perMinute !== -1) {
      const minuteKey = `${req.user.id}_${Math.floor(Date.now() / 60000)}`;
      
      // SECURITY: Use database instead of global memory to prevent memory leaks
      try {
        // Check current minute usage from database
        const currentMinuteUsage = await database.getMinuteUsageCount(req.user.id, Math.floor(Date.now() / 60000));
        
        if (currentMinuteUsage >= limits.perMinute) {
          return res.status(429).json({
            error: 'Per-minute limit exceeded',
            message: `You can only make ${limits.perMinute} request(s) per minute with the ${req.user.plan} plan.`,
            plan: req.user.plan,
            per_minute_limit: limits.perMinute,
            retry_after: 60
          });
        }
        
        // Log the request for minute tracking
        await database.logMinuteUsage(req.user.id, Math.floor(Date.now() / 60000));
      } catch (error) {
        console.error('Minute rate limit check error:', error);
        // Allow request on error to avoid blocking legitimate users
      }
    }
    
    next();
  } catch (error) {
    console.error('Plan-based rate limit error:', error);
    next(); // Continue on error to avoid blocking requests
  }
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Apply rate limiting middleware
app.use(generalLimiter); // Apply to all requests
app.use('/api', apiLimiter); // Apply to API routes
app.use('/api', planAwareSpeedLimiter); // Apply plan-aware speed limiting to API routes
app.use('/api', planAwareStrictLimiter); // Apply plan-aware strict rate limiting to API routes

// Add request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/quotes', authenticateFlexible, planBasedRateLimit, quoteRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/contact', contactRoutes);

// Subscription API routes (for frontend compatibility)
app.use('/api/subscription', paymentRoutes);

// Specific page routes (before static file serving)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/auth-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-success.html'));
});

app.get('/auth/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-success.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/setup-api-key', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'setup-api-key.html'));
});

// Legal pages
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/refund', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'refund.html'));
});

app.get('/cancellation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cancellation.html'));
});

app.get('/shipping', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shipping.html'));
});

// Welcome route
app.get('/', (req, res) => {
  // Check if this is an API request
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      analytics: inject(),
      message: 'Welcome to the Quote API!',
      version: '2.0.0',
      authentication: {
        message: 'This API now requires authentication',
        endpoints: {
          'GET /auth/google': 'Google OAuth login',
          'GET /auth/me': 'Get current user info (requires JWT)',
          'GET /auth/keys': 'Get user API keys (requires JWT)',
          'POST /auth/keys/generate': 'Generate new API key (requires JWT)'
        }
      },
      api_endpoints: {
        'GET /api/v1/quotes': 'Get a random quote (requires API key)',
        'GET /api/v1/quotes/category/:category': 'Get quotes by category (requires API key)',
        'GET /api/v1/quotes/search': 'Search quotes (requires API key)',
        'GET /api/v1/user/profile': 'Get user profile (requires JWT)',
        'GET /api/v1/user/usage': 'Get API usage stats (requires JWT)'
      },
      plans: {
        free: '5 requests per day',
        basic: '500 requests per day, 5 per minute',
        pro: 'Unlimited requests'
      },
      availableTypes: getAvailableTypes(),
      totalQuotes: getQuotesCount().total,
      rateLimits: {
        general: '1000 requests per 15 minutes',
        api: 'Tier-based rate limiting',
        note: 'Rate limit headers are included in responses'
      },
      security: {
        message: 'This API is protected with authentication and rate limiting',
        features: ['OAuth authentication', 'API key validation', 'Tier-based rate limiting', 'Usage tracking']
      }
    });
  }
  
  // Serve the main HTML file for browser requests
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Main quote API endpoint - NOW REQUIRES API KEY AND PLAN-BASED RATE LIMITING
app.get('/api', authenticateFlexible, planBasedRateLimit, async (req, res) => {
  const startTime = Date.now();
  try {
    const { type } = req.query;
    
    if (type) {
      // Get quote by specific type
      const quote = getRandomQuoteByType(type);
      
      if (!quote) {
        // Log failed request
        await database.logApiUsage({
          user_id: req.user.id,
          api_key_id: req.user.api_key_id,
          endpoint: req.path,
          method: req.method,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          response_status: 404,
          response_time: Date.now() - startTime
        });
        
        return res.status(404).json({
          error: 'Quote type not found',
          message: `No quotes found for type: ${type}`,
          availableTypes: getAvailableTypes()
        });
      }
      
      // Log successful request
      await database.logApiUsage({
        user_id: req.user.id,
        api_key_id: req.user.api_key_id,
        endpoint: req.path,
        method: req.method,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        response_status: 200,
        response_time: Date.now() - startTime
      });
      
      res.json({
        quote: quote,
        type: type.toLowerCase(),
        timestamp: new Date().toISOString()
      });
    } else {
      // Get random quote from any category
      const quote = getRandomQuote();
      
      // Log successful request
      await database.logApiUsage({
        user_id: req.user.id,
        api_key_id: req.user.api_key_id,
        endpoint: req.path,
        method: req.method,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        response_status: 200,
        response_time: Date.now() - startTime
      });
      
      res.json({
        quote: quote,
        type: 'random',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Log error
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 500,
      response_time: Date.now() - startTime
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching the quote'
    });
  }
});

// Get available quote types - NOW REQUIRES API KEY AND PLAN-BASED RATE LIMITING
app.get('/api/types', authenticateFlexible, planBasedRateLimit, async (req, res) => {
  const startTime = Date.now();
  try {
    // Log successful request
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - startTime
    });
    
    res.json({
      availableTypes: getAvailableTypes(),
      total: getAvailableTypes().length
    });
  } catch (error) {
    // Log error
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 500,
      response_time: Date.now() - startTime
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching quote types'
    });
  }
});

// Get quote counts by category - NOW REQUIRES API KEY AND PLAN-BASED RATE LIMITING
app.get('/api/stats', authenticateFlexible, planBasedRateLimit, async (req, res) => {
  const startTime = Date.now();
  try {
    // Log successful request
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - startTime
    });
    
    res.json({
      message: 'Quote statistics by category',
      counts: getQuotesCount()
    });
  } catch (error) {
    // Log error
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 500,
      response_time: Date.now() - startTime
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching statistics'
    });
  }
});

// Debug route to check static file serving
app.get('/debug/static', (req, res) => {
  res.json({
    message: 'Static file serving debug',
    publicPath: path.join(__dirname, 'public'),
    files: ['index.html', 'script.js'],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  // SECURITY: Don't log full error objects in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', error.message);
  } else {
    console.error('Error:', error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Serve static files from public directory (after all specific routes)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main application for non-API routes (SPA support) - MUST BE LAST
app.get('*', (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Route not found',
      message: 'The requested API endpoint does not exist'
    });
  }
  
  // Serve the main HTML file for all other routes
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server (for local development)
if (process.env.NODE_ENV !== 'production') {
  initializeApp().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Quote API server is running on port ${PORT}`);
      console.log(`📖 Visit http://localhost:${PORT} to see available endpoints`);
      console.log(`\n🔐 Authentication Endpoints:`);
      console.log(`- Google OAuth: http://localhost:${PORT}/auth/google`);
      console.log(`\n📊 API Endpoints (require API key):`);
      console.log(`- Random quote: http://localhost:${PORT}/api/v1/quotes`);
      console.log(`- Category quote: http://localhost:${PORT}/api/v1/quotes/category/happy`);
      console.log(`- Search quotes: http://localhost:${PORT}/api/v1/quotes/search?q=motivation`);
      console.log(`\n👤 User Endpoints (require JWT):`);
      console.log(`- User profile: http://localhost:${PORT}/api/v1/user/profile`);
      console.log(`- Usage stats: http://localhost:${PORT}/api/v1/user/usage`);
      console.log(`\n💡 Note: This API now requires authentication!`);
    });
  });
}

// Export the app for serverless deployment
module.exports = app; 