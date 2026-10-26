const fs = require('fs');
const path = require('path');
const { getClient } = require('../api/dbConfig');

async function backup() {
  console.log('🔄 Connecting to Neon PostgreSQL DB to create full backup...');
  const client = getClient();
  await client.connect();

  // 1. Backup app_state
  const stateRes = await client.query('SELECT key, value, updated_at FROM app_state');
  const appStateBackup = {};
  stateRes.rows.forEach(r => {
    appStateBackup[r.key] = r.value;
  });

  // 2. Backup all students
  const studentsRes = await client.query('SELECT * FROM students ORDER BY student_id ASC');
  console.log(`📦 Fetched ${studentsRes.rows.length} students from DB.`);

  const backupData = {
    timestamp: new Date().toISOString(),
    totalStudents: studentsRes.rows.length,
    appState: appStateBackup,
    students: studentsRes.rows
  };

  const backupFile = path.join(__dirname, 'backup_students_marks.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✅ Backup successfully saved to ${backupFile} (${(fs.statSync(backupFile).size / (1024 * 1024)).toFixed(2)} MB)`);

  await client.end();
}

backup().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
