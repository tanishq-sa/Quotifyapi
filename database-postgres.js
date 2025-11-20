const { Pool } = require('pg');
const crypto = require('crypto');

class PostgresDatabase {
  constructor() {
    this.pool = null;
    // SECURITY: Use environment variable for admin email
    this.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tanishqsaini872@gmail.com';
    
    // SECURITY: Rate limiting protection
    this.rateLimitMap = new Map();
    this.RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
    this.MAX_REQUESTS_PER_WINDOW = 1000; // Max requests per window
  }

  // Initialize database connection
  async init() {
    try {
      const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required for PostgreSQL connection');
      }

      // Create connection pool
      this.pool = new Pool({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased timeout for serverless cold starts
      });

      // Test connection with retry logic
      let retries = 3;
      let connected = false;
      
      while (retries > 0 && !connected) {
        try {
          const client = await this.pool.connect();
          console.log('✅ Connected to PostgreSQL database');
          client.release();
          connected = true;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          console.log(`⚠️  Database connection attempt failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Set up cleanup interval for rate limiting
      setInterval(() => {
        this.cleanupRateLimit();
      }, 5 * 60 * 1000); // Clean up every 5 minutes

      await this.createTables();
      await this.setupAdmin();
    } catch (error) {
      this.logSecurityEvent('Database connection failed', { error: error.message });
      console.error('❌ Error connecting to PostgreSQL database:', error.message);
      console.error('💡 Make sure POSTGRES_URL is set in your environment variables');
      throw error;
    }
  }

  // Create necessary tables
  async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          plan TEXT DEFAULT 'free',
          plan_expiry TIMESTAMP,
          role TEXT DEFAULT 'user',
          api_key TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // API keys table
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          key_value TEXT UNIQUE NOT NULL,
          name TEXT DEFAULT 'Default Key',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used TIMESTAMP
        )
      `);

      // API usage tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          response_status INTEGER,
          response_time INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User favorites table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          quote_text TEXT NOT NULL,
          quote_author TEXT,
          quote_category TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indices for better performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON api_keys(key_value)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

      await client.query('COMMIT');
      console.log('All database tables created successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate a secure API key
  generateApiKey() {
    const randomBytes = crypto.randomBytes(32);
    return 'qapi_' + randomBytes.toString('hex');
  }

  // SECURITY: Rate limiting check
  checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    for (const [key, requests] of this.rateLimitMap.entries()) {
      const filteredRequests = requests.filter(time => time > windowStart);
      if (filteredRequests.length === 0) {
        this.rateLimitMap.delete(key);
      } else {
        this.rateLimitMap.set(key, filteredRequests);
      }
    }
    
    const userRequests = this.rateLimitMap.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimitMap.set(identifier, recentRequests);
    
    return true;
  }

  // SECURITY: Enhanced error logging
  logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    console.log(`🚨 SECURITY EVENT [${timestamp}]: ${event}`, details);
  }

  // SECURITY: Clean up old rate limit data
  cleanupRateLimit() {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    for (const [key, requests] of this.rateLimitMap.entries()) {
      const filteredRequests = requests.filter(time => time > windowStart);
      if (filteredRequests.length === 0) {
        this.rateLimitMap.delete(key);
      } else {
        this.rateLimitMap.set(key, filteredRequests);
      }
    }
  }

  // Usage tracking methods
  async getMinuteUsageCount(userId, minuteTimestamp) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    if (!minuteTimestamp || isNaN(minuteTimestamp) || minuteTimestamp < 0) {
      throw new Error('Invalid minute timestamp');
    }
    
    const result = await this.pool.query(
      `SELECT COUNT(*) as count
       FROM api_usage 
       WHERE user_id = $1 AND DATE_TRUNC('minute', created_at) = DATE_TRUNC('minute', TO_TIMESTAMP($2))`,
      [userIdInt, minuteTimestamp]
    );
    
    return result.rows[0]?.count || 0;
  }

  async logMinuteUsage(userId, minuteTimestamp) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    if (!minuteTimestamp || isNaN(minuteTimestamp) || minuteTimestamp < 0) {
      throw new Error('Invalid minute timestamp');
    }
    
    const result = await this.pool.query(
      `INSERT INTO api_usage (user_id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time, created_at)
       VALUES ($1, NULL, 'minute_tracking', 'INTERNAL', '127.0.0.1', 'system', 200, 0, TO_TIMESTAMP($2))
       RETURNING id`,
      [userIdInt, minuteTimestamp]
    );
    
    return result.rows[0].id;
  }

