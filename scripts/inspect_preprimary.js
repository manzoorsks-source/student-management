const { getClient } = require('../api/dbConfig');

async function main() {
  const client = getClient();
  await client.connect();
  
  for (const cls of ['Nursery', 'UKG', '1st Class', '5th Class']) {
    const res = await client.query("SELECT student_id, student_name, class, data FROM students WHERE class = $1", [cls]);
    const withFA1 = res.rows.filter(r => {
      const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      return d && d.termMarks && d.termMarks.FA1 && Object.keys(d.termMarks.FA1).length > 0;
    });
    console.log(`\n=== ${cls} (Total: ${res.rows.length}, with FA1: ${withFA1.length}) ===`);
    if (withFA1.length > 0) {
      const d = typeof withFA1[0].data === 'string' ? JSON.parse(withFA1[0].data) : withFA1[0].data;
      console.log('Sample FA1 keys for', withFA1[0].student_name, ':', Object.keys(d.termMarks.FA1));
      console.log('Sample FA1 values:', d.termMarks.FA1);
      if (d.termMarks.SA1) {
        console.log('Sample SA1 values:', d.termMarks.SA1);
      }
    }
  }

  await client.end();
}

main().catch(console.error);
