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
function getAllQuotes() {
  const allQuotes = [];
  Object.values(quotes).forEach(categoryQuotes => {
    allQuotes.push(...categoryQuotes);
  });
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

module.exports = {
  quotes,
  getAllQuotes,
  getRandomQuoteByType,
  getRandomQuote,
  getAvailableTypes,
  getQuotesCount
}; 