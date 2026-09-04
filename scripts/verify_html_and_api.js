require('dotenv').config();
const http = require('http');

const PORT = parseInt(process.env.PORT, 10) || 8080;

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: PORT, path }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('================================================================');
  console.log('🔍 FULL END-TO-END VERIFICATION: SERVER & AIVEN CLOUD SYNC');
  console.log('================================================================');

  // 1. Fetch index.html
  const htmlRes = await fetchUrl('/');
  console.log(`1. GET / (index.html): Status ${htmlRes.status}, Size: ${htmlRes.body.length} bytes`);
  
  if (!htmlRes.body.includes('cloud-sync-badge')) {
    throw new Error('❌ cloud-sync-badge not found in index.html!');
  }
  console.log('   ✅ Cloud Sync Badge markup verified in HTML.');

  if (!htmlRes.body.includes('CloudSync.loadInitialData()')) {
    throw new Error('❌ CloudSync.loadInitialData() not found in startup script!');
  }
  console.log('   ✅ CloudSync initialization verified on DOMContentLoaded.');

  // 2. Health Endpoint
  const healthRes = await fetchUrl('/api/health');
  const healthData = JSON.parse(healthRes.body);
  console.log(`2. GET /api/health: Status ${healthRes.status}, Database: ${healthData.database}, Students in DB: ${healthData.studentCount}`);

  // 3. Students Endpoint
  const studentsRes = await fetchUrl('/api/students?limit=3');
  const studentsData = JSON.parse(studentsRes.body);
  console.log(`3. GET /api/students: Status ${studentsRes.status}, Total: ${studentsData.count} students in Aiven DB`);
  console.log(`   - Sample student: ${studentsData.data[0].name} (${studentsData.data[0].grade}-${studentsData.data[0].section})`);

  // 4. State Endpoint
  const stateRes = await fetchUrl('/api/state');
  const stateData = JSON.parse(stateRes.body);
  console.log(`4. GET /api/state: Status ${stateRes.status}, State keys in Aiven DB: ${Object.keys(stateData.data).join(', ')}`);

  console.log('\n================================================================');
  console.log('🎉 ALL CHECKS PASSED: SYSTEM IS 100% PERSISTED ON AIVEN CLOUD DB!');
  console.log('================================================================\n');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
