/**
 * Aiven PostgreSQL Migration Script for St. Venus High School Management System
 * Usage: node database/migrate.js "postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require"
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Read connection string from argument or environment variable
let rawConnectionString = process.argv[2] || process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('\n❌ ERROR: No PostgreSQL Connection String provided.');
  console.error('Usage: node database/migrate.js "<YOUR_AIVEN_DATABASE_URI>"');
  process.exit(1);
}

// Remove query parameters like ?sslmode=require to allow custom SSL object
const cleanConnectionString = rawConnectionString.split('?')[0];

async function runMigration() {
  console.log('\n🚀 Connecting to Aiven PostgreSQL Database...');
  
  const client = new Client({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Aiven PostgreSQL!');

    // Read Schema and Seed SQL files
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

    console.log('\n📦 Creating tables (students, academic_progress, fee_payments)...');
    await client.query(schemaSql);
    console.log('✅ Schema created successfully.');

    console.log('\n📥 Seeding initial data from school management CSV records...');
    await client.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    // Verification Query
    console.log('\n🔍 Verifying migrated data in Aiven PostgreSQL:');
    const studentsRes = await client.query('SELECT COUNT(*) FROM students');
    const academicRes = await client.query('SELECT COUNT(*) FROM academic_progress');
    const feeRes = await client.query('SELECT COUNT(*) FROM fee_payments');

    console.log(`   - 📋 Students Master Records: ${studentsRes.rows[0].count} rows`);
    console.log(`   - 📊 Academic Progress Records: ${academicRes.rows[0].count} rows`);
    console.log(`   - 💳 Fee Payment Records: ${feeRes.rows[0].count} rows`);

    // Fetch sample preview
    console.log('\n👀 Sample Students in Database:');
    const sampleRes = await client.query('SELECT student_id, student_name, class, section, contact_phone FROM students LIMIT 3');
    console.table(sampleRes.rows);

    console.log('🎉 ALL DATA MIGRATED SUCCESSFULLY TO AIVEN POSTGRESQL!\n');

  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
