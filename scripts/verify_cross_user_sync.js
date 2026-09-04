require('dotenv').config();
const http = require('http');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const SERVER_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, SERVER_URL);
    const options = {
      hostname: urlObj.hostname,
      port: PORT,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 ST. VENUS HIGH SCHOOL - CROSS-USER SYNC TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  let testStudentId = 'STV-3527';

  // 1. Health Check
  try {
    const health = await makeRequest('/api/health');
    console.log(`[CHECK 1] Server & Aiven PostgreSQL Health: Status ${health.status}`);
    console.log(`          Database: ${health.data.databaseName || 'Connected'}, Students in DB: ${health.data.studentCount}`);
    if (health.status === 200 && health.data.studentCount > 0) {
      console.log('✅ Health Check PASSED\n');
      passed++;
    } else {
      console.error('❌ Health Check FAILED\n');
      failed++;
    }

    // Fetch first 10th class student dynamically
    const allStudentsRes = await makeRequest('/api/students?grade=10th');
    if (allStudentsRes.data?.data?.length > 0) {
      testStudentId = allStudentsRes.data.data[0].id;
      console.log(`📍 Testing with dynamic 10th Class student: ${allStudentsRes.data.data[0].name} (${testStudentId})`);
    }
  } catch (err) {
    console.error('❌ Health Check Error:', err.message);
    failed++;
  }

  // 2. Cross-User Test 1: Attendance Synchronization
  console.log('\n--- TEST 1: Cross-User Attendance Sync ---');
  console.log(`Simulation: Principal marks Student ${testStudentId} as Absent on 2026-09-04`);
  try {
    const targetDate = '2026-09-04';
    const attSaveRes = await makeRequest('/api/attendance', 'POST', {
      targetDate: targetDate,
      singleUpdate: {
        id: testStudentId,
        status: 'Absent',
        reason: 'Severe Viral Fever (Marked by Principal)'
      }
    });

    console.log('Principal Save Response:', attSaveRes.data.message || attSaveRes.data);

    // Testing User reads student from Aiven DB
    const studentRes = await makeRequest(`/api/students?id=${testStudentId}`);
    const student = studentRes.data?.data?.[0];
    const attHistoryEntry = student?.attendanceHistory?.[targetDate];

    console.log(`Testing User reads student ${testStudentId} attendance on ${targetDate}:`, attHistoryEntry);

    if (attHistoryEntry && attHistoryEntry.status === 'Absent' && attHistoryEntry.reason.includes('Viral Fever')) {
      console.log('✅ Test 1 PASSED: Principal Absent status immediately visible to Testing User via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 1 FAILED: Attendance status was not retrieved properly\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
    failed++;
  }

  // 3. Cross-User Test 2: Marks Synchronization
  console.log('--- TEST 2: Cross-User Marks Sync ---');
  console.log(`Simulation: Testing User enters 10th Class FA1 Marks for ${testStudentId} -> Principal views`);
  try {
    const examTerm = 'FA1';
    const fa1Marks = {
      Telugu: 19,
      Hindi: 18,
      English: 20,
      Maths: 19,
      Science: 19,
      Social: 18
    };

    // Testing User saves marks
    const marksRes = await makeRequest('/api/academic', 'POST', {
      student_id: testStudentId,
      term_name: examTerm,
      marks: fa1Marks
    });
    console.log('Testing User Save Marks Response:', marksRes.data.message || marksRes.data);

    // Principal User retrieves student data from Aiven DB
    const fetchRes = await makeRequest(`/api/students?id=${testStudentId}`);
    const student = fetchRes.data?.data?.[0];
    const termMarks = student?.termMarks?.[examTerm];

    console.log(`Principal User retrieved FA1 marks for ${student?.name} (${testStudentId}):`, termMarks);

    if (termMarks && Number(termMarks.Telugu) === 19 && Number(termMarks.English) === 20 && Number(termMarks.Maths) === 19) {
      console.log('✅ Test 2 PASSED: Testing User entered marks immediately visible to Principal via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 2 FAILED: Marks not synced correctly\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
    failed++;
  }

  // 4. Cross-User Test 3: Student Profile Updates
  console.log('--- TEST 3: Cross-User Student Profile Update ---');
  console.log(`Simulation: Principal updates student ${testStudentId} phone & address -> Testing User views`);
  try {
    const getRes = await makeRequest(`/api/students?id=${testStudentId}`);
    const originalStudent = getRes.data?.data?.[0];

    const updatedStudent = {
      ...originalStudent,
      id: testStudentId,
      phone: '9876543210',
      whatsappNo: '9876543210',
      address: 'Plot 45, Sector 9, Uppal, Central Database Verified'
    };

    const saveRes = await makeRequest('/api/students', 'POST', { student: updatedStudent });
    console.log('Principal Save Student Response:', saveRes.data.message || saveRes.data);

    // Testing User retrieves from Aiven DB
    const verifyRes = await makeRequest(`/api/students?id=${testStudentId}`);
    const retrievedStudent = verifyRes.data?.data?.[0];

    console.log(`Testing User sees phone: ${retrievedStudent?.phone}, address: ${retrievedStudent?.address}`);

    if (retrievedStudent?.phone === '9876543210' && retrievedStudent?.address.includes('Central Database Verified')) {
      console.log('✅ Test 3 PASSED: Student profile updates immediately visible across all users via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 3 FAILED: Profile update did not reflect\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err.message);
    failed++;
  }

  // 5. Cross-User Test 4: Fees Payment Sync
  console.log('--- TEST 4: Cross-User Fee Payment Sync ---');
  console.log(`Simulation: Accountant records Fee Payment for ${testStudentId} -> Principal views updated ledger`);
  try {
    const testReceipt = `STV/2026/TEST-${Date.now().toString().slice(-4)}`;
    
    const feeRes = await makeRequest('/api/fees', 'POST', {
      student_id: testStudentId,
      receipt_no: testReceipt,
      amount: 4000,
      mode: 'Online / UPI',
      note: 'Tuition Fee Term 1',
      date: '04-Sep-2026',
      paid_months: 2
    });
    console.log('Accountant Record Fee Response:', feeRes.data.message || feeRes.data);

    // Principal views fee payments from Aiven DB
    const verifyFee = await makeRequest(`/api/fees?student_id=${testStudentId}`);
    const paymentRows = verifyFee.data?.data || [];
    const matchedTx = paymentRows.find(p => p.receipt_no === testReceipt);

    console.log(`Principal User views fee payment ledger for ${testStudentId}:`, matchedTx);

    if (matchedTx && Number(matchedTx.paid_amount) >= 4000) {
      console.log('✅ Test 4 PASSED: Fee payment immediately recorded and visible to Principal via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 4 FAILED: Fee payment not found in central ledger\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err.message);
    failed++;
  }

  // 6. Cross-User Test 5: Teacher Roster & Global State Sync
  console.log('--- TEST 5: Cross-User Global App State Sync ---');
  console.log('Simulation: Admin updates Teachers roster in app_state -> Principal views');
  try {
    const curState = await makeRequest('/api/state');
    const teachers = curState.data?.data?.teachers || [];
    
    const testTeacherCode = `T-TEST-${Date.now().toString().slice(-4)}`;
    const updatedTeachers = [
      ...teachers,
      {
        id: testTeacherCode,
        teacherCode: testTeacherCode,
        name: 'DR. VENKATESHWARLU',
        subject: 'Physics & Chemistry',
        assignedClass: '10th Class',
        workload: '6 Periods/Day',
        phone: '9848022338',
        status: 'Active'
      }
    ];

    const stateSaveRes = await makeRequest('/api/state', 'POST', {
      key: 'teachers',
      value: updatedTeachers
    });
    console.log('Admin State Save Response:', stateSaveRes.data.message || stateSaveRes.data);

    // Principal retrieves state from Aiven DB
    const newStateRes = await makeRequest('/api/state');
    const newTeachers = newStateRes.data?.data?.teachers || [];
    const foundTeacher = newTeachers.find(t => t.teacherCode === testTeacherCode);

    console.log('Principal retrieved teacher:', foundTeacher);

    if (foundTeacher && foundTeacher.name === 'DR. VENKATESHWARLU') {
      console.log('✅ Test 5 PASSED: Global state (Teachers Roster) immediately synced across users via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 5 FAILED: Teacher roster update not found in central state\n');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err.message);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('🎉 ALL CROSS-USER SYNCHRONIZATION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
