const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = (process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL || '').split('?')[0];

if (!connectionString) {
  console.error('\n❌ ERROR: No PostgreSQL Connection String provided in .env');
  process.exit(1);
}

async function syncCsvs() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // Academic CSV
  const acaRes = await client.query('SELECT student_id, roll_no, student_name, class_section, math_marks, science_marks, english_marks, social_marks, computer_marks, total_marks, percentage, grade, result, teacher_remarks FROM academic_progress ORDER BY id ASC');
  const acaHeader = 'Student ID,Roll No,Student Name,Class,Math (100),Science (100),English (100),Social (100),Computer (100),Total Marks (500),Percentage (%),Grade,Result,Teacher Remarks\n';
  const acaRows = acaRes.rows.map(r => `"${r.student_id}","${r.roll_no}","${r.student_name}","${r.class_section}","${r.math_marks}","${r.science_marks}","${r.english_marks}","${r.social_marks}","${r.computer_marks}","${r.total_marks}","${r.percentage}%","${r.grade}","${r.result}","${r.teacher_remarks}"`).join('\n');
  fs.writeFileSync(path.join(__dirname, '..', 'Academic_Progress_Cards.csv'), acaHeader + acaRows);

  // Fees CSV
  const feeRes = await client.query('SELECT student_id, student_name, class_section, total_fee, paid_amount, balance_due, fee_status, due_date, last_payment_mode FROM fee_payments ORDER BY id ASC');
  const feeHeader = 'Student ID,Student Name,Class & Sec,Total Fee (INR),Paid Amount (INR),Balance Due (INR),Fee Status,Due Date,Last Payment Mode\n';
  const feeRows = feeRes.rows.map(r => `"${r.student_id}","${r.student_name}","${r.class_section}","${r.total_fee}","${r.paid_amount}","${r.balance_due}","${r.fee_status}","${r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : ''}","${r.last_payment_mode}"`).join('\n');
  fs.writeFileSync(path.join(__dirname, '..', 'Fee_Payment_Tracker.csv'), feeHeader + feeRows);

  console.log('✅ Synchronized Academic_Progress_Cards.csv (' + acaRes.rows.length + ' rows)');
  console.log('✅ Synchronized Fee_Payment_Tracker.csv (' + feeRes.rows.length + ' rows)');

  await client.end();
}

syncCsvs().catch(console.error);
