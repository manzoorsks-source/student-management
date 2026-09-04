require('dotenv').config();
const { Client } = require('pg');

const rawConnectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
const clean = rawConnectionString.split('?')[0];
const client = new Client({
  connectionString: clean,
  ssl: { rejectUnauthorized: false }
});

async function inspectAivenData() {
  try {
    await client.connect();
    
    console.log('--- SAMPLE STUDENT FROM AIVEN ---');
    const s = await client.query('SELECT * FROM students LIMIT 1');
    console.log(JSON.stringify(s.rows[0], null, 2));

    console.log('--- SAMPLE ACADEMIC PROGRESS FROM AIVEN ---');
    const a = await client.query('SELECT * FROM academic_progress LIMIT 1');
    console.log(JSON.stringify(a.rows[0], null, 2));

    console.log('--- SAMPLE FEE PAYMENT FROM AIVEN ---');
    const f = await client.query('SELECT * FROM fee_payments LIMIT 1');
    console.log(JSON.stringify(f.rows[0], null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectAivenData();
