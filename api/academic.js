const { Client } = require('pg');
const { requireAuth } = require('./authMiddleware');

if (!process.env.DATABASE_URL && !process.env.AIVEN_DATABASE_URL) {
  try { require('dotenv').config(); } catch (e) {}
}

const { getClient } = require('./dbConfig');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
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

    // GET /api/academic
    if (req.method === 'GET') {
      const { student_id } = req.query || {};

      if (dbConnected && client) {
        try {
          let sql = 'SELECT * FROM academic_progress';
          const params = [];
          if (student_id) {
            params.push(student_id);
            sql += ' WHERE student_id = $1';
          }
          sql += ' ORDER BY id ASC';

          const result = await client.query(sql, params);
          return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
          });
        } catch (dbErr) {}
      }

      // Return marks from in-memory demo students
      const marksList = [];
      if (global.__DEMO_STUDENTS__) {
        global.__DEMO_STUDENTS__.forEach(s => {
          if (!student_id || s.id === student_id) {
            if (s.termMarks) {
              marksList.push({
                student_id: s.id,
                student_name: s.name,
                class_section: `${s.grade}-${s.section}`,
                marks: s.termMarks
              });
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        count: marksList.length,
        data: marksList
      });
    }

    // POST /api/academic
    if (req.method === 'POST' || req.method === 'PUT') {
      const { student_id, term_name, marks, student } = req.body || {};

      const targetId = student_id || (student && student.id);
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'student_id is required' });
      }

      // Update in-memory student
      if (global.__DEMO_STUDENTS__) {
        const s = global.__DEMO_STUDENTS__.find(item => item.id === targetId);
        if (s) {
          if (!s.termMarks) s.termMarks = {};
          if (term_name && marks) s.termMarks[term_name] = marks;
          else if (student && student.termMarks) s.termMarks = student.termMarks;
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
            if (!studentObj.termMarks) studentObj.termMarks = {};
            if (term_name && marks) studentObj.termMarks[term_name] = marks;
            else if (student && student.termMarks) studentObj.termMarks = student.termMarks;

            await client.query(`
              UPDATE students
              SET data = $1, updated_at = CURRENT_TIMESTAMP
              WHERE student_id = $2
            `, [JSON.stringify(studentObj), targetId]);
          }
        } catch (dbErr) {}
      }

      return res.status(200).json({
        success: true,
        message: `Marks recorded successfully for ${targetId}`
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Academic API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client && dbConnected) {
      await client.end().catch(() => {});
    }
  }
};
