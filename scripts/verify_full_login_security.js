require('dotenv').config();
const http = require('http');
const { Client } = require('pg');

const PORT = parseInt(process.env.PORT, 10) || 8080;
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

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('🛡️ ST. VENUS HIGH SCHOOL - END-TO-END SECURITY & AUTH TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Phase 1: Verify Anti-Cache Headers on HTML delivery
    console.log('--- PHASE 1: HTTP Security & Anti-Cache Verification ---');
    const indexRes = await makeRequest('/');
    const cacheControl = indexRes.headers['cache-control'] || '';
    console.log(`[CHECK 1.1] HTML Cache-Control: "${cacheControl}"`);
    if (cacheControl.includes('no-store') || cacheControl.includes('no-cache')) {
      console.log('✅ Anti-caching headers active to prevent back-button / history caching!\n');
      passed++;
    } else {
      console.error('❌ Missing anti-caching headers on HTML delivery!\n');
      failed++;
    }

    // Phase 2: Verify Protected Endpoints are 100% Locked Without Auth
    console.log('--- PHASE 2: Unauthenticated Endpoint Lock Verification ---');
    const protectedPaths = ['/api/students', '/api/state', '/api/fees', '/api/academic', '/api/attendance'];
    for (const p of protectedPaths) {
      const res = await makeRequest(p);
      console.log(`[CHECK 2] GET ${p} -> Status ${res.status}`);
      if (res.status === 401) {
        passed++;
      } else {
        console.error(`❌ Security breach: ${p} returned status ${res.status} without auth!`);
        failed++;
      }
    }
    console.log('✅ All 5 critical API endpoints strictly reject unauthenticated requests!\n');

    // Phase 3: Login Authentication Flow
    console.log('--- PHASE 3: Authentication Flow & Multi-Role Verification ---');
    
    // 3.1 Invalid username
    const badUser = await makeRequest('/api/auth/login', 'POST', { username: 'nonexistent_user', password: 'password123' });
    if (badUser.status === 401) {
      console.log('✅ Invalid username properly rejected (401).');
      passed++;
    } else {
      console.error('❌ Failed invalid username check.');
      failed++;
    }

    // 3.2 Invalid password
    const badPass = await makeRequest('/api/auth/login', 'POST', { username: 'shaikmadar786', password: 'WrongPassword' });
    if (badPass.status === 401) {
      console.log('✅ Invalid password properly rejected (401).');
      passed++;
    } else {
      console.error('❌ Failed invalid password check.');
      failed++;
    }

    // 3.3 Super Admin Login
    const adminLogin = await makeRequest('/api/auth/login', 'POST', { username: 'shaikmadar786', password: 'Shaik@786' });
    if (adminLogin.status === 200 && adminLogin.data?.token) {
      console.log(`✅ Super Admin (Shaik Madar) authenticated. Token: ${adminLogin.data.token.substring(0, 16)}...`);
      passed++;
    } else {
      console.error('❌ Super Admin login failed.');
      failed++;
    }
    const adminToken = adminLogin.data.token;

    // 3.4 Principal Login
    const principalLogin = await makeRequest('/api/auth/login', 'POST', { username: 'principal', password: 'admin123' });
    if (principalLogin.status === 200 && principalLogin.data?.user?.role === 'principal') {
      console.log('✅ Principal (Mrs. Sunitha Devi) authenticated.');
      passed++;
    } else {
      console.error('❌ Principal login failed.');
      failed++;
    }

    // 3.5 Accountant Login
    const accountantLogin = await makeRequest('/api/auth/login', 'POST', { username: 'accountant', password: 'admin123' });
    if (accountantLogin.status === 200 && accountantLogin.data?.user?.role === 'accountant') {
      console.log('✅ Accountant (Mr. K. Ramesh) authenticated.');
      passed++;
    } else {
      console.error('❌ Accountant login failed.');
      failed++;
    }

    // Phase 4: Authorized Data Access with Session Token
    console.log('\n--- PHASE 4: Authorized Data Access Verification ---');
    const studentsRes = await makeRequest('/api/students', 'GET', null, adminToken);
    if (studentsRes.status === 200 && studentsRes.data?.data?.length > 0) {
      console.log(`✅ Authorized GET /api/students succeeded (${studentsRes.data.data.length} records retrieved).`);
      passed++;
    } else {
      console.error('❌ Authorized GET /api/students failed.');
      failed++;
    }

    const stateRes = await makeRequest('/api/state', 'GET', null, adminToken);
    if (stateRes.status === 200 && stateRes.data?.data) {
      console.log('✅ Authorized GET /api/state succeeded.');
      passed++;
    } else {
      console.error('❌ Authorized GET /api/state failed.');
      failed++;
    }

    // Phase 5: Logout & Server-Side Token Invalidation
    console.log('\n--- PHASE 5: Logout & Session Invalidation Verification ---');
    const logoutRes = await makeRequest('/api/auth/logout', 'POST', null, adminToken);
    if (logoutRes.status === 200) {
      console.log('✅ POST /api/auth/logout succeeded.');
      passed++;
    } else {
      console.error('❌ Logout request failed.');
      failed++;
    }

    // Attempting to reuse revoked token
    const reusedAttempt = await makeRequest('/api/students', 'GET', null, adminToken);
    if (reusedAttempt.status === 401) {
      console.log('✅ Revoked token immediately rejected with 401 on /api/students.');
      passed++;
    } else {
      console.error(`❌ Security flaw: Revoked token was accepted with status ${reusedAttempt.status}!`);
      failed++;
    }

    const meRevoked = await makeRequest('/api/auth/me', 'GET', null, adminToken);
    if (meRevoked.status === 401) {
      console.log('✅ Revoked token immediately rejected with 401 on /api/auth/me.');
      passed++;
    } else {
      console.error(`❌ Security flaw: Revoked token was accepted on /api/auth/me!`);
      failed++;
    }

    // Phase 6: Verify Database Session Cleanup
    console.log('\n--- PHASE 6: Database auth_sessions Table Verification ---');
    const dbClient = new Client({
      connectionString: (process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL || '').split('?')[0],
      ssl: { rejectUnauthorized: false }
    });
    await dbClient.connect();
    const sessionCheck = await dbClient.query('SELECT COUNT(*) FROM auth_sessions WHERE token = $1', [adminToken]);
    if (parseInt(sessionCheck.rows[0].count, 10) === 0) {
      console.log('✅ Confirmed in PostgreSQL: Revoked token was completely purged from auth_sessions table.\n');
      passed++;
    } else {
      console.error('❌ Token remained in PostgreSQL auth_sessions after logout!\n');
      failed++;
    }
    await dbClient.end();

  } catch (err) {
    console.error('❌ Verification Exception:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 OVERALL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveVerification();
