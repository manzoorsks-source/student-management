const { Client } = require('pg');
require('dotenv').config();

async function inspectAbsentees() {
  const client = new Client({
    connectionString: (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0],
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query('SELECT student_id, data FROM students');
  const allAbsentees = [];

  for (const r of res.rows) {
    const d = r.data || {};
    if (d.attendanceHistory) {
      for (const [dt, att] of Object.entries(d.attendanceHistory)) {
        if (att && att.status === 'Absent') {
          allAbsentees.push({ student_id: r.student_id, name: d.name, date: dt, reason: att.reason });
        }
      }
    }
  }

  console.log('--- ALL ABSENT RECORDS ACROSS ALL DATES IN STUDENTS TABLE ---');
  console.log(`Found ${allAbsentees.length} total absent records in database:`);
  console.log(JSON.stringify(allAbsentees, null, 2));

  const stateRes = await client.query("SELECT key, value FROM app_state WHERE key IN ('attendanceMap', 'teachers')");
  console.log('\n--- APP_STATE VALUES ---');
  stateRes.rows.forEach(row => {
    console.log(`Key: ${row.key}`);
    console.log(`Value:`, JSON.stringify(row.value, null, 2));
  });

  await client.end();
}

inspectAbsentees().catch(console.error);
