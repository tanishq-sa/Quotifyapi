const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class Database {
  constructor() {
    this.db = null;
    // SECURITY: Use environment variable for admin email
    this.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tanishqsaini872@gmail.com';
    
    // SECURITY: Rate limiting protection
    this.rateLimitMap = new Map();
    this.RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
    this.MAX_REQUESTS_PER_WINDOW = 1000; // Max requests per window
  }

  // Initialize database connection
  async init() {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.DATABASE_URL || './database.sqlite';
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          this.logSecurityEvent('Database connection failed', { error: err.message, dbPath });
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          
          // Set up cleanup interval for rate limiting
          setInterval(() => {
            this.cleanupRateLimit();
          }, 5 * 60 * 1000); // Clean up every 5 minutes
          
          this.createTables().then(() => {
            this.setupAdmin().then(resolve).catch(reject);
          }).catch(reject);
        }
      });
    });
  }

  // Create necessary tables
  async createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          plan TEXT DEFAULT 'free',
          plan_expiry DATETIME,
          role TEXT DEFAULT 'user',
          api_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // API keys table
        `CREATE TABLE IF NOT EXISTS api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          key_value TEXT UNIQUE NOT NULL,
          name TEXT DEFAULT 'Default Key',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // API usage tracking table
        `CREATE TABLE IF NOT EXISTS api_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          api_key_id INTEGER,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          response_status INTEGER,
          response_time INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (api_key_id) REFERENCES api_keys (id) ON DELETE SET NULL
        )`,
        
        // User favorites table
        `CREATE TABLE IF NOT EXISTS user_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          quote_text TEXT NOT NULL,
          quote_author TEXT,
          quote_category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
      ];

      let completed = 0;
      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`Error creating table ${index + 1}:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === queries.length) {
              // Add migration for plan_expiry column
              this.db.run(`ALTER TABLE users ADD COLUMN plan_expiry DATETIME`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                  console.error('Error adding plan_expiry column:', err);
                }
                console.log('All database tables created successfully');
                resolve();
              });
            }
          }
        });
      });
    });
  }

  // Generate a secure API key
  generateApiKey() {
    // SECURITY: Use cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(32);
    return 'qapi_' + randomBytes.toString('hex');
  }

  // SECURITY: Rate limiting check
  checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [key, requests] of this.rateLimitMap.entries()) {
      const filteredRequests = requests.filter(time => time > windowStart);
      if (filteredRequests.length === 0) {
        this.rateLimitMap.delete(key);
      } else {
        this.rateLimitMap.set(key, filteredRequests);
      }
    }
    
    // Check current user's requests
    const userRequests = this.rateLimitMap.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    this.rateLimitMap.set(identifier, recentRequests);
    
    return true; // Within rate limit
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

  // SECURITY: Minute usage tracking methods
  async getMinuteUsageCount(userId, minuteTimestamp) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate input parameters
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      if (!minuteTimestamp || isNaN(minuteTimestamp) || minuteTimestamp < 0) {
        reject(new Error('Invalid minute timestamp'));
        return;
      }
      
      const query = `
        SELECT COUNT(*) as count
        FROM api_usage 
        WHERE user_id = ? AND strftime('%Y-%m-%d %H:%M', created_at) = strftime('%Y-%m-%d %H:%M', datetime(?, 'unixepoch'))
      `;
      
      this.db.get(query, [userIdInt, minuteTimestamp], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  async logMinuteUsage(userId, minuteTimestamp) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate input parameters
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      if (!minuteTimestamp || isNaN(minuteTimestamp) || minuteTimestamp < 0) {
        reject(new Error('Invalid minute timestamp'));
        return;
      }
      
      const query = `
        INSERT INTO api_usage (user_id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time, created_at)
        VALUES (?, NULL, 'minute_tracking', 'INTERNAL', '127.0.0.1', 'system', 200, 0, datetime(?, 'unixepoch'))
      `;
      
      this.db.run(query, [userIdInt, minuteTimestamp], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // User management methods
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const { email, name, provider, provider_id, plan = 'free' } = userData;
      
      // SECURITY: Validate input parameters
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        reject(new Error('Invalid email format'));
        return;
      }
      
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        reject(new Error('Invalid name (must be at least 2 characters)'));
        return;
      }
      
      if (!provider || typeof provider !== 'string' || !['google', 'github', 'local'].includes(provider)) {
        reject(new Error('Invalid provider'));
        return;
      }
      
      if (!provider_id || typeof provider_id !== 'string' || provider_id.trim().length < 1) {
        reject(new Error('Invalid provider_id'));
        return;
      }
      
      const allowedPlans = ['free', 'basic', 'pro'];
      if (!allowedPlans.includes(plan.toLowerCase())) {
        reject(new Error('Invalid plan'));
        return;
      }
      
      // Check if this is an admin user - don't generate API key automatically
      const isAdmin = email === this.ADMIN_EMAIL;
      const api_key = isAdmin ? null : this.generateApiKey();
      
      const query = `
        INSERT INTO users (email, name, provider, provider_id, plan, api_key)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [email, name, provider, provider_id, plan, api_key], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            email,
            name,
            provider,
            provider_id,
            plan,
            api_key,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  async findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate email format
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        reject(new Error('Invalid email format'));
        return;
      }
      
      const query = 'SELECT * FROM users WHERE email = ?';
      this.db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async findUserById(userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = 'SELECT * FROM users WHERE id = ?';
      this.db.get(query, [userIdInt], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async findUserByProvider(provider, provider_id) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate input parameters
      if (!provider || typeof provider !== 'string' || !['google', 'github', 'local'].includes(provider)) {
        reject(new Error('Invalid provider'));
        return;
      }
      
      if (!provider_id || typeof provider_id !== 'string' || provider_id.trim().length < 1) {
        reject(new Error('Invalid provider_id'));
        return;
      }
      
      const query = 'SELECT * FROM users WHERE provider = ? AND provider_id = ?';
      this.db.get(query, [provider, provider_id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }


  // API key management methods
  async createApiKey(userId, name = 'Default Key') {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate input parameters
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
        reject(new Error('Invalid API key name (must be 1-100 characters)'));
        return;
      }
      
      // Check if user is admin and already has a key
      this.isAdmin(userIdInt).then(isAdmin => {
        if (isAdmin) {
          // For admin users, check if they already have an active key
          this.hasApiKeys(userIdInt).then(hasKeys => {
            if (hasKeys) {
              reject(new Error('Admin users can only have one API key'));
              return;
            }
            
            // Create the key
            const key_value = this.generateApiKey();
            const query = `
              INSERT INTO api_keys (user_id, key_value, name)
              VALUES (?, ?, ?)
            `;
            
            this.db.run(query, [userIdInt, key_value, name], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({
                  id: this.lastID,
                  key_value,
                  name,
                  user_id: userIdInt,
                  created_at: new Date().toISOString()
                });
              }
            });
          }).catch(reject);
        } else {
          // For regular users, proceed normally
          const key_value = this.generateApiKey();
          const query = `
            INSERT INTO api_keys (user_id, key_value, name)
            VALUES (?, ?, ?)
          `;
          
          this.db.run(query, [userIdInt, key_value, name], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                key_value,
                name,
                user_id: userIdInt,
                created_at: new Date().toISOString()
              });
            }
          });
        }
      }).catch(reject);
    });
  }

  async createFirstAdminApiKey(userId) {
    return new Promise((resolve, reject) => {
      // Check if admin already has any API keys
      this.hasApiKeys(userId).then(hasKeys => {
        if (hasKeys) {
          // Admin already has keys, return success (not an error)
          console.log(`ℹ️  Admin user ${userId} already has API keys`);
          resolve({ message: 'Admin already has API keys' });
          return;
        }
        
        // Create the first API key for admin
        this.createApiKey(userId, 'Admin Default Key').then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  async validateApiKey(apiKey, clientIP = null) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate API key format
      if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('qapi_') || apiKey.length !== 69) {
        this.logSecurityEvent('Invalid API key format attempt', { apiKey: apiKey?.substring(0, 10) + '...', clientIP });
        reject(new Error('Invalid API key format'));
        return;
      }
      
      // SECURITY: Rate limiting check
      const rateLimitIdentifier = clientIP || apiKey;
      if (!this.checkRateLimit(rateLimitIdentifier)) {
        this.logSecurityEvent('Rate limit exceeded', { identifier: rateLimitIdentifier, clientIP });
        reject(new Error('Rate limit exceeded. Please try again later.'));
        return;
      }
      
      const query = `
        SELECT ak.*, u.email, u.name, u.plan, u.provider
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_value = ? AND ak.is_active = 1
      `;
      
      this.db.get(query, [apiKey], (err, row) => {
        if (err) {
          this.logSecurityEvent('Database error during API key validation', { error: err.message, clientIP });
          reject(err);
        } else if (!row) {
          this.logSecurityEvent('Invalid API key used', { apiKey: apiKey.substring(0, 10) + '...', clientIP });
          reject(new Error('Invalid API key'));
        } else {
          resolve(row);
        }
      });
    });
  }

  async getUserApiKeys(userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = 'SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC';
      this.db.all(query, [userIdInt], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async hasApiKeys(userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = 'SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = 1';
      this.db.get(query, [userIdInt], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  async revokeApiKey(keyId, userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate input parameters
      const keyIdInt = parseInt(keyId, 10);
      const userIdInt = parseInt(userId, 10);
      
      if (!keyId || isNaN(keyIdInt) || keyIdInt < 1) {
        reject(new Error('Invalid key ID'));
        return;
      }
      
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = 'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?';
      this.db.run(query, [keyIdInt, userIdInt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteApiKey(keyId, userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate input parameters
      const keyIdInt = parseInt(keyId, 10);
      const userIdInt = parseInt(userId, 10);
      
      if (!keyId || isNaN(keyIdInt) || keyIdInt < 1) {
        reject(new Error('Invalid key ID'));
        return;
      }
      
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = 'DELETE FROM api_keys WHERE id = ? AND user_id = ?';
      this.db.run(query, [keyIdInt, userIdInt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteAllApiKeysByEmail(email) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate email format
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        reject(new Error('Invalid email format'));
        return;
      }
      
      // First get the user ID by email
      const userQuery = 'SELECT id FROM users WHERE email = ?';
      this.db.get(userQuery, [email], (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('User not found'));
        } else {
          // Delete all API keys for this user
          const deleteQuery = 'DELETE FROM api_keys WHERE user_id = ?';
          this.db.run(deleteQuery, [user.id], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                deletedCount: this.changes,
                userId: user.id,
                email: email
              });
            }
          });
        }
      });
    });
  }

  // API usage tracking methods
  async logApiUsage(usageData) {
    return new Promise((resolve, reject) => {
      const { user_id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time } = usageData;
      
      // SECURITY: Validate input parameters
      const userIdInt = parseInt(user_id, 10);
      if (!user_id || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      if (api_key_id !== null && api_key_id !== undefined) {
        const apiKeyIdInt = parseInt(api_key_id, 10);
        if (isNaN(apiKeyIdInt) || apiKeyIdInt < 1) {
          reject(new Error('Invalid API key ID'));
          return;
        }
      }
      
      if (!endpoint || typeof endpoint !== 'string' || endpoint.trim().length < 1) {
        reject(new Error('Invalid endpoint'));
        return;
      }
      
      if (!method || typeof method !== 'string' || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
        reject(new Error('Invalid HTTP method'));
        return;
      }
      
      if (response_status && (isNaN(response_status) || response_status < 100 || response_status > 599)) {
        reject(new Error('Invalid response status'));
        return;
      }
      
      if (response_time && (isNaN(response_time) || response_time < 0)) {
        reject(new Error('Invalid response time'));
        return;
      }
      
      const query = `
        INSERT INTO api_usage (user_id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [userIdInt, api_key_id, endpoint, method.toUpperCase(), ip_address, user_agent, response_status, response_time], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getUserUsageStats(userId, days = 30) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate and sanitize input parameters
      const userIdInt = parseInt(userId, 10);
      const daysInt = parseInt(days, 10);
      
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
        reject(new Error('Invalid days parameter (must be between 1 and 365)'));
        return;
      }
      
      // SECURITY: Use parameterized query to prevent SQL injection
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_requests,
          COUNT(CASE WHEN response_status >= 400 THEN 1 END) as failed_requests,
          AVG(response_time) as avg_response_time
        FROM api_usage 
        WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      this.db.all(query, [userIdInt, daysInt], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getDailyUsageCount(userId, date = new Date().toISOString().split('T')[0]) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count
        FROM api_usage 
        WHERE user_id = ? AND DATE(created_at) = ?
      `;
      
      this.db.get(query, [userId, date], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  // User favorites methods
  async addFavorite(userId, quoteData) {
    return new Promise((resolve, reject) => {
      const { quote_text, quote_author, quote_category } = quoteData;
      
      // SECURITY: Validate input parameters
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      if (!quote_text || typeof quote_text !== 'string' || quote_text.trim().length < 1) {
        reject(new Error('Invalid quote text'));
        return;
      }
      
      if (quote_author && typeof quote_author !== 'string') {
        reject(new Error('Invalid quote author'));
        return;
      }
      
      if (quote_category && typeof quote_category !== 'string') {
        reject(new Error('Invalid quote category'));
        return;
      }
      
      const query = `
        INSERT INTO user_favorites (user_id, quote_text, quote_author, quote_category)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [userIdInt, quote_text.trim(), quote_author?.trim() || null, quote_category?.trim() || null], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getUserFavorites(userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = 'SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC';
      this.db.all(query, [userIdInt], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Admin management methods
  async makeUserAdmin(email) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate email format
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        reject(new Error('Invalid email format'));
        return;
      }
      
      // SECURITY: Only allow specific admin email
      if (email !== this.ADMIN_EMAIL) {
        this.logSecurityEvent('Unauthorized admin promotion attempt', { 
          attemptedEmail: email, 
          adminEmail: this.ADMIN_EMAIL 
        });
        reject(new Error('Unauthorized admin promotion attempt'));
        return;
      }
      
      const query = `
        UPDATE users 
        SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
        WHERE email = ?
      `;
      
      this.db.run(query, [email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async isAdmin(userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      const query = `SELECT role FROM users WHERE id = ?`;
      
      this.db.get(query, [userIdInt], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row && row.role === 'admin');
        }
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      // First get all users
      const userQuery = `
        SELECT u.id, u.email, u.name, u.plan, u.role, u.created_at, u.updated_at
        FROM users u
        ORDER BY u.created_at DESC
      `;
      
      this.db.all(userQuery, [], async (err, users) => {
        if (err) {
          reject(err);
        } else {
          try {
            // Get counts for each user separately to avoid cartesian product
            const usersWithCounts = await Promise.all(users.map(async (user) => {
              // Get API key count (only show for admins)
              const apiKeyCount = user.role === 'admin' ? await new Promise((resolve, reject) => {
                this.db.get(
                  'SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = 1',
                  [user.id],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                  }
                );
              }) : null;
              
              // Get total requests count
              const totalRequests = await new Promise((resolve, reject) => {
                this.db.get(
                  'SELECT COUNT(*) as count FROM api_usage WHERE user_id = ?',
                  [user.id],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                  }
                );
              });
              
              // Get today's requests count
              const todayRequests = await new Promise((resolve, reject) => {
                this.db.get(
                  'SELECT COUNT(*) as count FROM api_usage WHERE user_id = ? AND DATE(created_at) = DATE("now")',
                  [user.id],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                  }
                );
              });
              
              return {
                ...user,
                api_key_count: apiKeyCount,
                total_requests: totalRequests,
                today_requests: todayRequests
              };
            }));
            
            resolve(usersWithCounts);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  async updateUserPlan(userId, plan, expiryDate = null) {
    return new Promise((resolve, reject) => {
      // Convert userId to integer if it's a string
      const userIdInt = parseInt(userId, 10);
      
      // SECURITY: Validate user ID
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      // SECURITY: Validate plan
      const allowedPlans = ['free', 'basic', 'pro'];
      if (!plan || !allowedPlans.includes(plan.toLowerCase())) {
        reject(new Error('Invalid plan'));
        return;
      }
      
      // Prepare query based on whether expiry date is provided
      let query, params;
      if (expiryDate) {
        query = `
          UPDATE users 
          SET plan = ?, plan_expiry = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        params = [plan.toLowerCase(), expiryDate.toISOString(), userIdInt];
      } else {
        query = `
          UPDATE users 
          SET plan = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        params = [plan.toLowerCase(), userIdInt];
      }
      
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async getSystemStats() {
    return new Promise((resolve, reject) => {
      // Get user counts
      const userQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_users,
          COUNT(CASE WHEN plan = 'basic' THEN 1 END) as basic_users,
          COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_users
        FROM users
      `;
      
      this.db.get(userQuery, [], async (err, userStats) => {
        if (err) {
          reject(err);
        } else {
          try {
            // Get request counts separately
            const requestStats = await new Promise((resolve, reject) => {
              this.db.get(
                'SELECT COUNT(*) as total_requests, COUNT(CASE WHEN DATE(created_at) = DATE("now") THEN 1 END) as today_requests FROM api_usage',
                [],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            
            // Get active API key count
            const apiKeyStats = await new Promise((resolve, reject) => {
              this.db.get(
                'SELECT COUNT(*) as active_api_keys FROM api_keys WHERE is_active = 1',
                [],
                (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                }
              );
            });
            
            resolve({
              ...userStats,
              ...requestStats,
              ...apiKeyStats
            });
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  async getDailyUsageStats(days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as requests,
          COUNT(DISTINCT user_id) as unique_users
        FROM api_usage 
        WHERE created_at >= DATE('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async findUserById(userId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE id = ?`;
      
      this.db.get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async deactivateUserApiKeys(userId, excludeKeyId = null) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      let query, params;
      
      if (excludeKeyId) {
        // SECURITY: Validate exclude key ID
        const excludeKeyIdInt = parseInt(excludeKeyId, 10);
        if (isNaN(excludeKeyIdInt) || excludeKeyIdInt < 1) {
          reject(new Error('Invalid exclude key ID'));
          return;
        }
        
        query = `
          UPDATE api_keys 
          SET is_active = 0 
          WHERE user_id = ? AND is_active = 1 AND id != ?
        `;
        params = [userIdInt, excludeKeyIdInt];
      } else {
        query = `
          UPDATE api_keys 
          SET is_active = 0 
          WHERE user_id = ? AND is_active = 1
        `;
        params = [userIdInt];
      }
      
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Deactivated ${this.changes} API keys for user ${userIdInt}`);
          resolve(this.changes);
        }
      });
    });
  }

  async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      // SECURITY: Validate user ID
      const userIdInt = parseInt(userId, 10);
      if (!userId || isNaN(userIdInt) || userIdInt < 1) {
        reject(new Error('Invalid user ID'));
        return;
      }
      
      // Start a transaction to ensure all deletions succeed or none do
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Delete all API keys for this user
        this.db.run('DELETE FROM api_keys WHERE user_id = ?', [userIdInt], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }
        });
        
        // Delete the user
        this.db.run('DELETE FROM users WHERE id = ?', [userIdInt], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Commit the transaction
          this.db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`✅ Deleted user ${userIdInt} and all associated data`);
              resolve({ id: userIdInt, deleted: true });
            }
          });
        });
      });
    });
  }

  // Setup admin user
  async setupAdmin() {
    try {
      // Make admin email from environment variable an admin
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
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = new Database();
