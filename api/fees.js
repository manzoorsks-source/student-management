const { Client } = require('pg');

function getClient() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  try {
    await client.connect();

    // GET /api/fees
    if (req.method === 'GET') {
      const { student_id } = req.query || {};
      let sql = 'SELECT * FROM fee_payments';
      const params = [];
      if (student_id) {
        params.push(student_id);
        sql += ' WHERE student_id = $1';
      }
      sql += ' ORDER BY id DESC';

      const result = await client.query(sql, params);
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    }

    // POST /api/fees - Records fee payment transaction
    if (req.method === 'POST') {
      const {
        student_id, receipt_no, amount, mode, note, date,
        paid_months, admission_fee_paid, exam_fee_paid,
        student
      } = req.body || {};

      const targetId = student_id || (student && student.id);
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'student_id is required' });
      }

      // Fetch student from database
      const studentRes = await client.query('SELECT * FROM students WHERE student_id = $1', [targetId]);
      if (studentRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Student ${targetId} not found` });
      }

      const row = studentRes.rows[0];
      let studentObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});

      // If full student object passed from frontend after payment
      if (student) {
        studentObj = { ...studentObj, ...student };
      } else {
        // Construct transaction entry
        const paymentEntry = {
          id: Date.now(),
          receiptNo: receipt_no || `REC-${Date.now().toString().slice(-6)}`,
          amount: parseFloat(amount) || 0,
          date: date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          mode: mode || 'Cash',
          note: note || 'Tuition Fee Payment',
          paidMonths: parseInt(paid_months, 10) || studentObj.paidMonths || 0
        };

        if (!studentObj.paymentHistory) studentObj.paymentHistory = [];
        studentObj.paymentHistory.push(paymentEntry);

        if (paid_months !== undefined) studentObj.paidMonths = parseInt(paid_months, 10);
        if (admission_fee_paid !== undefined) studentObj.admissionFeePaid = !!admission_fee_paid;
        if (exam_fee_paid !== undefined) studentObj.examFeePaid = !!exam_fee_paid;
      }

      // Update student in database
      await client.query(`
        UPDATE students
        SET 
          paid_months = $1,
          admission_fee = $2,
          exam_fee = $3,
          data = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE student_id = $5
      `, [
        studentObj.paidMonths || 0,
        studentObj.admissionFee || 0,
        studentObj.examFee || 0,
        JSON.stringify(studentObj),
        targetId
      ]);

      // Calculate fee totals for fee_payments ledger table
      const monthlyRate = parseFloat(studentObj.monthlyFee) || 2000;
      const totalMonths = parseInt(studentObj.totalMonths, 10) || 11;
      const totalTuition = monthlyRate * totalMonths;
      const admFee = studentObj.admissionFeePaid ? 0 : (parseFloat(studentObj.admissionFee) || 0);
      const exFee = studentObj.examFeePaid ? 0 : (parseFloat(studentObj.examFee) || 0);
      const grandTotalFee = totalTuition + (parseFloat(studentObj.admissionFee) || 0) + (parseFloat(studentObj.examFee) || 0);
      
      let totalPaidAmount = 0;
      if (Array.isArray(studentObj.paymentHistory)) {
        totalPaidAmount = studentObj.paymentHistory.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      }
      const balanceDue = Math.max(0, grandTotalFee - totalPaidAmount);
      const feeStatus = balanceDue <= 0 ? 'Paid' : (totalPaidAmount > 0 ? 'Partial' : 'Pending');

      const lastPayment = studentObj.paymentHistory?.[studentObj.paymentHistory.length - 1];

      await client.query(`
        INSERT INTO fee_payments (
          student_id, student_name, class_section, total_fee,
          paid_amount, balance_due, fee_status, last_payment_mode,
          receipt_no, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, CURRENT_TIMESTAMP
        )
      `, [
        targetId,
        studentObj.name || row.student_name,
        `${studentObj.grade || row.class}-${studentObj.section || row.section}`,
        grandTotalFee,
        totalPaidAmount,
        balanceDue,
        feeStatus,
        lastPayment?.mode || mode || 'Cash',
        lastPayment?.receiptNo || receipt_no || `REC-${Date.now().toString().slice(-6)}`
      ]);

      return res.status(200).json({
        success: true,
        message: `Fee payment recorded for ${targetId} in Aiven PostgreSQL`,
        student: studentObj,
        balanceDue,
        feeStatus
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Fees API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};
