const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const mockDocument = {
  getElementById: (id) => {
    if (id === 'app') return { innerHTML: '' };
    if (id === 'loginUsername') return { value: 'correspondent' };
    if (id === 'loginPassword') return { value: 'admin123' };
    if (id === 'loginRole') return { value: 'super_admin' };
    return null;
  }
};

const sandbox = {
  document: mockDocument,
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
  
  // Set tab to bulkMessaging
  state.activeTab = 'bulkMessaging';
  state.broadcastAudience = 'all';
  
  // Test 1: openBroadcastWhatsAppRow(0)
  openBroadcastWhatsAppRow(0);
  globalThis.test1_url = window.lastOpenedUrl;
  globalThis.test1_tab = window.lastOpenedTabName;
  
  // Test 2: startSequentialWhatsAppDispatch(0)
  startSequentialWhatsAppDispatch(0);
  globalThis.test2_modal = state.activeModal;
  globalThis.test2_queue_len = state.modalWaQueue ? state.modalWaQueue.length : 0;
  globalThis.test2_queue_item0 = state.modalWaQueue ? state.modalWaQueue[0] : null;

  // Test 3: dispatchCurrentQueueItemAndAdvance()
  dispatchCurrentQueueItemAndAdvance();
  globalThis.test3_url = window.lastOpenedUrl;
  globalThis.test3_tab = window.lastOpenedTabName;
  globalThis.test3_next_idx = state.modalWaQueueIdx;
`, sandbox);

console.log('\n--- SIMULATION RESULTS ---');
console.log('Test 1 (openBroadcastWhatsAppRow) URL:', sandbox.test1_url);
console.log('Test 1 Target Tab Name:', sandbox.test1_tab);
console.log('Test 2 (startSequentialWhatsAppDispatch) Active Modal:', sandbox.test2_modal);
console.log('Test 2 Queue Length:', sandbox.test2_queue_len);
console.log('Test 2 Queue Item 0 Student:', sandbox.test2_queue_item0 ? sandbox.test2_queue_item0.studentName : 'NONE');
console.log('Test 3 (dispatchCurrentQueueItemAndAdvance) Target Tab Name:', sandbox.test3_tab);
console.log('Test 3 Next Queue Index:', sandbox.test3_next_idx);
