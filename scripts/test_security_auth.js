require('dotenv').config();
const http = require('http');

const PORT = parseInt(process.env.PORT, 10) || 8000;
const SERVER_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, SERVER_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || PORT,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
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

async function runSecurityTests() {
  console.log('================================================================');
  console.log('🔒 ST. VENUS HIGH SCHOOL - FULL-STACK AUTHENTICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Unauthenticated Students Access Blocked
    console.log('[TEST 1] Testing unauthenticated GET /api/students...');
    const unauthStudents = await makeRequest('/api/students');
    console.log(`         Status: ${unauthStudents.status} (Expected 401)`);
    if (unauthStudents.status === 401) {
      console.log('✅ TEST 1 PASSED: Unauthenticated access to /api/students is strictly blocked!\n');
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: Received status ${unauthStudents.status}\n`);
      failed++;
    }

    // 2. Unauthenticated State Access Blocked
    console.log('[TEST 2] Testing unauthenticated GET /api/state...');
    const unauthState = await makeRequest('/api/state');
    console.log(`         Status: ${unauthState.status} (Expected 401)`);
    if (unauthState.status === 401) {
      console.log('✅ TEST 2 PASSED: Unauthenticated access to /api/state is strictly blocked!\n');
      passed++;
    } else {
      console.error(`❌ TEST 2 FAILED: Received status ${unauthState.status}\n`);
      failed++;
    }

    // 3. Invalid Credentials Rejected
    console.log('[TEST 3] Testing POST /api/auth/login with wrong password...');
    const wrongLogin = await makeRequest('/api/auth/login', 'POST', {
      username: 'shaikmadar786',
      password: 'WrongPassword123'
    });
    console.log(`         Status: ${wrongLogin.status} (Expected 401)`);
    if (wrongLogin.status === 401) {
      console.log('✅ TEST 3 PASSED: Invalid credentials rejected!\n');
      passed++;
    } else {
      console.error(`❌ TEST 3 FAILED: Received status ${wrongLogin.status}\n`);
      failed++;
    }

    // 4. Valid Credentials Login
    console.log('[TEST 4] Testing POST /api/auth/login with valid super_admin credentials...');
    const validLogin = await makeRequest('/api/auth/login', 'POST', {
      username: 'shaikmadar786',
      password: 'Shaik@786'
    });
    console.log(`         Status: ${validLogin.status} (Expected 200)`);
    const token = validLogin.data?.token;
    if (validLogin.status === 200 && token && validLogin.data?.user?.role === 'super_admin') {
      console.log(`✅ TEST 4 PASSED: Authentication successful! Generated Token: ${token.substring(0, 16)}...\n`);
      passed++;
    } else {
      console.error(`❌ TEST 4 FAILED: Login failed. Data:`, validLogin.data);
      failed++;
      return;
    }

    // 5. Session Verification with /api/auth/me
    console.log('[TEST 5] Testing GET /api/auth/me with Bearer token...');
    const meRes = await makeRequest('/api/auth/me', 'GET', null, token);
    console.log(`         Status: ${meRes.status} (Expected 200)`);
    if (meRes.status === 200 && meRes.data?.user?.username === 'shaikmadar786') {
      console.log(`✅ TEST 5 PASSED: Session active for user ${meRes.data.user.fullName}\n`);
      passed++;
    } else {
      console.error(`❌ TEST 5 FAILED: /api/auth/me failed. Data:`, meRes.data);
      failed++;
    }

    // 6. Authenticated Students Access Allowed
    console.log('[TEST 6] Testing authenticated GET /api/students...');
    const authStudents = await makeRequest('/api/students', 'GET', null, token);
    console.log(`         Status: ${authStudents.status} (Expected 200)`);
    if (authStudents.status === 200 && Array.isArray(authStudents.data?.data) && authStudents.data.data.length > 0) {
      console.log(`✅ TEST 6 PASSED: Retrieved ${authStudents.data.data.length} student records with valid session!\n`);
      passed++;
    } else {
      console.error(`❌ TEST 6 FAILED: Failed to fetch students with valid token. Data:`, authStudents.data);
      failed++;
    }

    // 7. Authenticated State Access Allowed (and passwords hidden)
    console.log('[TEST 7] Testing authenticated GET /api/state...');
    const authState = await makeRequest('/api/state', 'GET', null, token);
    console.log(`         Status: ${authState.status} (Expected 200)`);
    if (authState.status === 200 && authState.data?.data) {
      console.log(`✅ TEST 7 PASSED: App state retrieved with valid session!\n`);
      passed++;
    } else {
      console.error(`❌ TEST 7 FAILED: Failed to fetch state with valid token.\n`);
      failed++;
    }

    // 8. Logout and Token Revocation
    console.log('[TEST 8] Testing POST /api/auth/logout with Bearer token...');
    const logoutRes = await makeRequest('/api/auth/logout', 'POST', null, token);
    console.log(`         Status: ${logoutRes.status} (Expected 200)`);
    if (logoutRes.status === 200) {
      console.log(`✅ TEST 8 PASSED: Session invalidated on server!\n`);
      passed++;
    } else {
      console.error(`❌ TEST 8 FAILED: Logout failed.\n`);
      failed++;
    }

    // 9. Verify Revoked Token Rejected on /api/students
    console.log('[TEST 9] Testing GET /api/students with REVOKED token...');
    const revokedStudents = await makeRequest('/api/students', 'GET', null, token);
    console.log(`         Status: ${revokedStudents.status} (Expected 401)`);
    if (revokedStudents.status === 401) {
      console.log('✅ TEST 9 PASSED: Revoked token was immediately blocked from accessing data!\n');
      passed++;
    } else {
      console.error(`❌ TEST 9 FAILED: Revoked token was not blocked! Status: ${revokedStudents.status}\n`);
      failed++;
    }

    // 10. Verify Revoked Token Rejected on /api/auth/me
    console.log('[TEST 10] Testing GET /api/auth/me with REVOKED token...');
    const revokedMe = await makeRequest('/api/auth/me', 'GET', null, token);
    console.log(`          Status: ${revokedMe.status} (Expected 401)`);
    if (revokedMe.status === 401) {
      console.log('✅ TEST 10 PASSED: Revoked token rejected on /api/auth/me!\n');
      passed++;
    } else {
      console.error(`❌ TEST 10 FAILED: Revoked token was not rejected! Status: ${revokedMe.status}\n`);
      failed++;
    }

  } catch (err) {
    console.error('❌ Test Exception:', err.message);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 FINAL SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
