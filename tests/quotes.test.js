const { 
  quotes,
  getAllQuotes,
  getRandomQuoteByType,
  getRandomQuote,
  getAvailableTypes,
  getQuotesCount,
  ApiClient
} = require('../quotes');

describe('Quotes Module', () => {
  describe('getAllQuotes', () => {
    it('should return all quotes from all categories', () => {
      const allQuotes = getAllQuotes();
      expect(Array.isArray(allQuotes)).toBe(true);
      expect(allQuotes.length).toBeGreaterThan(0);
      
      // Check structure of first quote
      const firstQuote = allQuotes[0];
      expect(firstQuote).toHaveProperty('text');
      expect(firstQuote).toHaveProperty('author');
    });

    it('should return the cached quotes list on subsequent calls', () => {
      const allQuotes1 = getAllQuotes();
      const allQuotes2 = getAllQuotes();
      expect(allQuotes1).toBe(allQuotes2);
    });
  });

  describe('getRandomQuoteByType', () => {
    it('should return a random quote of the specified type (case-insensitive)', () => {
      const category = 'happy';
      const quote = getRandomQuoteByType(category);
      expect(quote).toBeDefined();
      expect(quote).not.toBeNull();
      expect(quote).toHaveProperty('text');
      expect(quote).toHaveProperty('author');

      // Verify it's actually from the category
      const categoryQuotes = quotes[category];
      expect(categoryQuotes).toContainEqual(quote);
    });

    it('should return a random quote of the specified type with uppercase input', () => {
      const quote = getRandomQuoteByType('HAPPY');
      expect(quote).toBeDefined();
      expect(quote).not.toBeNull();
      expect(quotes['happy']).toContainEqual(quote);
    });

    it('should return null for an invalid category type', () => {
      const quote = getRandomQuoteByType('nonexistent-category');
      expect(quote).toBeNull();
    });
  });

  describe('getRandomQuote', () => {
    it('should return a quote from any category', () => {
      const quote = getRandomQuote();
      expect(quote).toBeDefined();
      expect(quote).not.toBeNull();
      expect(quote).toHaveProperty('text');
      expect(quote).toHaveProperty('author');

      const allQuotes = getAllQuotes();
      expect(allQuotes).toContainEqual(quote);
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all 5 expected categories', () => {
      const types = getAvailableTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toEqual(['sad', 'happy', 'love', 'motivational', 'wisdom']);
    });
  });

  describe('getQuotesCount', () => {
    it('should return correct count summary including total', () => {
      const counts = getQuotesCount();
      expect(counts).toHaveProperty('sad');
      expect(counts).toHaveProperty('happy');
      expect(counts).toHaveProperty('love');
      expect(counts).toHaveProperty('motivational');
      expect(counts).toHaveProperty('wisdom');
      expect(counts).toHaveProperty('total');

      expect(counts.sad).toBe(quotes.sad.length);
      expect(counts.happy).toBe(quotes.happy.length);
      expect(counts.total).toBe(getAllQuotes().length);
    });
  });

  describe('ApiClient', () => {
    it('should throw an error if initialized without API key', () => {
      expect(() => {
        new ApiClient();
      }).toThrow('API Key is required to initialize the ApiClient.');
    });

    it('should initialize with correct API key and default base URL', () => {
      const client = new ApiClient('test-key');
      expect(client.apiKey).toBe('test-key');
      expect(client.baseUrl).toBe('https://quotify.dazzelr.tech');
    });

    it('should initialize with custom base URL', () => {
      const client = new ApiClient('test-key', 'http://localhost:3000');
      expect(client.apiKey).toBe('test-key');
      expect(client.baseUrl).toBe('http://localhost:3000');
    });
  });
});