  // User management methods
  async createUser(userData) {
    const { email, name, provider, provider_id, plan = 'free' } = userData;
    
    // Validation
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Invalid name (must be at least 2 characters)');
    }
    
    if (!provider || typeof provider !== 'string' || !['google', 'github', 'local'].includes(provider)) {
      throw new Error('Invalid provider');
    }
    
    if (!provider_id || typeof provider_id !== 'string' || provider_id.trim().length < 1) {
      throw new Error('Invalid provider_id');
    }
    
    const allowedPlans = ['free', 'basic', 'pro'];
    if (!allowedPlans.includes(plan.toLowerCase())) {
      throw new Error('Invalid plan');
    }
    
    const isAdmin = email === this.ADMIN_EMAIL;
    const api_key = isAdmin ? null : this.generateApiKey();
    
    const result = await this.pool.query(
      `INSERT INTO users (email, name, provider, provider_id, plan, api_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, name, provider, provider_id, plan, api_key]
    );
    
    return result.rows[0];
  }

  async findUserByEmail(email) {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async findUserById(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [userIdInt]);
    return result.rows[0];
  }

  async findUserByProvider(provider, provider_id) {
    if (!provider || typeof provider !== 'string' || !['google', 'github', 'local'].includes(provider)) {
      throw new Error('Invalid provider');
    }
    
    if (!provider_id || typeof provider_id !== 'string' || provider_id.trim().length < 1) {
      throw new Error('Invalid provider_id');
    }
    
    const result = await this.pool.query(
      'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
      [provider, provider_id]
    );
    return result.rows[0];
  }

  // API key management methods
  async createApiKey(userId, name = 'Default Key') {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      throw new Error('Invalid API key name (must be 1-100 characters)');
    }
    
    const isAdmin = await this.isAdmin(userIdInt);
    if (isAdmin) {
      const hasKeys = await this.hasApiKeys(userIdInt);
      if (hasKeys) {
        throw new Error('Admin users can only have one API key');
      }
    }
    
    const key_value = this.generateApiKey();
    const result = await this.pool.query(
      `INSERT INTO api_keys (user_id, key_value, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userIdInt, key_value, name]
    );
    
