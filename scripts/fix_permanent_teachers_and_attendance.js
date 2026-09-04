const { Client } = require('pg');
require('dotenv').config();

const CANONICAL_10_TEACHERS = [
  { id: 'T1', teacherCode: 'T1', name: 'K. SUNITHA', qualification: 'M.Sc, B.Ed', designation: 'Senior Teacher', workload: '5–6 Periods/Day', subject: 'Mathematics', assignedClass: '8th, 9th, 10th', phone: '9849011223', aadhaar: '4455 6677 8899', timing: '8:30 AM – 4:00 PM', salary: 32000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T2', teacherCode: 'T2', name: 'V. SRINIVAS RAO', qualification: 'M.Sc (Physics), B.Ed', designation: 'Senior Teacher', workload: '5–6 Periods/Day', subject: 'Physical Science', assignedClass: '9th, 10th Class', phone: '9849022334', aadhaar: '3344 5566 7788', timing: '8:30 AM – 4:00 PM', salary: 35000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T3', teacherCode: 'T3', name: 'P. RADHIKA', qualification: 'M.Sc (Botany), B.Ed', designation: 'Senior Teacher', workload: '5 Periods/Day', subject: 'Bio Science', assignedClass: '8th, 9th, 10th', phone: '9849033445', aadhaar: '2233 4455 6677', timing: '8:30 AM – 4:00 PM', salary: 32000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T4', teacherCode: 'T4', name: 'M. RAJESH KUMAR', qualification: 'M.A (English), B.Ed', designation: 'Senior Teacher', workload: '5–6 Periods/Day', subject: 'English', assignedClass: '6th, 7th, 8th, 9th, 10th', phone: '9849044556', aadhaar: '5566 7788 9900', timing: '8:30 AM – 4:00 PM', salary: 30000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T5', teacherCode: 'T5', name: 'T. LAKSHMI', qualification: 'M.A (Telugu), TPT', designation: 'Language Pandit', workload: '5–6 Periods/Day', subject: 'Telugu', assignedClass: '1st to 10th Class', phone: '9849055667', aadhaar: '6677 8899 0011', timing: '8:30 AM – 4:00 PM', salary: 28000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T6', teacherCode: 'T6', name: 'S. FARHANA BEGUM', qualification: 'M.A (Hindi), HPT', designation: 'Language Pandit', workload: '5–6 Periods/Day', subject: 'Hindi', assignedClass: '1st to 10th Class', phone: '9849066778', aadhaar: '7788 9900 1122', timing: '8:30 AM – 4:00 PM', salary: 28000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T7', teacherCode: 'T7', name: 'G. RAMESH', qualification: 'M.A (History), B.Ed', designation: 'Senior Teacher', workload: '5 Periods/Day', subject: 'Social Studies', assignedClass: '6th, 7th, 8th, 9th, 10th', phone: '9849077889', aadhaar: '8899 0011 2233', timing: '8:30 AM – 4:00 PM', salary: 29000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T8', teacherCode: 'T8', name: 'B. PRIYANKA', qualification: 'M.Sc, B.Ed', designation: 'Senior Faculty', workload: '5 Periods/Day', subject: 'Science & Mathematics', assignedClass: 'Primary & High School', phone: '9849088990', aadhaar: '9900 1122 3344', timing: '8:30 AM – 4:00 PM', salary: 30000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T9', teacherCode: 'T9', name: 'K. NAVEEN', qualification: 'MCA, B.Ed', designation: 'Computer Faculty & IT Incharge', workload: '5 Periods/Day', subject: 'Computer', assignedClass: '1st to 10th Class', phone: '9849099001', aadhaar: '1122 3344 5566', timing: '8:30 AM – 4:00 PM', salary: 28000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' },
  { id: 'T10', teacherCode: 'T10', name: 'D. SURESH', qualification: 'M.P.Ed', designation: 'Physical Education Teacher (PET)', workload: 'Daily Morning & Evening', subject: 'Physical Education & Games', assignedClass: 'All Classes', phone: '9849010012', aadhaar: '2233 4455 6678', timing: '7:45 AM – 4:30 PM', salary: 26000, status: 'Active', photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E' }
];

async function applyPermanentFix() {
  console.log('================================================================');
  console.log('🔧 APPLYING PERMANENT FIX: 10 CANONICAL TEACHERS & CLEAN ATTENDANCE');
  console.log('================================================================\n');

  const client = new Client({
    connectionString: (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0],
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Permanently set 10 Canonical Teachers in app_state
  await client.query(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES ('teachers', $1, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = CURRENT_TIMESTAMP
  `, [JSON.stringify(CANONICAL_10_TEACHERS)]);
  console.log(`✅ app_state.teachers locked to ${CANONICAL_10_TEACHERS.length} Canonical Faculty Teachers.`);

  // 2. Permanently reset attendanceMap to {} in app_state
  await client.query(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES ('attendanceMap', $1, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = CURRENT_TIMESTAMP
  `, [JSON.stringify({})]);
  console.log('✅ app_state.attendanceMap reset to {} (All students default to Present).');

  // 3. Clean any student attendance history
  const allStudents = await client.query('SELECT student_id, data FROM students');
  let cleaned = 0;
  for (const s of allStudents.rows) {
    let d = s.data || {};
    if (d.attendanceHistory && Object.keys(d.attendanceHistory).length > 0) {
      d.attendanceHistory = {};
      await client.query('UPDATE students SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2', [JSON.stringify(d), s.student_id]);
      cleaned++;
    }
  }
  console.log(`✅ Cleaned attendance histories from ${cleaned} student records.`);

  // 4. Verify Final State
  const stRes = await client.query("SELECT key, value FROM app_state WHERE key IN ('teachers', 'attendanceMap')");
  stRes.rows.forEach(r => {
    if (r.key === 'teachers') console.log(`📊 DB Faculty Teachers Count: ${r.value.length}`);
    if (r.key === 'attendanceMap') console.log(`📊 DB attendanceMap:`, JSON.stringify(r.value));
  });

  await client.end();
  console.log('\n================================================================');
  console.log('🎉 DATABASE SYNCHRONIZED AND LOCKED TO CANONICAL STATE');
  console.log('================================================================');
}

applyPermanentFix().catch(console.error);
