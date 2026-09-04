require('dotenv').config();
const { Client } = require('pg');

const rawConnectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
const clean = rawConnectionString.split('?')[0];
const client = new Client({
  connectionString: clean,
  ssl: { rejectUnauthorized: false }
});

async function inspectColumns() {
  try {
    await client.connect();
    const cols = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    const tables = {};
    for (const r of cols.rows) {
      if (!tables[r.table_name]) tables[r.table_name] = [];
      tables[r.table_name].push(`${r.column_name} (${r.data_type})`);
    }

    console.log(JSON.stringify(tables, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectColumns();