    return result.rows[0];
  }

  async createFirstAdminApiKey(userId) {
    const hasKeys = await this.hasApiKeys(userId);
    if (hasKeys) {
      console.log(`ℹ️  Admin user ${userId} already has API keys`);
      return { message: 'Admin already has API keys' };
    }
    
    return await this.createApiKey(userId, 'Admin Default Key');
  }

  async validateApiKey(apiKey, clientIP = null) {
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('qapi_') || apiKey.length !== 69) {
      this.logSecurityEvent('Invalid API key format attempt', { apiKey: apiKey?.substring(0, 10) + '...', clientIP });
      throw new Error('Invalid API key format');
    }
    
    const rateLimitIdentifier = clientIP || apiKey;
    if (!this.checkRateLimit(rateLimitIdentifier)) {
      this.logSecurityEvent('Rate limit exceeded', { identifier: rateLimitIdentifier, clientIP });
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    const result = await this.pool.query(
      `SELECT ak.*, u.email, u.name, u.plan, u.provider, u.role
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       WHERE ak.key_value = $1 AND ak.is_active = true`,
      [apiKey]
    );
    
    if (!result.rows[0]) {
      this.logSecurityEvent('Invalid API key used', { apiKey: apiKey.substring(0, 10) + '...', clientIP });
      throw new Error('Invalid API key');
    }
    
    return result.rows[0];
  }

  async getUserApiKeys(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [userIdInt]
    );
    return result.rows;
  }

  async hasApiKeys(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1 AND is_active = true',
      [userIdInt]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  async revokeApiKey(keyId, userId) {
    const keyIdInt = parseInt(keyId, 10);
    const userIdInt = parseInt(userId, 10);
    
    if (!keyId || isNaN(keyIdInt) || keyIdInt < 1) {
      throw new Error('Invalid key ID');
    }
    
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2',
      [keyIdInt, userIdInt]
    );
    return result.rowCount > 0;
  }

  async deleteApiKey(keyId, userId) {
    const keyIdInt = parseInt(keyId, 10);
    const userIdInt = parseInt(userId, 10);
    
    if (!keyId || isNaN(keyIdInt) || keyIdInt < 1) {
      throw new Error('Invalid key ID');
    }
    
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2',
      [keyIdInt, userIdInt]
    );
    return result.rowCount > 0;
  }

  async deleteAllApiKeysByEmail(email) {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    const userResult = await this.pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!userResult.rows[0]) {
      throw new Error('User not found');
    }
    
    const deleteResult = await this.pool.query(
      'DELETE FROM api_keys WHERE user_id = $1',
      [userResult.rows[0].id]
    );
    
    return {
      deletedCount: deleteResult.rowCount,
      userId: userResult.rows[0].id,
      email: email
    };
  }

  // API usage tracking methods
  async logApiUsage(usageData) {
    const { user_id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time } = usageData;
    
    const userIdInt = parseInt(user_id, 10);
    if (!user_id || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    if (api_key_id !== null && api_key_id !== undefined) {
      const apiKeyIdInt = parseInt(api_key_id, 10);
      if (isNaN(apiKeyIdInt) || apiKeyIdInt < 1) {
        throw new Error('Invalid API key ID');
      }
    }
    
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim().length < 1) {
      throw new Error('Invalid endpoint');
    }
    
    if (!method || typeof method !== 'string' || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      throw new Error('Invalid HTTP method');
    }
    
    const result = await this.pool.query(
      `INSERT INTO api_usage (user_id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userIdInt, api_key_id, endpoint, method.toUpperCase(), ip_address, user_agent, response_status, response_time]
    );
    
    return result.rows[0].id;
  }

  async getUserUsageStats(userId, days = 30) {
    const userIdInt = parseInt(userId, 10);
    const daysInt = parseInt(days, 10);
    
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
      throw new Error('Invalid days parameter (must be between 1 and 365)');
    }
    
    const result = await this.pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_requests,
        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as failed_requests,
        AVG(response_time) as avg_response_time
       FROM api_usage 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userIdInt, daysInt]
    );
    
    return result.rows;
  }

  async getDailyUsageCount(userId, date = new Date().toISOString().split('T')[0]) {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count
       FROM api_usage 
       WHERE user_id = $1 AND DATE(created_at) = $2`,
      [userId, date]
    );
    
    return result.rows[0]?.count || 0;
  }

  // User favorites methods
  async addFavorite(userId, quoteData) {
    const { quote_text, quote_author, quote_category } = quoteData;
    
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    if (!quote_text || typeof quote_text !== 'string' || quote_text.trim().length < 1) {
      throw new Error('Invalid quote text');
    }
    
    const result = await this.pool.query(
      `INSERT INTO user_favorites (user_id, quote_text, quote_author, quote_category)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userIdInt, quote_text.trim(), quote_author?.trim() || null, quote_category?.trim() || null]
    );
    
    return result.rows[0].id;
  }

  async getUserFavorites(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query(
      'SELECT * FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userIdInt]
    );
    return result.rows;
  }

  // Admin management methods
  async makeUserAdmin(email) {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    if (email !== this.ADMIN_EMAIL) {
      this.logSecurityEvent('Unauthorized admin promotion attempt', { 
        attemptedEmail: email, 
        adminEmail: this.ADMIN_EMAIL 
      });
      throw new Error('Unauthorized admin promotion attempt');
    }
    
    const result = await this.pool.query(
      `UPDATE users 
       SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
       WHERE email = $1`,
      [email]
    );
    
    return result.rowCount > 0;
  }

  async isAdmin(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const result = await this.pool.query('SELECT role FROM users WHERE id = $1', [userIdInt]);
    return result.rows[0]?.role === 'admin';
  }

  async getAllUsers() {
    const result = await this.pool.query(
      `SELECT u.id, u.email, u.name, u.plan, u.role, u.provider, u.created_at, u.updated_at,
              COUNT(DISTINCT CASE WHEN ak.is_active = true THEN ak.id END) as api_key_count,
              COUNT(DISTINCT au.id) as total_requests,
              COUNT(DISTINCT CASE WHEN DATE(au.created_at) = CURRENT_DATE THEN au.id END) as today_requests
       FROM users u
       LEFT JOIN api_keys ak ON u.id = ak.user_id
       LEFT JOIN api_usage au ON u.id = au.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    
    return result.rows;
  }

  async updateUserPlan(userId, plan, expiryDate = null) {
    const userIdInt = parseInt(userId, 10);
    
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const allowedPlans = ['free', 'basic', 'pro'];
    if (!plan || !allowedPlans.includes(plan.toLowerCase())) {
      throw new Error('Invalid plan');
    }
    
    let result;
    if (expiryDate) {
      result = await this.pool.query(
        `UPDATE users 
         SET plan = $1, plan_expiry = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [plan.toLowerCase(), expiryDate, userIdInt]
      );
    } else {
      result = await this.pool.query(
        `UPDATE users 
         SET plan = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [plan.toLowerCase(), userIdInt]
      );
    }
    
    return result.rowCount > 0;
  }

  async getSystemStats() {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_users,
        COUNT(CASE WHEN plan = 'basic' THEN 1 END) as basic_users,
        COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_users,
        (SELECT COUNT(*) FROM api_usage) as total_requests,
        (SELECT COUNT(*) FROM api_usage WHERE DATE(created_at) = CURRENT_DATE) as today_requests,
        (SELECT COUNT(*) FROM api_keys WHERE is_active = true) as active_api_keys
       FROM users`
    );
    
    return result.rows[0];
  }

  async getDailyUsageStats(days = 30) {
    const result = await this.pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT user_id) as unique_users
       FROM api_usage 
       WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [days]
    );
    
    return result.rows;
  }

  async deactivateUserApiKeys(userId, excludeKeyId = null) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    let result;
    if (excludeKeyId) {
      const excludeKeyIdInt = parseInt(excludeKeyId, 10);
      if (isNaN(excludeKeyIdInt) || excludeKeyIdInt < 1) {
        throw new Error('Invalid exclude key ID');
      }
      
      result = await this.pool.query(
        `UPDATE api_keys 
         SET is_active = false 
         WHERE user_id = $1 AND is_active = true AND id != $2`,
        [userIdInt, excludeKeyIdInt]
      );
    } else {
      result = await this.pool.query(
        `UPDATE api_keys 
         SET is_active = false 
         WHERE user_id = $1 AND is_active = true`,
        [userIdInt]
      );
    }
    
    console.log(`✅ Deactivated ${result.rowCount} API keys for user ${userIdInt}`);
    return result.rowCount;
  }

  async deleteUser(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete API keys
      await client.query('DELETE FROM api_keys WHERE user_id = $1', [userIdInt]);
      
      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userIdInt]);
      
      await client.query('COMMIT');
      console.log(`✅ Deleted user ${userIdInt} and all associated data`);
      return { id: userIdInt, deleted: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Setup admin user
  async setupAdmin() {
    try {
      const adminEmail = this.ADMIN_EMAIL;
      const result = await this.makeUserAdmin(adminEmail);
      
      if (result) {
        console.log(`✅ ${adminEmail} has been set as admin`);
      } else {
        console.log(`ℹ️  ${adminEmail} not found in database (will be set as admin when they register)`);
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
    }
  }

  // Close database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = new PostgresDatabase();

