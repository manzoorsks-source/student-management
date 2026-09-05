const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');

require('dotenv').config();

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[2];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

// Simulated Document & DOM Sandbox for Clean Mobile Device Testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

async function testCleanDeviceFlow() {
  console.log('================================================================');
  console.log('📱 SIMULATING COMPLETELY NEW MOBILE / CLEAN BROWSER LIFECYCLE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // SCENARIO 1: Fresh New Mobile with zero cookies and zero localStorage
  console.log('[SCENARIO 1] Clean Mobile Opens Website for the first time...');
  const cleanStorage = new MockLocalStorage();
  let domHtml = '';

  const mockApp = {
    get innerHTML() { return domHtml; },
    set innerHTML(val) { domHtml = val; }
  };

  const mockDoc = {
    getElementById: (id) => {
      if (id === 'app') return mockApp;
      return null;
    },
    addEventListener: () => {},
    activeElement: null
  };

  const sandbox = {
    document: mockDoc,
    window: {
      location: { origin: 'http://localhost:8080', pathname: '/', hash: '' },
      addEventListener: () => {},
      scrollTo: () => {},
      history: { replaceState: () => {} }
    },
    localStorage: cleanStorage,
    sessionStorage: new MockLocalStorage(),
    console: console,
    fetch: global.fetch || (() => Promise.resolve({ ok: false, status: 401 })),
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  };

  vm.createContext(sandbox);
  vm.runInContext(cleanScript, sandbox);

  // Execute initial render
  vm.runInContext(`render();`, sandbox);

  const renderedHtml = sandbox.document.getElementById('app').innerHTML;

  console.log('Checking rendered view on new device...');
  const showsLoginPrompt = renderedHtml.includes('Staff Portal Sign In') || renderedHtml.includes('loginUsername');
  const exposesDashboard = renderedHtml.includes('Student Directory') || renderedHtml.includes('folder-tab-active');

  if (showsLoginPrompt && !exposesDashboard) {
    console.log('✅ TEST 1 PASSED: Clean mobile device sees Login Screen. Dashboard is NOT opened!\n');
    passed++;
  } else {
    console.error('❌ TEST 1 FAILED: Dashboard or data was leaked without login!\n');
    failed++;
  }

  // SCENARIO 2: Attempting to switch to portal without authentication
  console.log('[SCENARIO 2] Attacker attempts to call switchViewMode("portal") without credentials...');
  vm.runInContext(`switchViewMode('portal'); render();`, sandbox);

  const forcedPortalHtml = sandbox.document.getElementById('app').innerHTML;
  const stillBlocked = forcedPortalHtml.includes('Staff Portal Sign In') || forcedPortalHtml.includes('loginUsername');
  const dashboardLeaked = forcedPortalHtml.includes('folder-tab') && !forcedPortalHtml.includes('Staff Portal Sign In');

  if (stillBlocked && !dashboardLeaked) {
    console.log('✅ TEST 2 PASSED: Direct portal navigation blocked by Authentication Guard!\n');
    passed++;
  } else {
    console.error('❌ TEST 2 FAILED: Dashboard opened without valid token!\n');
    failed++;
  }

  // SCENARIO 3: Attempting to access students data from memory
  console.log('[SCENARIO 3] Checking in-memory student records for unauthenticated session...');
  const inMemoryStudents = vm.runInContext(`state.students`, sandbox);
  console.log(`            Students in memory: ${Array.isArray(inMemoryStudents) ? inMemoryStudents.length : '0'}`);
  const hasAuthToken = vm.runInContext(`state.token`, sandbox);
  console.log(`            Session token in memory: ${hasAuthToken || 'NULL'}`);

  if (!hasAuthToken) {
    console.log('✅ TEST 3 PASSED: Zero authenticated session tokens present in memory.\n');
    passed++;
  } else {
    console.error('❌ TEST 3 FAILED: Session token existed on fresh mobile.\n');
    failed++;
  }

  console.log('================================================================');
  console.log(`📊 SIMULATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

testCleanDeviceFlow();
