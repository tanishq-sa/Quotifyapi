process.env.JWT_SECRET = 'this_is_a_very_long_test_jwt_secret_32_chars_or_more';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.NODE_ENV = 'production'; // Prevents server from calling app.listen() automatically

// Mock the database adapter to prevent actual DB connections during tests
jest.mock('../database-adapter', () => ({
  init: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  validateApiKey: jest.fn(),
  logApiUsage: jest.fn(),
  getDailyUsageCount: jest.fn(),
  findUserById: jest.fn(),
  isAdmin: jest.fn(),
  updateUserPlan: jest.fn()
}));

const request = require('supertest');
const app = require('../server');

describe('Legacy Routes Redirections', () => {
  it('should redirect GET /api to /api/v1/quotes with 307 status code', async () => {
    const response = await request(app)
      .get('/api')
      .expect(307);
    
    expect(response.headers.location).toBe('/api/v1/quotes');
  });

  it('should preserve query parameters when redirecting GET /api', async () => {
    const response = await request(app)
      .get('/api?type=wisdom')
      .expect(307);
    
    expect(response.headers.location).toBe('/api/v1/quotes?type=wisdom');
  });

  it('should redirect GET /api/types to /api/v1/quotes/types with 307 status code', async () => {
    const response = await request(app)
      .get('/api/types')
      .expect(307);
    
    expect(response.headers.location).toBe('/api/v1/quotes/types');
  });

  it('should redirect GET /api/stats to /api/v1/quotes/stats with 307 status code', async () => {
    const response = await request(app)
      .get('/api/stats')
      .expect(307);
    
    expect(response.headers.location).toBe('/api/v1/quotes/stats');
  });
});
