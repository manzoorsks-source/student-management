const { Client } = require('pg');

function getClient() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

function parseStudentFromRow(row) {
  let studentObj = {};
  if (row.data) {
    if (typeof row.data === 'string') {
      try {
        studentObj = JSON.parse(row.data);
      } catch (e) {
        studentObj = {};
      }
    } else if (typeof row.data === 'object') {
      studentObj = { ...row.data };
    }
  }

  // Ensure relational fields are synchronized onto object
  studentObj.id = row.student_id || studentObj.id;
  studentObj.admnNo = row.admn_no || studentObj.admnNo || row.student_id;
  studentObj.rollNo = row.roll_no !== null && row.roll_no !== undefined ? String(row.roll_no) : (studentObj.rollNo || '1');
  studentObj.name = row.student_name || studentObj.name;
  studentObj.grade = row.class || studentObj.grade || 'Nursery';
  studentObj.section = row.section || studentObj.section || 'A';
  studentObj.gender = row.gender || studentObj.gender || 'Not Specified';
  studentObj.dob = row.dob || studentObj.dob || '';
  studentObj.casteReligion = row.caste_religion || studentObj.casteReligion || '';
  studentObj.subCaste = row.sub_caste || studentObj.subCaste || '';
  studentObj.admissionDate = row.admission_date || studentObj.admissionDate || '';
  studentObj.motherTongue = row.mother_tongue || studentObj.motherTongue || 'TELUGU';
  studentObj.studentAadhaar = row.aadhar_number || studentObj.studentAadhaar || '';
  studentObj.penNo = row.pen_number || studentObj.penNo || '';
  studentObj.apaarId = row.apaar_id || studentObj.apaarId || '';
  studentObj.parentName = row.parent_name || studentObj.parentName || '';
  studentObj.fatherName = row.father_name || studentObj.fatherName || '';
  studentObj.motherName = row.mother_name || studentObj.motherName || '';
  studentObj.parentRelation = row.relation || studentObj.parentRelation || 'Father';
  studentObj.phone = row.contact_phone || studentObj.phone || '';
  studentObj.altPhone = row.mother_mobile || studentObj.altPhone || '';
  studentObj.whatsappNo = row.whatsapp_no || studentObj.whatsappNo || studentObj.phone || '';
  studentObj.email = row.email || studentObj.email || '';
  studentObj.address = row.address || studentObj.address || '';
  studentObj.monthlyFee = row.monthly_fee !== null ? parseFloat(row.monthly_fee) : (parseFloat(studentObj.monthlyFee) || 0);
  studentObj.admissionFee = row.admission_fee !== null ? parseFloat(row.admission_fee) : (parseFloat(studentObj.admissionFee) || 0);
  studentObj.examFee = row.exam_fee !== null ? parseFloat(row.exam_fee) : (parseFloat(studentObj.examFee) || 0);
  studentObj.paidMonths = row.paid_months !== null ? parseInt(row.paid_months, 10) : (parseInt(studentObj.paidMonths, 10) || 0);
  studentObj.totalMonths = row.total_months !== null ? parseInt(row.total_months, 10) : (parseInt(studentObj.totalMonths, 10) || 11);
  studentObj.status = row.status || studentObj.status || 'Active';

  // Ensure default structures exist
  if (!studentObj.termMarks) {
    studentObj.termMarks = {
      '1st Term Exam': {},
      '2nd Term Exam': {},
      'Final Term Exam': {}
    };
  }
  if (!studentObj.paymentHistory) studentObj.paymentHistory = [];
  if (!studentObj.attendanceHistory) studentObj.attendanceHistory = {};

  return studentObj;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();
  try {
    await client.connect();

    // GET /api/students (or GET by query params)
    if (req.method === 'GET') {
      const { id, grade, section, search } = req.query || {};

      let sql = 'SELECT * FROM students WHERE 1=1';
      const params = [];

      if (id) {
        params.push(id);
        sql += ` AND student_id = $${params.length}`;
      }
      if (grade && grade !== 'all') {
        params.push(grade.toLowerCase());
        sql += ` AND LOWER(class) = $${params.length}`;
      }
      if (section && section !== 'all') {
        params.push(section.toUpperCase());
        sql += ` AND UPPER(section) = $${params.length}`;
      }
      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        sql += ` AND (LOWER(student_name) LIKE $${params.length} OR LOWER(student_id) LIKE $${params.length} OR LOWER(admn_no) LIKE $${params.length} OR contact_phone LIKE $${params.length})`;
      }

      sql += ' ORDER BY class ASC, section ASC, roll_no ASC, student_id ASC';

      const result = await client.query(sql, params);
      const students = result.rows.map(parseStudentFromRow);

      return res.status(200).json({
        success: true,
        count: students.length,
        data: students
      });
    }

    // POST /api/students (Single Upsert or Bulk)
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};

      // Handle Bulk Upsert
      if (Array.isArray(body.students)) {
        await client.query('BEGIN');
        for (const s of body.students) {
          await upsertStudent(client, s);
        }
        await client.query('COMMIT');
        return res.status(200).json({
          success: true,
          count: body.students.length,
          message: `${body.students.length} students synchronized successfully with Aiven PostgreSQL`
        });
      }

      // Handle Single Upsert
      const s = body.student || body;
      if (!s.id && !s.student_id) {
        return res.status(400).json({ success: false, error: 'Student ID (id or student_id) is required' });
      }

      const savedStudent = await upsertStudent(client, s);
      return res.status(200).json({
        success: true,
        data: savedStudent,
        message: `Student ${s.id || s.student_id} saved to Aiven PostgreSQL`
      });
    }

    // DELETE /api/students (by query id or body id)
    if (req.method === 'DELETE') {
      const studentId = (req.query && req.query.id) || (req.body && (req.body.id || req.body.student_id));
      if (!studentId) {
        return res.status(400).json({ success: false, error: 'Student ID is required for deletion' });
      }

      await client.query('DELETE FROM students WHERE student_id = $1', [studentId]);
      return res.status(200).json({
        success: true,
        message: `Student ${studentId} deleted from Aiven PostgreSQL`
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Students API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end().catch(() => {});
  }
};

async function upsertStudent(client, s) {
  const studentId = s.id || s.student_id;
  const admnNo = s.admnNo || s.admn_no || studentId;
  const rollNo = parseInt(s.rollNo || s.roll_no, 10) || 1;
  const name = s.name || s.student_name || 'Unknown Student';
  const grade = s.grade || s.class || 'Nursery';
  const section = s.section || 'A';
  const gender = s.gender || 'Not Specified';
  const dob = s.dob || '';
  const casteReligion = s.casteReligion || s.caste_religion || '';
  const subCaste = s.subCaste || s.sub_caste || '';
  const admissionDate = s.admissionDate || s.admission_date || '';
  const motherTongue = s.motherTongue || s.mother_tongue || 'TELUGU';
  const aadhaar = s.studentAadhaar || s.aadhar_number || '';
  const penNo = s.penNo || s.pen_number || '';
  const apaarId = s.apaarId || s.apaar_id || '';
  const parentName = s.parentName || s.parent_name || '';
  const fatherName = s.fatherName || s.father_name || '';
  const motherName = s.motherName || s.mother_name || '';
  const relation = s.parentRelation || s.relation || 'Father';
  const phone = s.phone || s.contact_phone || '';
  const altPhone = s.altPhone || s.mother_mobile || '';
  const whatsappNo = s.whatsappNo || s.whatsapp_no || phone || '';
  const email = s.email || '';
  const address = s.address || '';
  const monthlyFee = parseFloat(s.monthlyFee !== undefined ? s.monthlyFee : s.monthly_fee) || 0;
  const admissionFee = parseFloat(s.admissionFee !== undefined ? s.admissionFee : s.admission_fee) || 0;
  const examFee = parseFloat(s.examFee !== undefined ? s.examFee : s.exam_fee) || 0;
  const paidMonths = parseInt(s.paidMonths !== undefined ? s.paidMonths : s.paid_months, 10) || 0;
  const totalMonths = parseInt(s.totalMonths !== undefined ? s.totalMonths : s.total_months, 10) || 11;
  const status = s.status || 'Active';

  // Normalize full object to store in data JSONB
  const completeStudentObj = {
    ...s,
    id: studentId,
    admnNo,
    rollNo: String(rollNo),
    name,
    grade,
    section,
    gender,
    dob,
    casteReligion,
    subCaste,
    admissionDate,
    motherTongue,
    studentAadhaar: aadhaar,
    penNo,
    apaarId,
    parentName,
    fatherName,
    motherName,
    parentRelation: relation,
    phone,
    altPhone,
    whatsappNo,
    email,
    address,
    monthlyFee,
    admissionFee,
    examFee,
    paidMonths,
    totalMonths,
    status
  };

  const query = `
    INSERT INTO students (
      student_id, admn_no, roll_no, student_name, school_branch,
      class, section, academic_year, gender, dob,
      caste_religion, sub_caste, admission_date, mother_tongue,
      aadhar_number, pen_number, apaar_id, parent_name, father_name,
      mother_name, relation, contact_phone, father_mobile, mother_mobile,
      whatsapp_no, email, address, monthly_fee, admission_fee, exam_fee,
      paid_months, total_months, status, data, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24,
      $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, CURRENT_TIMESTAMP
    )
    ON CONFLICT (student_id) DO UPDATE SET
      admn_no = EXCLUDED.admn_no,
      roll_no = EXCLUDED.roll_no,
      student_name = EXCLUDED.student_name,
      class = EXCLUDED.class,
      section = EXCLUDED.section,
      gender = EXCLUDED.gender,
      dob = EXCLUDED.dob,
      caste_religion = EXCLUDED.caste_religion,
      sub_caste = EXCLUDED.sub_caste,
      admission_date = EXCLUDED.admission_date,
      mother_tongue = EXCLUDED.mother_tongue,
      aadhar_number = EXCLUDED.aadhar_number,
      pen_number = EXCLUDED.pen_number,
      apaar_id = EXCLUDED.apaar_id,
      parent_name = EXCLUDED.parent_name,
      father_name = EXCLUDED.father_name,
      mother_name = EXCLUDED.mother_name,
      relation = EXCLUDED.relation,
      contact_phone = EXCLUDED.contact_phone,
      father_mobile = EXCLUDED.father_mobile,
      mother_mobile = EXCLUDED.mother_mobile,
      whatsapp_no = EXCLUDED.whatsapp_no,
      email = EXCLUDED.email,
      address = EXCLUDED.address,
      monthly_fee = EXCLUDED.monthly_fee,
      admission_fee = EXCLUDED.admission_fee,
      exam_fee = EXCLUDED.exam_fee,
      paid_months = EXCLUDED.paid_months,
      total_months = EXCLUDED.total_months,
      status = EXCLUDED.status,
      data = EXCLUDED.data,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const values = [
    studentId, admnNo, rollNo, name, 'ST. VENUS HIGH SCHOOL',
    grade, section, '2026–2027', gender, dob,
    casteReligion, subCaste, admissionDate, motherTongue,
    aadhaar, penNo, apaarId, parentName, fatherName,
    motherName, relation, phone, phone, altPhone,
    whatsappNo, email, address, monthlyFee, admissionFee, examFee,
    paidMonths, totalMonths, status, JSON.stringify(completeStudentObj)
  ];

  const res = await client.query(query, values);
  return parseStudentFromRow(res.rows[0]);
}
