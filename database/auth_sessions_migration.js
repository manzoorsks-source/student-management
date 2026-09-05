require('dotenv').config();
const { Client } = require('pg');

const rawConnectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
if (!rawConnectionString) {
  console.error('❌ ERROR: No database connection string found in environment.');
  process.exit(1);
}

const clean = rawConnectionString.split('?')[0];
const client = new Client({
  connectionString: clean,
  ssl: { rejectUnauthorized: false }
});

async function runSessionMigration() {
  console.log('🚀 Running auth_sessions table migration...');
  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        token VARCHAR(128) PRIMARY KEY,
        emp_id VARCHAR(50) NOT NULL,
        username VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        user_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(100),
        user_agent TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_username ON auth_sessions(username);
    `);

    console.log('✅ auth_sessions table and indexes created successfully in PostgreSQL!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSessionMigration();
