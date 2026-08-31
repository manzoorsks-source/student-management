-- ==========================================================
-- ST. VENUS HIGH SCHOOL - Initial Seed Data for Aiven PostgreSQL
-- ==========================================================

-- 1. Insert Master Students Data
INSERT INTO students (student_id, roll_no, school_branch, student_name, gender, dob, class, section, parent_name, relation, contact_phone, email, address)
VALUES
('STD-1001', 101, 'Apex International Academy', 'Aarav Sharma', 'Male', '2010-05-14', '10', 'A', 'Rajesh Sharma', 'Father', '+91 98765 43210', 'rajesh.sharma@example.com', '42 Park View Enclave, Block B'),
('STD-1002', 102, 'Apex International Academy', 'Ananya Patel', 'Female', '2010-08-22', '10', 'A', 'Suresh Patel', 'Father', '+91 98123 76543', 'suresh.p@example.com', '15 Sunrise Heights, MG Road'),
('STD-1003', 103, 'Apex International Academy', 'Rohan Verma', 'Male', '2010-12-03', '10', 'B', 'Meena Verma', 'Mother', '+91 97654 32109', 'meena.v@example.com', '88 Cyber City Apartments'),
('STD-1004', 201, 'St. Jude Public School', 'Diya Sengupta', 'Female', '2011-03-19', '9', 'A', 'Amit Sengupta', 'Father', '+91 99887 66554', 'amit.sengupta@example.com', '12 Lake View Villas'),
('STD-1005', 202, 'St. Jude Public School', 'Vihaan Reddy', 'Male', '2011-07-11', '9', 'A', 'Kavitha Reddy', 'Mother', '+91 98450 11223', 'kavitha.r@example.com', '77 Jubilee Hills, Lane 4'),
('STD-1006', 301, 'Greenwood High School', 'Kavya Nair', 'Female', '2012-01-30', '8', 'A', 'Prakash Nair', 'Father', '+91 97112 33445', 'prakash.nair@example.com', '304 Palm Grove Residency');

-- 2. Insert Academic Progress Cards
INSERT INTO academic_progress (student_id, roll_no, student_name, class_section, math_marks, science_marks, english_marks, social_marks, computer_marks, total_marks, percentage, grade, result, teacher_remarks)
VALUES
('STD-1001', 101, 'Aarav Sharma', '10-A', 95, 88, 92, 85, 98, 458, 91.6, 'A+', 'PASSED', 'Exemplary student. Shows great leadership.'),
('STD-1002', 102, 'Ananya Patel', '10-A', 82, 79, 88, 90, 94, 433, 86.6, 'A', 'PASSED', 'Consistent academic performance.'),
('STD-1003', 103, 'Rohan Verma', '10-B', 65, 70, 74, 68, 80, 357, 71.4, 'B', 'PASSED', 'Needs improvement in Mathematics.'),
('STD-1004', 201, 'Diya Sengupta', '9-A', 91, 94, 96, 89, 97, 467, 93.4, 'A+', 'PASSED', 'Outstanding student! Class topper.'),
('STD-1005', 202, 'Vihaan Reddy', '9-A', 58, 62, 68, 60, 72, 320, 64.0, 'C', 'PASSED', 'Requires additional support in Science.'),
('STD-1006', 301, 'Kavya Nair', '8-A', 88, 90, 85, 92, 90, 445, 89.0, 'A', 'PASSED', 'Great teamwork skills.');

-- 3. Insert Fee Payment Records
INSERT INTO fee_payments (student_id, student_name, class_section, total_fee, paid_amount, balance_due, fee_status, due_date, last_payment_mode)
VALUES
('STD-1001', 'Aarav Sharma', '10-A', 45000, 45000, 0, 'Paid', '2026-07-15', 'UPI'),
('STD-1002', 'Ananya Patel', '10-A', 45000, 25000, 20000, 'Pending', '2026-08-10', 'Bank Transfer'),
('STD-1003', 'Rohan Verma', '10-B', 45000, 10000, 35000, 'Overdue', '2026-06-30', 'Cash'),
('STD-1004', 'Diya Sengupta', '9-A', 40000, 40000, 0, 'Paid', '2026-07-01', 'Credit Card'),
('STD-1005', 'Vihaan Reddy', '9-A', 40000, 0, 40000, 'Overdue', '2026-06-15', 'Pending'),
('STD-1006', 'Kavya Nair', '8-A', 38000, 38000, 0, 'Paid', '2026-07-20', 'UPI');
