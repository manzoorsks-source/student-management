const http = require('http');
const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('================================================================');
  console.log('🧪 USER LIFECYCLE & PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

  // STEP 1: Fetch initial state from database
  console.log('[STEP 1] Fetching current users from PostgreSQL database...');
  const res1 = await request({ host: 'localhost', port: 8080, path: '/api/state', method: 'GET' });
  if (res1.status !== 200 || !res1.data.success) {
    throw new Error('Failed to fetch app state: ' + JSON.stringify(res1.data));
  }

  let users = res1.data.data.users || [];
  console.log(`Current users count in DB: ${users.length}`);
  users.forEach(u => console.log(`  - [${u.role.toUpperCase()}] ${u.fullName} (@${u.username})`));

  // Check Principal and Accountant exist
  const hasPrincipal = users.some(u => u.username === 'principal');
  const hasAccountant = users.some(u => u.username === 'accountant');
  const hasCorrespondent = users.some(u => u.username === 'shaikmadar786');

  if (!hasPrincipal || !hasAccountant || !hasCorrespondent) {
    throw new Error(`Missing expected default accounts: Principal: ${hasPrincipal}, Accountant: ${hasAccountant}, Admin: ${hasCorrespondent}`);
  }
  console.log('✅ Default Admin, Principal, and Accountant accounts verified in central DB!\n');

  // STEP 2: Super Admin creates a new custom staff user
  console.log('[STEP 2] Super Admin creates new custom user "Dr. Venkateshwarlu" (@dr_venkat)...');
  const newStaff = {
    empId: 'EMP-004',
    fullName: 'Dr. Venkateshwarlu (Senior Science Faculty)',
    username: 'dr_venkat',
    password: 'Teacher@2026',
    passwordHash: sha256('Teacher@2026'),
    mobile: '+91 9848022999',
    email: 'dr.venkat@stvenushighschool.edu.in',
    role: 'teacher',
    status: 'Active',
    timing: '8:30 AM – 4:30 PM',
    createdAt: '04-Sep-2026 11:00 AM',
    lastLogin: 'Never'
  };

  const updatedUsers = users.filter(u => u.username !== 'dr_venkat').concat([newStaff]);

  const saveRes = await request({
    host: 'localhost',
    port: 8080,
    path: '/api/state',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { key: 'users', value: updatedUsers });

  if (saveRes.status !== 200 || !saveRes.data.success) {
    throw new Error('Failed to save updated users: ' + JSON.stringify(saveRes.data));
  }
  console.log('✅ New staff user saved to Aiven PostgreSQL central DB!\n');

  // STEP 3: Hard reset simulation (clear all local references, re-fetch fresh state from DB)
  console.log('[STEP 3] Simulating hard browser refresh & clean fetch from DB...');
  const res3 = await request({ host: 'localhost', port: 8080, path: '/api/state', method: 'GET' });
  const freshUsers = res3.data.data.users || [];
  
  const savedUser = freshUsers.find(u => u.username === 'dr_venkat');
  if (!savedUser) {
    throw new Error('FAILED: Newly created user "dr_venkat" was NOT found after refresh!');
  }
  console.log('Found user after refresh:', {
    empId: savedUser.empId,
    fullName: savedUser.fullName,
    username: savedUser.username,
    role: savedUser.role,
    timing: savedUser.timing,
    passwordHash: savedUser.passwordHash
  });
  console.log('✅ User persistence after hard reset / refresh VERIFIED!\n');

  // STEP 4: Login authentication verification for new user
  console.log('[STEP 4] Testing login authentication for @dr_venkat with password "Teacher@2026"...');
  const enteredPass = 'Teacher@2026';
  const enteredHash = sha256(enteredPass);
  const authOk = (savedUser.password === enteredPass) || (savedUser.passwordHash === enteredHash);
  if (!authOk) {
    throw new Error('FAILED: Authentication failed for newly created user!');
  }
  console.log('✅ Authentication SUCCESSFUL for @dr_venkat!\n');

  // STEP 5: Login authentication for Principal and Accountant
  console.log('[STEP 5] Testing login authentication for @principal and @accountant...');
  const pUser = freshUsers.find(u => u.username === 'principal');
  const aUser = freshUsers.find(u => u.username === 'accountant');
  if (!pUser || !aUser) {
    throw new Error('FAILED: Principal or Accountant missing from DB!');
  }

  const pAuth = (pUser.password === 'admin123') || (pUser.passwordHash === sha256('admin123'));
  const aAuth = (aUser.password === 'admin123') || (aUser.passwordHash === sha256('admin123'));

  if (!pAuth || !aAuth) {
    throw new Error(`FAILED: Principal Auth: ${pAuth}, Accountant Auth: ${aAuth}`);
  }
  console.log('✅ Principal User (@principal) Login: OK');
  console.log('✅ Accountant User (@accountant) Login: OK\n');

  // STEP 6: Super Admin edits existing user
  console.log('[STEP 6] Super Admin edits @dr_venkat mobile & status -> Persists to DB...');
  const modifiedUsers = freshUsers.map(u => {
    if (u.username === 'dr_venkat') {
      return { ...u, mobile: '+91 9999988888', timing: '7:30 AM – 2:30 PM (Morning Shift)' };
    }
    return u;
  });

  await request({
    host: 'localhost',
    port: 8080,
    path: '/api/state',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { key: 'users', value: modifiedUsers });

  // STEP 7: Re-fetch and verify edit persisted
  const res7 = await request({ host: 'localhost', port: 8080, path: '/api/state', method: 'GET' });
  const editedUser = (res7.data.data.users || []).find(u => u.username === 'dr_venkat');
  if (editedUser.mobile !== '+91 9999988888' || editedUser.timing !== '7:30 AM – 2:30 PM (Morning Shift)') {
    throw new Error('FAILED: Edit did not persist!');
  }
  console.log('✅ User edit persisted successfully in Aiven PostgreSQL DB!\n');

  console.log('================================================================');
  console.log('🎉 ALL USER PERSISTENCE & LIFECYCLE TESTS PASSED (100% SUCCESS)');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
