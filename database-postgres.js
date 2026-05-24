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
    
    // PERFORMANCE: Simple cache for frequently accessed data
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  }
  
  // Cache helper methods
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Initialize database connection
  async init() {
    try {
      const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required for PostgreSQL connection');
      }

      // Create connection pool with SSL configuration for cloud providers
      // Remove any SSL params from connection string to avoid conflicts
      const cleanConnectionString = connectionString.split('?')[0];
      const params = new URLSearchParams(connectionString.split('?')[1] || '');
      
      this.pool = new Pool({
        connectionString: cleanConnectionString,
        ssl: {
          rejectUnauthorized: false, // Accept self-signed certificates from cloud providers
          require: true
        },
        // PERFORMANCE: Optimized pool settings for serverless
        max: 10, // Reduced from 20 - serverless functions should use fewer connections
        min: 0, // No minimum connections - save resources
        idleTimeoutMillis: 10000, // Close idle connections faster (10s instead of 30s)
        connectionTimeoutMillis: 20000, // Increased timeout for Aiven/serverless
        statement_timeout: 30000, // Query timeout
        allowExitOnIdle: true, // Allow the pool to close when all connections are idle
      });

      // Test connection with retry logic
      let retries = 3;
      let connected = false;
      let lastError = null;
      
      while (retries > 0 && !connected) {
        try {
          const client = await this.pool.connect();
          console.log('✅ Connected to PostgreSQL database');
          console.log('   Host:', connectionString.split('@')[1]?.split('/')[0]);
          client.release();
          connected = true;
        } catch (err) {
          lastError = err;
          retries--;
          console.log(`⚠️  Database connection attempt failed: ${err.message}`);
          if (retries > 0) {
            console.log(`   Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!connected) {
        throw lastError;
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
      // Ensure contact_submissions table and indexes exist (run regardless of other tables)
      await client.query(`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_contact_submissions_email_ip ON contact_submissions(email, ip_address)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at)');

      // Check if tables already exist to avoid race conditions
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      if (checkResult.rows[0].exists) {
        console.log('✅ Database tables already exist, skipping creation');
        return;
      }

      // Use advisory lock to prevent concurrent table creation
      await client.query('SELECT pg_advisory_lock(12345)');
      
      try {
        // Double-check after acquiring lock
        const recheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          );
        `);
        
        if (recheckResult.rows[0].exists) {
          console.log('✅ Database tables already exist (created by another instance)');
          return;
        }

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

        // Contact submissions table
        await client.query(`
          CREATE TABLE IF NOT EXISTS contact_submissions (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indices for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_api_keys_user_active ON api_keys(user_id, is_active)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON api_keys(key_value) WHERE is_active = true');
        await client.query('CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, created_at)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_contact_submissions_email_ip ON contact_submissions(email, ip_address)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at)');

        console.log('✅ All database tables created successfully');
      } finally {
        // Release the advisory lock
        await client.query('SELECT pg_advisory_unlock(12345)');
      }
    } catch (error) {
      // Handle duplicate key errors gracefully (race condition)
      if (error.code === '23505' || error.message.includes('already exists')) {
        console.log('✅ Database tables already exist (concurrent creation detected)');
        return;
      }
      console.error('❌ Error creating tables:', error.message);
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
       RETURNING id, email, name, provider, provider_id, plan, plan_expiry, role, created_at, updated_at`,
      [email, name, provider, provider_id, plan, api_key]
    );
    
    // Invalidate user cache
    this.invalidateCache(`user:`);
    
    return result.rows[0];
  }

  async findUserByEmail(email) {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Check cache first
    const cacheKey = `user:email:${email}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // Optimized query - only select needed fields
    const result = await this.pool.query(
      `SELECT id, email, name, provider, provider_id, plan, plan_expiry, role, created_at, updated_at 
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    
    if (result.rows[0]) {
      this.setCache(cacheKey, result.rows[0]);
    }
    
    return result.rows[0];
  }

  async findUserById(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    // Check cache first
    const cacheKey = `user:id:${userIdInt}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // Optimized query - only select needed fields
    const result = await this.pool.query(
      `SELECT id, email, name, provider, provider_id, plan, plan_expiry, role, created_at, updated_at 
       FROM users WHERE id = $1 LIMIT 1`,
      [userIdInt]
    );
    
    if (result.rows[0]) {
      this.setCache(cacheKey, result.rows[0]);
    }
    
    return result.rows[0];
  }

  async findUserByProvider(provider, provider_id) {
    if (!provider || typeof provider !== 'string' || !['google', 'github', 'local'].includes(provider)) {
      throw new Error('Invalid provider');
    }
    
    if (!provider_id || typeof provider_id !== 'string' || provider_id.trim().length < 1) {
      throw new Error('Invalid provider_id');
    }
    
    // Optimized query - only select needed fields
    const result = await this.pool.query(
      `SELECT id, email, name, provider, provider_id, plan, plan_expiry, role, created_at, updated_at 
       FROM users WHERE provider = $1 AND provider_id = $2 LIMIT 1`,
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
       RETURNING id, user_id, key_value, name, is_active, created_at, last_used`,
      [userIdInt, key_value, name]
    );
    
    // Invalidate API keys cache
    this.invalidateCache(`apikeys:user:${userIdInt}`);
    
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
    
    // Check cache first (cache valid API keys for 2 minutes)
    const cacheKey = `apikey:${apiKey}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // OPTIMIZED: Only select needed fields, use partial index
    const result = await this.pool.query(
      `SELECT ak.id, ak.user_id, ak.key_value, ak.name, 
              u.email, u.name as user_name, u.plan, u.provider, u.role
       FROM api_keys ak
       INNER JOIN users u ON ak.user_id = u.id
       WHERE ak.key_value = $1 AND ak.is_active = true
       LIMIT 1`,
      [apiKey]
    );
    
    if (!result.rows[0]) {
      this.logSecurityEvent('Invalid API key used', { apiKey: apiKey.substring(0, 10) + '...', clientIP });
      return null;
    }
    
    const keyData = result.rows[0];
    this.setCache(cacheKey, keyData);
    return keyData;
  }

  async getUserApiKeys(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    // Check cache first
    const cacheKey = `apikeys:user:${userIdInt}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // Optimized query - only select needed fields, use composite index
    const result = await this.pool.query(
      `SELECT id, user_id, key_value, name, is_active, created_at, last_used 
       FROM api_keys 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userIdInt]
    );
    
    this.setCache(cacheKey, result.rows);
    return result.rows;
  }

  async hasApiKeys(userId) {
    const userIdInt = parseInt(userId, 10);
    if (!userId || isNaN(userIdInt) || userIdInt < 1) {
      throw new Error('Invalid user ID');
    }
    
    // Optimized query - use EXISTS instead of COUNT, uses composite index
    const result = await this.pool.query(
      'SELECT EXISTS(SELECT 1 FROM api_keys WHERE user_id = $1 AND is_active = true LIMIT 1) as has_keys',
      [userIdInt]
    );
    return result.rows[0].has_keys;
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
    
    if (!method || typeof method !== 'string' || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'INTERNAL'].includes(method.toUpperCase())) {
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
    
    // Check cache first
    const cacheKey = `usage:${userIdInt}:${daysInt}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // OPTIMIZED: Use simpler COUNT with filter, avoid CASE statements
    const result = await this.pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE response_status BETWEEN 200 AND 299) as successful_requests,
        COUNT(*) FILTER (WHERE response_status >= 400) as failed_requests,
        ROUND(AVG(response_time)::numeric, 2) as avg_response_time
       FROM api_usage 
       WHERE user_id = $1 
         AND created_at >= CURRENT_DATE - $2::integer
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 365`,
      [userIdInt, daysInt]
    );
    
    this.setCache(cacheKey, result.rows);
    return result.rows;
  }

  async getDailyUsageCount(userId, date = new Date().toISOString().split('T')[0]) {
    // Check cache first (cache for 1 minute for current day)
    const cacheKey = `daily:${userId}:${date}`;
    const cached = this.getCached(cacheKey);
    if (cached !== null) return cached;
    
    // OPTIMIZED: Use indexed column directly, no function on column
    const result = await this.pool.query(
      `SELECT COUNT(*) as count
       FROM api_usage 
       WHERE user_id = $1 
         AND created_at >= $2::date 
         AND created_at < ($2::date + INTERVAL '1 day')`,
      [userId, date]
    );
    
    const count = parseInt(result.rows[0]?.count || 0);
    this.setCache(cacheKey, count);
    return count;
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
    // Check cache first (cache for 30 seconds)
    const cacheKey = 'all_users';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // OPTIMIZED: Use subqueries instead of LEFT JOINs to avoid cartesian product
    const result = await this.pool.query(
      `SELECT 
        u.id, u.email, u.name, u.plan, u.role, u.provider, u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM api_keys ak WHERE ak.user_id = u.id AND ak.is_active = true) as api_key_count,
        (SELECT COUNT(*) FROM api_usage au WHERE au.user_id = u.id) as total_requests,
        (SELECT COUNT(*) FROM api_usage au 
         WHERE au.user_id = u.id 
           AND au.created_at >= CURRENT_DATE 
           AND au.created_at < CURRENT_DATE + INTERVAL '1 day') as today_requests
       FROM users u
       ORDER BY u.created_at DESC
       LIMIT 1000`
    );
    
    this.setCache(cacheKey, result.rows);
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
    // Check cache first (cache for 1 minute)
    const cacheKey = 'system_stats';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // OPTIMIZED: Use FILTER instead of CASE, optimize date comparison
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE plan = 'free') as free_users,
        COUNT(*) FILTER (WHERE plan = 'basic') as basic_users,
        COUNT(*) FILTER (WHERE plan = 'pro') as pro_users,
        (SELECT COUNT(*) FROM api_usage) as total_requests,
        (SELECT COUNT(*) FROM api_usage 
         WHERE created_at >= CURRENT_DATE 
           AND created_at < CURRENT_DATE + INTERVAL '1 day') as today_requests,
        (SELECT COUNT(*) FROM api_keys WHERE is_active = true) as active_api_keys
       FROM users`
    );
    
    this.setCache(cacheKey, result.rows[0]);
    return result.rows[0];
  }

  async getDailyUsageStats(days = 30) {
    // Check cache first
    const cacheKey = `daily_stats:${days}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // OPTIMIZED: Avoid DATE() function on indexed column
    const result = await this.pool.query(
      `SELECT 
        created_at::date as date,
        COUNT(*) as requests,
        COUNT(DISTINCT user_id) as unique_users
       FROM api_usage 
       WHERE created_at >= CURRENT_DATE - $1::integer
       GROUP BY created_at::date
       ORDER BY date DESC
       LIMIT 365`,
      [days]
    );
    
    this.setCache(cacheKey, result.rows);
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

  async checkContactRateLimit(email, ipAddress) {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count 
       FROM contact_submissions 
       WHERE (email = $1 OR ip_address = $2) 
         AND created_at >= NOW() - INTERVAL '1 day'`,
      [email, ipAddress]
    );
    const count = parseInt(result.rows[0]?.count || 0, 10);
    return count > 0;
  }

  async createContactSubmission(email, ipAddress) {
    const result = await this.pool.query(
      `INSERT INTO contact_submissions (email, ip_address)
       VALUES ($1, $2)
       RETURNING id`,
      [email, ipAddress]
    );
    return result.rows[0].id;
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

