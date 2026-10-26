const { getClient } = require('../api/dbConfig');

async function main() {
  const client = getClient();
  await client.connect();
  
  // 1. Check classSubjectsMap in DB
  const subRes = await client.query("SELECT value FROM app_state WHERE key = 'classSubjectsMap'");
  if (subRes.rows.length > 0) {
    console.log('=== DB classSubjectsMap ===');
    const map = subRes.rows[0].value;
    for (const [cls, list] of Object.entries(map)) {
      console.log(cls + ':', list.map(s => s.name).join(', '));
    }
  } else {
    console.log('No classSubjectsMap found in DB');
  }

  // 2. Check students who have FA1 or FA2 marks in DB
  console.log('\n=== Checking Students with FA1 or FA2 marks in DB ===');
  const stuRes = await client.query("SELECT student_id, student_name, class, section, data FROM students");
  let fa1Count = 0;
  let fa2Count = 0;
  const samples = [];
  
  for (const row of stuRes.rows) {
    let d = row.data;
    if (typeof d === 'string') {
      try { d = JSON.parse(d); } catch(e){}
    }
    const tm = d && d.termMarks;
    if (tm) {
      if (tm.FA1 || tm['FA-1']) {
        fa1Count++;
        if (samples.length < 5) samples.push({ id: row.student_id, name: row.student_name, class: row.class, sec: row.section, exam: 'FA1', marks: tm.FA1 || tm['FA-1'] });
      }
      if (tm.FA2 || tm['FA-2']) {
        fa2Count++;
        if (samples.length < 10) samples.push({ id: row.student_id, name: row.student_name, class: row.class, sec: row.section, exam: 'FA2', marks: tm.FA2 || tm['FA-2'] });
      }
    }
  }

  console.log(`Total students with FA1 marks in DB: ${fa1Count}`);
  console.log(`Total students with FA2 marks in DB: ${fa2Count}`);
  console.log('Sample entered marks in DB:');
  console.dir(samples, { depth: null });

  await client.end();
}

main().catch(console.error);
