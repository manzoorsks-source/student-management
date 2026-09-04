require('dotenv').config();
const { Client } = require('pg');

const rawConnectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
console.log('Database URL configured:', !!rawConnectionString);

if (!rawConnectionString) {
  console.log('No DB url in .env');
  process.exit(1);
}

const clean = rawConnectionString.split('?')[0];
const client = new Client({
  connectionString: clean,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await client.connect();
    console.log('✅ Connected to Aiven PostgreSQL successfully!');
    
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Public tables:', tables.rows.map(r => r.table_name));

    for (const row of tables.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`Table ${row.table_name} has ${countRes.rows[0].count} rows`);
    }

    const students = await client.query("SELECT student_id, student_name, class, section, updated_at FROM students ORDER BY student_id ASC LIMIT 5");
    console.log('First 5 students in Aiven:');
    console.table(students.rows);

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

test();
