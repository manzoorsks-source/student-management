const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// 1. Patch saveStudentMarks
const oldMarksCode = `      state.students = state.students.map(s => {
        if (s.id === state.modalStudent.id) {
          const updatedTermMarks = { ...(s.termMarks || {}), [term]: newTermMarks };
          return { ...s, termMarks: updatedTermMarks };
        }
        return s;
      });

      closeModal();`;

const newMarksCode = `      let updatedStudentRecord = null;
      state.students = state.students.map(s => {
        if (s.id === state.modalStudent.id) {
          const updatedTermMarks = { ...(s.termMarks || {}), [term]: newTermMarks };
          updatedStudentRecord = { ...s, termMarks: updatedTermMarks };
          return updatedStudentRecord;
        }
        return s;
      });

      if (updatedStudentRecord) {
        CloudSync.saveStudentMarks(updatedStudentRecord.id, term, newTermMarks, updatedStudentRecord);
      }
      saveState();
      closeModal();`;

if (content.includes(oldMarksCode)) {
  content = content.replace(oldMarksCode, newMarksCode);
  console.log('✅ Patched saveStudentMarks to sync to Aiven Cloud DB.');
}

// 2. Patch saveFeePayment
const oldFeeCode = `      if (updatedTargetStudent) {
        state.modalStudent = updatedTargetStudent;
        state.modalTransaction = updatedTargetStudent.paymentHistory[0];
        state.activeModal = 'printFeeReceipt';
        saveState();`;

const newFeeCode = `      if (updatedTargetStudent) {
        state.modalStudent = updatedTargetStudent;
        state.modalTransaction = updatedTargetStudent.paymentHistory[0];
        state.activeModal = 'printFeeReceipt';
        CloudSync.recordFeePayment(updatedTargetStudent.id, { receiptNo, amount, date: paymentDate, month, mode, paid_months: updatedTargetStudent.paidMonths }, updatedTargetStudent);
        saveState();`;

if (content.includes(oldFeeCode)) {
  content = content.replace(oldFeeCode, newFeeCode);
  console.log('✅ Patched saveFeePayment to sync to Aiven Cloud DB.');
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('🎉 Exact hooks applied successfully!');
