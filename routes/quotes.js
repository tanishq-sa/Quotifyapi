const express = require('express');
const database = require('../database-adapter');
const { getRandomQuoteByType, getRandomQuote, getAvailableTypes, getQuotesCount } = require('../quotes');

const router = express.Router();

// Get random quote
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    // SECURITY: Free users can only get random quotes, not specific categories
    if (req.user.plan === 'free' && type) {
      return res.status(403).json({
        error: 'Plan restriction',
        message: 'Free plan users can only access random quotes. Upgrade to Basic or Pro plan to access specific categories.',
        plan: req.user.plan,
        upgrade_required: true,
        available_plans: ['basic', 'pro']
      });
    }
    
    let quote;
    if (type) {
      quote = getRandomQuoteByType(type);
      
      if (!quote) {
        return res.status(404).json({
          error: 'Quote type not found',
          message: `No quotes found for type: ${type}`,
          availableTypes: getAvailableTypes()
        });
      }
    } else {
      quote = getRandomQuote();
    }
    
    // Log API usage
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - req.startTime
    });
    
    res.json({
      quote: quote,
      type: type ? type.toLowerCase() : 'random',
      timestamp: new Date().toISOString(),
      user: {
        plan: req.user.plan,
        remaining_requests: res.get('X-RateLimit-Remaining')
      }
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching the quote'
    });
  }
});

// Get quotes by category
router.get('/category/:category', async (req, res) => {
  try {
    // SECURITY: Free users cannot access category-specific quotes
    if (req.user.plan === 'free') {
      return res.status(403).json({
        error: 'Plan restriction',
        message: 'Free plan users can only access random quotes. Upgrade to Basic or Pro plan to access specific categories.',
        plan: req.user.plan,
        upgrade_required: true,
        available_plans: ['basic', 'pro']
      });
    }
    
    const { category } = req.params;
    const quote = getRandomQuoteByType(category);
    
    if (!quote) {
      return res.status(404).json({
        error: 'Quote category not found',
        message: `No quotes found for category: ${category}`,
        availableTypes: getAvailableTypes()
      });
    }
    
    // Log API usage
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - req.startTime
    });
    
    res.json({
      quote: quote,
      category: category.toLowerCase(),
      timestamp: new Date().toISOString(),
      user: {
        plan: req.user.plan,
        remaining_requests: res.get('X-RateLimit-Remaining')
      }
    });
  } catch (error) {
    console.error('Get quote by category error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching the quote'
    });
  }
});

// Search quotes (basic implementation)
router.get('/search', async (req, res) => {
  try {
    // SECURITY: Free users cannot access search functionality
    if (req.user.plan === 'free') {
      return res.status(403).json({
        error: 'Plan restriction',
        message: 'Free plan users can only access random quotes. Upgrade to Basic or Pro plan to access search functionality.',
        plan: req.user.plan,
        upgrade_required: true,
        available_plans: ['basic', 'pro']
      });
    }
    
    const { q: query, category } = req.query;
    
    // SECURITY: Comprehensive input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Search query is required and must be a non-empty string'
      });
    }
    
    // SECURITY: Limit query length to prevent DoS
    if (query.length > 100) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Search query is too long (maximum 100 characters)'
      });
    }
    
    // SECURITY: Sanitize query to prevent injection
    const sanitizedQuery = query.trim().replace(/[<>\"'&]/g, '');
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Search query contains invalid characters'
      });
    }
    
    // SECURITY: Validate category if provided
    if (category && (typeof category !== 'string' || category.length > 50)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Category must be a string with maximum 50 characters'
      });
    }

    // Basic search implementation - in a real app, you'd use a proper search engine
    const allTypes = getAvailableTypes();
    const searchResults = [];
    
    for (const type of allTypes) {
      const quote = getRandomQuoteByType(type);
      if (quote && (
        quote.text.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
        quote.author.toLowerCase().includes(sanitizedQuery.toLowerCase())
      )) {
        searchResults.push({
          ...quote,
          category: type
        });
      }
    }
    
    // Log API usage
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - req.startTime
    });
    
    res.json({
      results: searchResults,
      query: sanitizedQuery, // SECURITY: Return sanitized query
      total: searchResults.length,
      timestamp: new Date().toISOString(),
      user: {
        plan: req.user.plan,
        remaining_requests: res.get('X-RateLimit-Remaining')
      }
    });
  } catch (error) {
    console.error('Search quotes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while searching quotes'
    });
  }
});

// Get available quote categories
router.get('/types', async (req, res) => {
  try {
    // SECURITY: Free users cannot access category information
    if (req.user.plan === 'free') {
      return res.status(403).json({
        error: 'Plan restriction',
        message: 'Free plan users can only access random quotes. Upgrade to Basic or Pro plan to access category information.',
        plan: req.user.plan,
        upgrade_required: true,
        available_plans: ['basic', 'pro']
      });
    }
    
    const types = getAvailableTypes();
    const counts = getQuotesCount();
    
    // Log API usage
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - req.startTime
    });
    
    res.json({
      availableTypes: types,
      counts: counts,
      total: types.length,
      timestamp: new Date().toISOString(),
      user: {
        plan: req.user.plan,
        remaining_requests: res.get('X-RateLimit-Remaining')
      }
    });
  } catch (error) {
    console.error('Get types error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching quote types'
    });
  }
});

// Get quote statistics
router.get('/stats', async (req, res) => {
  try {
    const counts = getQuotesCount();
    
    // Log API usage
    await database.logApiUsage({
      user_id: req.user.id,
      api_key_id: req.user.api_key_id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      response_status: 200,
      response_time: Date.now() - req.startTime
    });
    
    res.json({
      message: 'Quote statistics by category',
      counts: counts,
      timestamp: new Date().toISOString(),
      user: {
        plan: req.user.plan,
        remaining_requests: res.get('X-RateLimit-Remaining')
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching statistics'
    });
  }
});

module.exports = router;
