const { Client } = require('pg');

function getClient() {
  const connectionString = (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0];
  return new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = getClient();

  try {
    await client.connect();
    
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM students ORDER BY student_id ASC');
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    }

    if (req.method === 'POST') {
      const {
        student_id, roll_no, school_branch, student_name, gender, dob,
        class: studentClass, section, parent_name, relation, contact_phone, email, address
      } = req.body;

      const query = `
        INSERT INTO students (student_id, roll_no, school_branch, student_name, gender, dob, class, section, parent_name, relation, contact_phone, email, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (student_id) DO UPDATE SET
          roll_no = EXCLUDED.roll_no,
          school_branch = EXCLUDED.school_branch,
          student_name = EXCLUDED.student_name,
          gender = EXCLUDED.gender,
          dob = EXCLUDED.dob,
          class = EXCLUDED.class,
          section = EXCLUDED.section,
          parent_name = EXCLUDED.parent_name,
          relation = EXCLUDED.relation,
          contact_phone = EXCLUDED.contact_phone,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        student_id, roll_no, school_branch, student_name, gender, dob,
        studentClass, section, parent_name, relation, contact_phone, email, address
      ];

      const result = await client.query(query, values);
      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Database Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.end();
  }
};
