const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const sandbox = {
  document: {
    getElementById: (id) => {
      if (id === 'app') return { innerHTML: '' };
      if (id === 'loginUsername') return { value: 'correspondent' };
      if (id === 'loginPassword') return { value: 'admin123' };
      if (id === 'loginRole') return { value: 'super_admin' };
      return null;
    }
  },
  window: {
    location: { hash: '' },
    scrollTo: () => {},
    lastOpenedUrl: null,
    lastOpenedTabName: null,
    open: function(url, tabName) {
      sandbox.window.lastOpenedUrl = url;
      sandbox.window.lastOpenedTabName = tabName;
      return { focus: () => {} };
    }
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  navigator: { clipboard: { writeText: () => {} } },
  alert: (msg) => console.log('ALERT:', msg),
  console: console
};

vm.createContext(sandbox);
vm.runInContext(cleanScript + `
  // Login first
  handleLogin();
  
  // Set student MUNAZAH FATHIMA as absent
  const stu = state.students.find(s => s.name.includes('MUNAZAH FATHIMA') || s.admnNo === '5149');
  if (stu) {
    state.attendanceMap[stu.id] = 'Absent';
  }
  
  state.activeTab = 'bulkMessaging';
  state.broadcastAudience = 'absentees_today';
  
  // Test 1: openBroadcastWhatsAppRow(0) for absent student
  openBroadcastWhatsAppRow(0);
  globalThis.test_absent_url = window.lastOpenedUrl;
  globalThis.test_absent_tab = window.lastOpenedTabName;
  
  // Test 2: startSequentialWhatsAppDispatch(0)
  startSequentialWhatsAppDispatch(0);
  globalThis.test_absent_queue_len = state.modalWaQueue ? state.modalWaQueue.length : 0;
  globalThis.test_absent_student = state.modalWaQueue && state.modalWaQueue[0] ? state.modalWaQueue[0].studentName : 'NONE';
`, sandbox);

console.log('\n--- ABSENTEES DISPATCH TEST ---');
console.log('Target URL for absent student:', sandbox.test_absent_url);
console.log('Target Tab Name:', sandbox.test_absent_tab);
console.log('Queue Length for Absentees:', sandbox.test_absent_queue_len);
console.log('Absent Student Name in Queue:', sandbox.test_absent_student);
