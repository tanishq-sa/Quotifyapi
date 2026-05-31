const http = require('http');
const https = require('https');
const url = require('url');

// Load quotes from separate files
const sadQuotes = require('./quotes/sad');
const happyQuotes = require('./quotes/happy');
const loveQuotes = require('./quotes/love');
const motivationalQuotes = require('./quotes/motivational');
const wisdomQuotes = require('./quotes/wisdom');

// Organize quotes by category
const quotes = {
  sad: sadQuotes,
  happy: happyQuotes,
  love: loveQuotes,
  motivational: motivationalQuotes,
  wisdom: wisdomQuotes
};

// Function to get all quotes from all categories
let cachedAllQuotes = null;

function getAllQuotes() {
  if (cachedAllQuotes) {
    return cachedAllQuotes;
  }
  const allQuotes = [];
  Object.values(quotes).forEach(categoryQuotes => {
    allQuotes.push(...categoryQuotes);
  });
  cachedAllQuotes = allQuotes;
  return allQuotes;
}

// Function to get a random quote from a specific category
function getRandomQuoteByType(type) {
  const categoryQuotes = quotes[type.toLowerCase()];
  if (!categoryQuotes || categoryQuotes.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
  return categoryQuotes[randomIndex];
}

// Function to get a random quote from any category
function getRandomQuote() {
  const allQuotes = getAllQuotes();
  const randomIndex = Math.floor(Math.random() * allQuotes.length);
  return allQuotes[randomIndex];
}

// Function to get available quote types
function getAvailableTypes() {
  return Object.keys(quotes);
}

// Function to get count of quotes by category
function getQuotesCount() {
  const counts = {};
  Object.keys(quotes).forEach(type => {
    counts[type] = quotes[type].length;
  });
  counts.total = getAllQuotes().length;
  return counts;
}

class ApiClient {
  constructor(apiKey, baseUrl = 'https://quotify.dazzelr.tech') {
    if (!apiKey) {
      throw new Error('API Key is required to initialize the ApiClient.');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  _makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(`${this.baseUrl}${endpoint}`);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'User-Agent': 'Quotify-SDK/1.3.0',
          'x-api-key': this.apiKey
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsedData.message || parsedData.error || `Request failed with status ${res.statusCode}`));
            } else {
              resolve(parsedData);
            }
          } catch (e) {
            reject(new Error(`Failed to parse API response: ${data.substring(0, 100)}`));
          }
        });
      });

      req.on('error', (err) => { reject(err); });
      req.end();
    });
  }

  async getRandomQuote() {
    const res = await this._makeRequest('/api/v1/quotes');
    return res.quote;
  }

  async getRandomQuoteByType(type) {
    const res = await this._makeRequest(`/api/v1/quotes/category/${type.toLowerCase()}`);
    return res.quote;
  }

  async getAvailableTypes() {
    const res = await this._makeRequest('/api/v1/quotes/types');
    return res.availableTypes;
  }

  async getQuotesCount() {
    const res = await this._makeRequest('/api/v1/quotes/stats');
    return res.counts;
  }
}

module.exports = {
  quotes,
  getAllQuotes,
  getRandomQuoteByType,
  getRandomQuote,
  getAvailableTypes,
  getQuotesCount,
  ApiClient
}; 