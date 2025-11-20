/**
 * Database Adapter
 * Automatically selects the appropriate database based on environment
 * - PostgreSQL for production (Vercel)
 * - SQLite for local development
 */

const usePostgres = process.env.POSTGRES_URL || 
                    (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

if (usePostgres) {
  console.log('🔄 Using PostgreSQL database adapter');
  module.exports = require('./database-postgres');
} else {
  console.log('🔄 Using SQLite database adapter');
  module.exports = require('./database');
}

