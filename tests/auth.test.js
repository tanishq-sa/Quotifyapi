// Set environment variables BEFORE requiring auth.js to avoid process.exit(1)
process.env.JWT_SECRET = 'this_is_a_very_long_test_jwt_secret_32_chars_or_more';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

const {
  generateToken,
  verifyToken,
  authenticateJWT,
  checkRateLimit
} = require('../auth');

const jwt = require('jsonwebtoken');

describe('Auth Module', () => {
  const dummyUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    plan: 'free',
    provider: 'email'
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token with user details', () => {
      const token = generateToken(dummyUser);
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(dummyUser.id);
      expect(decoded.email).toBe(dummyUser.email);
      expect(decoded.name).toBe(dummyUser.name);
      expect(decoded.plan).toBe(dummyUser.plan);
      expect(decoded.provider).toBe(dummyUser.provider);
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for a valid token', () => {
      const token = generateToken(dummyUser);
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.email).toBe(dummyUser.email);
    });

    it('should return null for an invalid token', () => {
      const decoded = verifyToken('invalid-token-string');
      expect(decoded).toBeNull();
    });

    it('should return null for an expired token', () => {
      // Create an expired token manually
      const expiredToken = jwt.sign(
        { id: dummyUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const decoded = verifyToken(expiredToken);
      expect(decoded).toBeNull();
    });
  });

  describe('authenticateJWT', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should call next() if a valid Bearer token is provided', () => {
      const token = generateToken(dummyUser);
      req.headers.authorization = `Bearer ${token}`;

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe(dummyUser.email);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header is provided', () => {
      authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Access denied',
          message: 'No token provided'
        })
      );
    });

    it('should return 401 if token is missing from authorization header', () => {
      req.headers.authorization = 'Bearer ';

      authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if an invalid token is provided', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid token',
          message: 'Token is invalid or expired'
        })
      );
    });
  });
});
