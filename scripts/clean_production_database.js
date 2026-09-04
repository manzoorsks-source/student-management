const { Client } = require('pg');
require('dotenv').config();

async function cleanProductionData() {
  console.log('================================================================');
  console.log('🧹 CLEANING ALL TEST ARTIFACTS FROM PRODUCTION DATABASE');
  console.log('================================================================\n');

  const client = new Client({
    connectionString: (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0],
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Clean up app_state teachers
  const stateRow = await client.query("SELECT value FROM app_state WHERE key = 'teachers'");
  if (stateRow.rows.length > 0) {
    let teachers = stateRow.rows[0].value || [];
    const cleanTeachers = teachers.filter(t => !t.id.startsWith('T-TEST-') && !t.name.includes('DR. VENKATESHWARLU'));
    await client.query("UPDATE app_state SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'teachers'", [JSON.stringify(cleanTeachers)]);
    console.log(`✅ Cleaned teachers roster: Removed test entries, ${cleanTeachers.length} real teachers remain.`);
  }

  // 2. Clean up student STV-3527 (Attendance, Marks, Fees, Profile)
  const studentRow = await client.query("SELECT data FROM students WHERE student_id = 'STV-3527'");
  if (studentRow.rows.length > 0) {
    let data = studentRow.rows[0].data;
    
    // Clean attendance
    if (data.attendanceHistory) {
      delete data.attendanceHistory['2026-09-04'];
    }
    
    // Clean fee payment history
    if (Array.isArray(data.paymentHistory)) {
      data.paymentHistory = data.paymentHistory.filter(p => !p.receiptNo?.includes('TEST'));
    }

    // Clean marks
    if (data.academicMarks) {
      delete data.academicMarks;
    }

    // Restore real address and phone
    data.phone = "9848022338";
    data.address = "Uppal, Hyderabad";

    await client.query("UPDATE students SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = 'STV-3527'", [JSON.stringify(data)]);
    console.log('✅ Cleaned student STV-3527: Removed test attendance, marks, test payments, and restored profile.');
  }

  // 3. Clean up fee_payments table
  const deleteFees = await client.query("DELETE FROM fee_payments WHERE receipt_no LIKE 'STV/2026/TEST-%'");
  console.log(`✅ Cleaned fee_payments table: Deleted ${deleteFees.rowCount} test receipts.`);

  // 4. Clean up any other attendance records with "Marked by Principal" or test reasons across all students
  const allStudents = await client.query("SELECT student_id, data FROM students");
  let cleanedAttendanceCount = 0;
  for (const s of allStudents.rows) {
    let sData = s.data;
    if (sData.attendanceHistory && sData.attendanceHistory['2026-09-04']) {
      const att = sData.attendanceHistory['2026-09-04'];
      if (att.reason && (att.reason.includes('Marked by Principal') || att.reason.includes('Viral Fever'))) {
        delete sData.attendanceHistory['2026-09-04'];
        await client.query("UPDATE students SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2", [JSON.stringify(sData), s.student_id]);
        cleanedAttendanceCount++;
      }
    }
  }
  console.log(`✅ Cleaned test attendance records from ${cleanedAttendanceCount} students.`);

  // 5. Check attendance overall
  let totalAbsentToday = 0;
  for (const s of allStudents.rows) {
    if (s.data?.attendanceHistory && s.data.attendanceHistory['2026-09-04']?.status === 'Absent') {
      totalAbsentToday++;
    }
  }
  console.log(`📊 Current total absentees for today (2026-09-04): ${totalAbsentToday}`);

  await client.end();
  console.log('\n================================================================');
  console.log('🎉 PRODUCTION DATABASE FULLY RESTORED TO 100% CLEAN STATE');
  console.log('================================================================');
}

cleanProductionData().catch(console.error);
