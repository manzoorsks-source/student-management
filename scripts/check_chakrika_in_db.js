require('dotenv').config();
const { Client } = require('pg');

const cleanConnectionString = (process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL).split('?')[0];

const client = new Client({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkChakrika() {
  try {
    await client.connect();
    const res = await client.query("SELECT * FROM students WHERE student_name LIKE '%CHAKRIKA%' OR admn_no = '4190'");
    console.log(`Found ${res.rows.length} rows for CHAKRIKA:`);
    for (const r of res.rows) {
      console.log('ID:', r.student_id, 'Name:', r.student_name, 'Class:', r.class, 'Section:', r.section);
      console.log('Data JSONB:');
      const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      console.log('termMarks:', JSON.stringify(d?.termMarks, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkChakrika();
