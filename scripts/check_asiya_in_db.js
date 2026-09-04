require('dotenv').config();
const { Client } = require('pg');

const cleanConnectionString = (process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL).split('?')[0];

const client = new Client({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkAsiya() {
  try {
    await client.connect();
    const res = await client.query("SELECT student_id, student_name, class, section, data FROM students WHERE student_name LIKE '%ASIYA%' OR student_id = 'STV-3592'");
    console.log(`Found ${res.rows.length} rows for ASIYA:`);
    for (const r of res.rows) {
      console.log('ID:', r.student_id, 'Name:', r.student_name, 'Class:', r.class, 'Section:', r.section);
      const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      console.log('termMarks in Aiven DB:');
      console.log(JSON.stringify(d?.termMarks, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkAsiya();
