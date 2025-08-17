const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { inject } = require('@vercel/analytics');
const { getRandomQuoteByType, getRandomQuote, getAvailableTypes, getQuotesCount } = require('./quotes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP detection (important for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// General rate limiting - allows 1000 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
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
  max: 500, // limit each IP to 500 API requests per windowMs
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please slow down and try again later.',
    retryAfter: '15 minutes',
    tip: 'Consider caching responses on your end to reduce API calls'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aggressive rate limiting for suspected abuse
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 requests per minute
  message: {
    error: 'Rate limit exceeded',
    message: 'You are making too many requests. Please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down middleware - gradually increases response time for frequent requests
const speedLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 100, // allow 100 requests per 5 minutes at full speed
  delayMs: 100, // add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // maximum delay of 5 seconds
});

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
app.use('/api', speedLimiter); // Apply speed limiting to API routes

// Welcome route
app.get('/', (req, res) => {
  res.json({
    analytics: inject(),
    message: 'Welcome to the Quote API!',
    version: '1.1.0',
    endpoints: {
      'GET /api': 'Get a random quote from any category',
      'GET /api?type=<category>': 'Get a random quote from a specific category',
      'GET /api/types': 'Get all available quote categories',
      'GET /api/stats': 'Get quote statistics by category'
    },
    availableTypes: getAvailableTypes(),
    totalQuotes: getQuotesCount().total,
    rateLimits: {
      general: '1000 requests per 15 minutes',
      api: '500 API requests per 15 minutes',
      note: 'Rate limit headers are included in responses'
    },
    security: {
      message: 'This API is protected against abuse and DDoS attacks',
      features: ['Rate limiting', 'Request throttling', 'Security headers']
    }
  });
});

// Main quote API endpoint
app.get('/api', (req, res) => {
  try {
    const { type } = req.query;
    
    if (type) {
      // Get quote by specific type
      const quote = getRandomQuoteByType(type);
      
      if (!quote) {
        return res.status(404).json({
          error: 'Quote type not found',
          message: `No quotes found for type: ${type}`,
          availableTypes: getAvailableTypes()
        });
      }
      
      res.json({
        quote: quote,
        type: type.toLowerCase(),
        timestamp: new Date().toISOString()
      });
    } else {
      // Get random quote from any category
      const quote = getRandomQuote();
      
      res.json({
        quote: quote,
        type: 'random',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching the quote'
    });
  }
});

// Get available quote types
app.get('/api/types', (req, res) => {
  res.json({
    availableTypes: getAvailableTypes(),
    total: getAvailableTypes().length
  });
});

// Get quote counts by category
app.get('/api/stats', (req, res) => {
  res.json({
    message: 'Quote statistics by category',
    counts: getQuotesCount()
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start the server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Quote API server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to see available endpoints`);
    console.log(`\nExample usage:`);
    console.log(`- Random quote: http://localhost:${PORT}/api`);
    console.log(`- Sad quote: http://localhost:${PORT}/api?type=sad`);
    console.log(`- Happy quote: http://localhost:${PORT}/api?type=happy`);
    console.log(`- Available types: http://localhost:${PORT}/api/types`);
  });
}

// Export the app for serverless deployment
module.exports = app; 