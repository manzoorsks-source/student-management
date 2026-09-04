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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  try {
    await client.connect();

    // GET /api/academic
    if (req.method === 'GET') {
      const { student_id } = req.query || {};
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
    }

    // POST /api/academic - Updates student term marks and academic progress
    if (req.method === 'POST' || req.method === 'PUT') {
      const { student_id, term_name, marks, student } = req.body || {};

      if (!student_id && (!student || !student.id)) {
        return res.status(400).json({ success: false, error: 'student_id is required' });
      }

      const targetId = student_id || student.id;

      // Fetch existing student record
      const studentRes = await client.query('SELECT * FROM students WHERE student_id = $1', [targetId]);
      if (studentRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Student ${targetId} not found` });
      }

      const row = studentRes.rows[0];
      let studentObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});

      // If full student object passed
      if (student && student.termMarks) {
        studentObj.termMarks = student.termMarks;
      } else if (term_name && marks) {
        if (!studentObj.termMarks) studentObj.termMarks = {};
        studentObj.termMarks[term_name] = {
          ...(studentObj.termMarks[term_name] || {}),
          ...marks
        };
      }

      // Update student data in students table
      await client.query(`
        UPDATE students
        SET data = $1, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = $2
      `, [JSON.stringify(studentObj), targetId]);

      // Calculate totals for academic_progress table
      const termToSync = term_name || 'Final Term Exam';
      const termScores = studentObj.termMarks?.[termToSync] || {};
      const math = parseFloat(termScores['Maths'] || termScores['Math'] || 0) || 0;
      const science = parseFloat(termScores['Science'] || termScores['EVS'] || 0) || 0;
      const english = parseFloat(termScores['English'] || 0) || 0;
      const social = parseFloat(termScores['Social'] || 0) || 0;
      const telugu = parseFloat(termScores['Telugu'] || 0) || 0;
      const hindi = parseFloat(termScores['Hindi'] || 0) || 0;
      const computer = parseFloat(termScores['Computers'] || termScores['Computer'] || 0) || 0;
      const total = math + science + english + social + telugu + hindi + computer;
      const subjectCount = Object.keys(termScores).filter(k => termScores[k] > 0).length || 6;
      const percentage = subjectCount > 0 ? parseFloat((total / subjectCount).toFixed(2)) : 0;

      let grade = 'A+';
      if (percentage < 35) grade = 'F (Fail)';
      else if (percentage < 50) grade = 'C';
      else if (percentage < 60) grade = 'B';
      else if (percentage < 75) grade = 'B+';
      else if (percentage < 90) grade = 'A';

      await client.query(`
        INSERT INTO academic_progress (
          student_id, roll_no, student_name, class_section,
          math_marks, science_marks, english_marks, social_marks,
          telugu_marks, hindi_marks, computer_marks,
          total_marks, percentage, grade, result, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, CURRENT_TIMESTAMP
        )
      `, [
        targetId, row.roll_no || 1, row.student_name, `${row.class}-${row.section}`,
        math, science, english, social,
        telugu, hindi, computer,
        total, percentage, grade, percentage >= 35 ? 'PASSED' : 'FAILED'
      ]);

      return res.status(200).json({
        success: true,
        message: `Academic marks updated for ${targetId} in Aiven PostgreSQL`,
        student: studentObj
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Academic API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};
