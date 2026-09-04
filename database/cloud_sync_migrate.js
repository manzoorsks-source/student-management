/**
 * Aiven PostgreSQL Cloud Database Sync & Migration Script
 * St. Venus High School Management System
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const rawConnectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
if (!rawConnectionString) {
  console.error('❌ ERROR: AIVEN_DATABASE_URL or DATABASE_URL not set in .env');
  process.exit(1);
}

const cleanConnectionString = rawConnectionString.split('?')[0];

function getClient() {
  return new Client({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false }
  });
}

// Extract RAW 756 Students from index.html to ensure 100% data fidelity
function extractSeedStudents() {
  try {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const match = htmlContent.match(/const GENERATE_RAW_STUDENTS\s*=\s*\(\)\s*=>\s*\(\s*(\[[\s\S]*?\])\s*\);/);
    if (match && match[1]) {
      const students = JSON.parse(match[1]);
      console.log(`📦 Extracted ${students.length} seed students from codebase.`);
      return students;
    }
  } catch (err) {
    console.warn('⚠️ Could not extract students from index.html:', err.message);
  }
  return [];
}

async function runMigration() {
  const client = getClient();
  console.log('🚀 Connecting to Aiven PostgreSQL Cloud Database...');

  try {
    await client.connect();
    console.log('✅ Connected successfully to Aiven PostgreSQL!');

    // 1. Create app_state table for synchronized system settings, users, teachers, notes, timetable, etc.
    console.log('📦 Ensuring "app_state" table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ "app_state" table verified.');

    // 2. Ensure students table has data JSONB and necessary columns
    console.log('📦 Updating "students" table schema in Aiven...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(50) PRIMARY KEY,
        admn_no VARCHAR(50),
        roll_no INT,
        student_name VARCHAR(255) NOT NULL,
        school_branch VARCHAR(255) DEFAULT 'ST. VENUS HIGH SCHOOL',
        class VARCHAR(50) NOT NULL,
        section VARCHAR(20) NOT NULL DEFAULT 'A',
        academic_year VARCHAR(50) DEFAULT '2026–2027',
        gender VARCHAR(50) DEFAULT 'Not Specified',
        dob VARCHAR(50),
        caste_religion VARCHAR(100),
        sub_caste VARCHAR(100),
        admission_date VARCHAR(50),
        mother_tongue VARCHAR(50),
        aadhar_number VARCHAR(50),
        pen_number VARCHAR(50),
        apaar_id VARCHAR(50),
        parent_name VARCHAR(255),
        father_name VARCHAR(255),
        mother_name VARCHAR(255),
        relation VARCHAR(50) DEFAULT 'Father',
        contact_phone VARCHAR(50),
        father_mobile VARCHAR(50),
        mother_mobile VARCHAR(50),
        whatsapp_no VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        monthly_fee NUMERIC(10,2) DEFAULT 0,
        admission_fee NUMERIC(10,2) DEFAULT 0,
        exam_fee NUMERIC(10,2) DEFAULT 0,
        paid_months INT DEFAULT 0,
        total_months INT DEFAULT 11,
        status VARCHAR(50) DEFAULT 'Active',
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add data column if it doesn't exist on older table
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'data') THEN
          ALTER TABLE students ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'monthly_fee') THEN
          ALTER TABLE students ADD COLUMN monthly_fee NUMERIC(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'admission_fee') THEN
          ALTER TABLE students ADD COLUMN admission_fee NUMERIC(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'exam_fee') THEN
          ALTER TABLE students ADD COLUMN exam_fee NUMERIC(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'paid_months') THEN
          ALTER TABLE students ADD COLUMN paid_months INT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'total_months') THEN
          ALTER TABLE students ADD COLUMN total_months INT DEFAULT 11;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'status') THEN
          ALTER TABLE students ADD COLUMN status VARCHAR(50) DEFAULT 'Active';
        END IF;
      END $$;
    `);
    console.log('✅ "students" table schema verified with JSONB support.');

    // 3. Ensure academic_progress and fee_payments tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_progress (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        roll_no INT,
        student_name VARCHAR(255) NOT NULL,
        class_section VARCHAR(50) NOT NULL,
        math_marks NUMERIC(5,2) DEFAULT 0,
        science_marks NUMERIC(5,2) DEFAULT 0,
        english_marks NUMERIC(5,2) DEFAULT 0,
        social_marks NUMERIC(5,2) DEFAULT 0,
        telugu_marks NUMERIC(5,2) DEFAULT 0,
        hindi_marks NUMERIC(5,2) DEFAULT 0,
        computer_marks NUMERIC(5,2) DEFAULT 0,
        total_marks NUMERIC(6,2) DEFAULT 0,
        percentage NUMERIC(5,2) DEFAULT 0,
        grade VARCHAR(20),
        result VARCHAR(50) DEFAULT 'PASSED',
        teacher_remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fee_payments (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        student_name VARCHAR(255) NOT NULL,
        class_section VARCHAR(50) NOT NULL,
        total_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        balance_due NUMERIC(10,2) NOT NULL DEFAULT 0,
        fee_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        due_date DATE,
        last_payment_mode VARCHAR(50),
        receipt_no VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ "academic_progress" and "fee_payments" tables verified.');

    // 4. Sync initial 756 students with full rich details
    const seedStudents = extractSeedStudents();
    if (seedStudents.length > 0) {
      console.log(`📥 Syncing ${seedStudents.length} students into Aiven PostgreSQL...`);
      
      let syncedCount = 0;
      await client.query('BEGIN');

      for (const s of seedStudents) {
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
            address = EXCLUDED.address,
            monthly_fee = EXCLUDED.monthly_fee,
            admission_fee = EXCLUDED.admission_fee,
            exam_fee = EXCLUDED.exam_fee,
            paid_months = EXCLUDED.paid_months,
            total_months = EXCLUDED.total_months,
            status = EXCLUDED.status,
            data = EXCLUDED.data,
            updated_at = CURRENT_TIMESTAMP;
        `;

        const values = [
          s.id,
          s.admnNo || s.id,
          parseInt(s.rollNo, 10) || 1,
          s.name,
          'ST. VENUS HIGH SCHOOL',
          s.grade || 'Nursery',
          s.section || 'A',
          '2026–2027',
          s.gender || 'Not Specified',
          s.dob || '',
          s.casteReligion || '',
          s.subCaste || '',
          s.admissionDate || '',
          s.motherTongue || 'TELUGU',
          s.studentAadhaar || '',
          s.penNo || '',
          s.apaarId || '',
          s.parentName || '',
          s.fatherName || '',
          s.motherName || '',
          s.parentRelation || 'Father',
          s.phone || '',
          s.phone || '',
          s.altPhone || '',
          s.whatsappNo || s.phone || '',
          s.email || `${(s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '.')}@stvenus.edu.in`,
          s.address || '',
          parseFloat(s.monthlyFee) || 0,
          parseFloat(s.admissionFee) || 0,
          parseFloat(s.examFee) || 0,
          parseInt(s.paidMonths, 10) || 0,
          parseInt(s.totalMonths, 10) || 11,
          s.status || 'Active',
          JSON.stringify(s)
        ];

        await client.query(query, values);
        syncedCount++;
      }

      await client.query('COMMIT');
      console.log(`✅ Successfully synced ${syncedCount} student records with full JSONB payload into Aiven PostgreSQL!`);
    }

    // Check count
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    console.log(`📊 Total students in Aiven Database: ${studentCount.rows[0].count}`);

    console.log('\n🎉 AIVEN POSTGRESQL DATABASE IS FULLY CONFIGURED & READY!\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration Error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
