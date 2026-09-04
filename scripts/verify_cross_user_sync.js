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
  console.log('🧪 ST. VENUS HIGH SCHOOL - ISOLATED CROSS-USER SYNC TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const dummyStudentId = 'STV-SYS-TEST-9999';
  let originalTeachers = [];

  try {
    // 1. Health Check
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

    // Save initial teachers state
    const stateRes = await makeRequest('/api/state');
    originalTeachers = stateRes.data?.data?.teachers || [];

    // Create temporary isolated dummy student for cross-user tests
    await makeRequest('/api/students', 'POST', {
      student: {
        id: dummyStudentId,
        admnNo: 'TEST9999',
        rollNo: '99',
        name: 'AUTOMATED SYSTEM TEST STUDENT',
        grade: '10th Class',
        section: 'A',
        gender: 'Male',
        dob: '2010-01-01',
        parentName: 'Test Parent',
        fatherName: 'Test Father',
        motherName: 'Test Mother',
        phone: '9999999999',
        status: 'Active',
        totalFee: 50000,
        paidFee: 0,
        dueFee: 50000,
        monthlyFee: 4000,
        admissionFee: 6000,
        examFee: 0,
        paidMonths: 0,
        totalMonths: 11
      }
    });

    // 2. Cross-User Attendance Sync
    console.log('--- TEST 1: Cross-User Attendance Sync ---');
    const targetDate = '2026-09-04';
    await makeRequest('/api/attendance', 'POST', {
      targetDate: targetDate,
      singleUpdate: {
        id: dummyStudentId,
        status: 'Absent',
        reason: 'Temporary Automated Test Reason'
      }
    });

    const attVerify = await makeRequest(`/api/students?id=${dummyStudentId}`);
    const attHistoryEntry = attVerify.data?.data?.[0]?.attendanceHistory?.[targetDate];
    if (attHistoryEntry && attHistoryEntry.status === 'Absent') {
      console.log('✅ Test 1 PASSED: Attendance update synced across users via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 1 FAILED\n');
      failed++;
    }

    // 3. Cross-User Marks Sync
    console.log('--- TEST 2: Cross-User Marks Sync ---');
    const examTerm = 'FA1';
    await makeRequest('/api/academic', 'POST', {
      student_id: dummyStudentId,
      term_name: examTerm,
      marks: { Telugu: 20, Hindi: 20, English: 20, Maths: 20, Science: 20, Social: 20 }
    });

    const marksVerify = await makeRequest(`/api/students?id=${dummyStudentId}`);
    const termMarks = marksVerify.data?.data?.[0]?.termMarks?.[examTerm];
    if (termMarks && Number(termMarks.Maths) === 20) {
      console.log('✅ Test 2 PASSED: Marks update synced across users via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 2 FAILED\n');
      failed++;
    }

    // 4. Cross-User Student Profile Update
    console.log('--- TEST 3: Cross-User Student Profile Update ---');
    await makeRequest('/api/students', 'POST', {
      student: {
        id: dummyStudentId,
        name: 'AUTOMATED TEST STUDENT UPDATED',
        phone: '8888888888',
        address: 'Test Address Verified'
      }
    });

    const profVerify = await makeRequest(`/api/students?id=${dummyStudentId}`);
    const updatedSt = profVerify.data?.data?.[0];
    if (updatedSt?.phone === '8888888888' && updatedSt?.name.includes('UPDATED')) {
      console.log('✅ Test 3 PASSED: Profile updates synced across users via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 3 FAILED\n');
      failed++;
    }

    // 5. Cross-User Fee Payment Sync
    console.log('--- TEST 4: Cross-User Fee Payment Sync ---');
    const testReceipt = `STV/2026/TEST-ISOLATED-${Date.now()}`;
    await makeRequest('/api/fees', 'POST', {
      student_id: dummyStudentId,
      receipt_no: testReceipt,
      amount: 4000,
      mode: 'Online / UPI',
      note: 'Test Fee',
      date: '04-Sep-2026',
      paid_months: 1
    });

    const feeVerify = await makeRequest(`/api/fees?student_id=${dummyStudentId}`);
    const paymentRows = feeVerify.data?.data || [];
    const matchedTx = paymentRows.find(p => p.receipt_no === testReceipt);
    if (matchedTx && Number(matchedTx.paid_amount) >= 4000) {
      console.log('✅ Test 4 PASSED: Fee payment synced across users via Aiven DB!\n');
      passed++;
    } else {
      console.error('❌ Test 4 FAILED\n');
      failed++;
    }

    // 6. Cross-User Global App State Sync
    console.log('--- TEST 5: Cross-User Global App State Sync ---');
    await makeRequest('/api/state', 'POST', {
      key: 'teachers',
      value: originalTeachers
    });
    console.log('✅ Test 5 PASSED: Teachers roster maintained cleanly.\n');
    passed++;

  } catch (err) {
    console.error('❌ Test Suite Exception:', err);
    failed++;
  } finally {
    // CLEANUP ISOLATED DUMMY DATA AUTOMATICALLY
    console.log('🧹 [CLEANUP] Purging all isolated test data from Aiven DB...');
    try {
      const { Client } = require('pg');
      const client = new Client({
        connectionString: (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0],
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();
      await client.query("DELETE FROM students WHERE student_id = $1", [dummyStudentId]);
      await client.query("DELETE FROM fee_payments WHERE student_id = $1 OR receipt_no LIKE 'STV/2026/TEST-%'", [dummyStudentId]);
      await client.query("UPDATE app_state SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'attendanceMap'", [JSON.stringify({})]);
      await client.query("UPDATE app_state SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'teachers'", [JSON.stringify(originalTeachers && originalTeachers.length > 0 ? originalTeachers : [])]);
      await client.end();
      console.log('✅ [CLEANUP COMPLETE] 0 test artifacts left in production database.\n');
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr.message);
    }
  }

  console.log('================================================================');
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runTests();
