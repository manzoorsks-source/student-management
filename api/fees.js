const { Client } = require('pg');
const { requireAuth } = require('./authMiddleware');

global.__DEMO_FEES__ = global.__DEMO_FEES__ || [];

if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client = null;
  let dbConnected = false;

  try {
    client = getClient();
    if (client) {
      await client.connect();
      dbConnected = true;
    }
  } catch (e) {
    client = null;
    dbConnected = false;
  }

  try {
    const authUser = await requireAuth(req, res, dbConnected ? client : null);
    if (!authUser) return;

    // GET /api/fees
    if (req.method === 'GET') {
      const { student_id } = req.query || {};

      if (dbConnected && client) {
        try {
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
        } catch (dbErr) {}
      }

      let fees = [...global.__DEMO_FEES__];
      if (student_id) {
        fees = fees.filter(f => f.student_id === student_id);
      }
      return res.status(200).json({
        success: true,
        count: fees.length,
        data: fees
      });
    }

    // POST /api/fees
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

      const receiptRecord = {
        student_id: targetId,
        receipt_no: receipt_no || `REC-${Date.now().toString().slice(-6)}`,
        amount: parseFloat(amount) || 0,
        mode: mode || 'Cash',
        note: note || '',
        date: date || new Date().toISOString()
      };
      global.__DEMO_FEES__.unshift(receiptRecord);

      // Also update in-memory student
      if (global.__DEMO_STUDENTS__) {
        const s = global.__DEMO_STUDENTS__.find(item => item.id === targetId);
        if (s) {
          if (!s.paymentHistory) s.paymentHistory = [];
          s.paymentHistory.push(receiptRecord);
          if (paid_months !== undefined) s.paidMonths = parseInt(paid_months, 10);
          if (admission_fee_paid !== undefined) s.admissionFeePaid = !!admission_fee_paid;
          if (exam_fee_paid !== undefined) s.examFeePaid = !!exam_fee_paid;
        }
      }

      if (dbConnected && client) {
        try {
          const studentRes = await client.query('SELECT * FROM students WHERE student_id = $1', [targetId]);
          if (studentRes.rows.length > 0) {
            const row = studentRes.rows[0];
            let studentObj = {};
            if (row.data) {
              studentObj = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            }
            if (!studentObj.paymentHistory) studentObj.paymentHistory = [];
            studentObj.paymentHistory.push(receiptRecord);
            if (paid_months !== undefined) studentObj.paidMonths = parseInt(paid_months, 10);
            if (admission_fee_paid !== undefined) studentObj.admissionFeePaid = !!admission_fee_paid;
            if (exam_fee_paid !== undefined) studentObj.examFeePaid = !!exam_fee_paid;

            await client.query(`
              UPDATE students
              SET data = $1,
                  paid_months = $2,
                  admission_fee = $3,
                  exam_fee = $4,
                  updated_at = CURRENT_TIMESTAMP
              WHERE student_id = $5
            `, [
              JSON.stringify(studentObj),
              studentObj.paidMonths || 0,
              studentObj.admissionFee || 0,
              studentObj.examFee || 0,
              targetId
            ]);
          }
        } catch (dbErr) {}
      }

      return res.status(200).json({
        success: true,
        message: `Fee payment recorded successfully for ${targetId}`,
        receipt: receiptRecord
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Fees API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client && dbConnected) {
      await client.end().catch(() => {});
    }
  }
};
