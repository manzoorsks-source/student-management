const { Client } = require('pg');

// Active Neon Serverless PostgreSQL Database (Free Tier - Connection Pooled for Serverless / Vercel)
const NEON_DEFAULT_URL = 'postgresql://neondb_owner:npg_3KNqCFdAocp0@ep-bold-shadow-b4mjmqf1-pooler.c-6.us-east-2.aws.neon.tech:5432/neondb?sslmode=require';

function getConnectionString() {
  const envUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '';
  // If no DB URL or if pointing to the deprecated/shutdown Aiven instance, route directly to Neon Free DB
  if (!envUrl || envUrl.includes('aivencloud.com')) {
    return NEON_DEFAULT_URL;
  }
  return envUrl;
}

function getClient() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });
}

module.exports = {
  getConnectionString,
  getClient,
  NEON_DEFAULT_URL
};
