-- ==========================================================
-- ST. VENUS HIGH SCHOOL - PostgreSQL Database Schema for Aiven
-- ==========================================================

-- Drop tables if they exist (clean setup)
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS academic_progress CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- 1. Students Master Table
CREATE TABLE students (
    student_id VARCHAR(50) PRIMARY KEY,
    admn_no VARCHAR(50),
    roll_no INT,
    student_name VARCHAR(255) NOT NULL,
    school_branch VARCHAR(255) DEFAULT 'ST. VENUS HIGH SCHOOL',
    class VARCHAR(20) NOT NULL,
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    academic_year VARCHAR(20) DEFAULT '2026-2027',
    gender VARCHAR(20) DEFAULT 'Not Specified',
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Progress Cards Table
CREATE TABLE academic_progress (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    roll_no INT,
    student_name VARCHAR(255) NOT NULL,
    class_section VARCHAR(20) NOT NULL,
    math_marks NUMERIC(5,2) DEFAULT 0,
    science_marks NUMERIC(5,2) DEFAULT 0,
    english_marks NUMERIC(5,2) DEFAULT 0,
    social_marks NUMERIC(5,2) DEFAULT 0,
    computer_marks NUMERIC(5,2) DEFAULT 0,
    total_marks NUMERIC(6,2) DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    grade VARCHAR(10),
    result VARCHAR(20) DEFAULT 'PASSED',
    teacher_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fee Payment Tracker Table
CREATE TABLE fee_payments (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    class_section VARCHAR(20) NOT NULL,
    total_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(10,2) NOT NULL DEFAULT 0,
    fee_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    due_date DATE,
    last_payment_mode VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance querying
CREATE INDEX idx_students_class_section ON students(class, section);
CREATE INDEX idx_students_name ON students(student_name);
CREATE INDEX idx_students_admn ON students(admn_no);
CREATE INDEX idx_academic_student_id ON academic_progress(student_id);
CREATE INDEX idx_fees_student_id ON fee_payments(student_id);
CREATE INDEX idx_fees_status ON fee_payments(fee_status);
