const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)[1];
const cleanScript = scriptMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

const mockDocument = {
  getElementById: (id) => {
    if (id === 'app') return { innerHTML: '' };
    if (id === 'feeAmountInput') return { value: '2400' };
    if (id === 'feeMonthInput') return { value: 'June 2026 Fee (Month 1)' };
    if (id === 'feeModeInput') return { value: 'UPI' };
    if (id === 'feeDateInput') return { value: '2026-08-30' };
    return null;
  }
};

const sandbox = {
  document: mockDocument,
  window: {
    location: { hash: '' },
    scrollTo: () => {},
    print: () => {}
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  setTimeout: (fn) => fn(),
  alert: (msg) => console.log('ALERT:', msg),
  console: console
};

vm.createContext(sandbox);
vm.runInContext(cleanScript + `
  // Initial Ledger check on student 0
  const initialStudent = state.students[0];
  const initialBreakdown = getMonthlyInstallmentsBreakdown(initialStudent);
  globalThis.initialExamReceipt = initialBreakdown[0].receiptNo;
  globalThis.initialJuneReceipt = initialBreakdown[1].receiptNo;

  // Record 1st payment on Student 0
  state.modalStudent = initialStudent;
  saveFeePayment({ preventDefault: () => {} });
  globalThis.firstTxReceipt = state.modalTransaction.receiptNo;

  // Record 2nd payment on Student 1
  state.modalStudent = state.students[1];
  saveFeePayment({ preventDefault: () => {} });
  globalThis.secondTxReceipt = state.modalTransaction.receiptNo;

  // Record 3rd payment on Student 2
  state.modalStudent = state.students[2];
  saveFeePayment({ preventDefault: () => {} });
  globalThis.thirdTxReceipt = state.modalTransaction.receiptNo;

  // Check updated ledger for Student 0
  const updatedStudent0 = state.students[0];
  const updatedBreakdown0 = getMonthlyInstallmentsBreakdown(updatedStudent0);
  globalThis.updatedStudent0Receipt = updatedBreakdown0[0].receiptNo;
`, sandbox);

console.log('\n--- SIMULATION VERIFICATION RESULTS ---');
console.log('1. Initial Unpaid Exam Receipt:', sandbox.initialExamReceipt);
console.log('2. Initial Unpaid June Receipt:', sandbox.initialJuneReceipt);
console.log('3. First Payment Transaction Receipt:', sandbox.firstTxReceipt);
console.log('4. Second Payment Transaction Receipt:', sandbox.secondTxReceipt);
console.log('5. Third Payment Transaction Receipt:', sandbox.thirdTxReceipt);
console.log('6. Updated Ledger Row Receipt for Student 0:', sandbox.updatedStudent0Receipt);
