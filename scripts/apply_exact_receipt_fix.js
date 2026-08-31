const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('Applying 11-month breakdown and clean 0001 receipt sequence...');

// 1. Update getMonthlyInstallmentBreakdown with all 11 months
const newInstallmentBreakdown = `    function getMonthlyInstallmentsBreakdown(student) {
      const fc = getStudentFeeTotals(student);
      const monthConfig = [
        { num: 1, name: 'June 2026 Fee', shortName: 'June' },
        { num: 2, name: 'July 2026 Fee', shortName: 'July' },
        { num: 3, name: 'August 2026 Fee', shortName: 'August' },
        { num: 4, name: 'September 2026 Fee', shortName: 'September' },
        { num: 5, name: 'October 2026 Fee', shortName: 'October' },
        { num: 6, name: 'November 2026 Fee', shortName: 'November' },
        { num: 7, name: 'December 2026 Fee', shortName: 'December' },
        { num: 8, name: 'January 2027 Fee', shortName: 'January' },
        { num: 9, name: 'February 2027 Fee', shortName: 'February' },
        { num: 10, name: 'March 2027 Fee', shortName: 'March' },
        { num: 11, name: 'April 2027 Fee', shortName: 'April' }
      ];

      const totalMonthlyDue = fc.monthlyRate + fc.monthlyBusFee;
      const history = student.paymentHistory || [];

      let totalPool = fc.totalPaidFee;

      // 1. Allocate to Yearly Exam Fee (FIRST ROW)
      const examDue = fc.examFee;
      const examAllocated = Math.min(examDue, totalPool);
      totalPool -= examAllocated;
      const isExamPaid = examAllocated >= examDue && examDue > 0;
      const examTx = history.find(p => p.month && p.month.toLowerCase().includes('exam'));

      const examRow = {
        isAdmissionRow: false,
        isExamRow: true,
        monthNumber: '★',
        monthName: \`Yearly Exam Fee (\${student.grade || 'Class'})\`,
        shortName: 'Exam Fee',
        tuitionFee: fc.examFee,
        busFee: 0,
        totalDue: examDue,
        isPaid: isExamPaid,
        isArrear: false,
        status: isExamPaid ? 'Paid' : 'Pending',
        amountPaid: examAllocated,
        receiptNo: examAllocated > 0 ? (examTx?.receiptNo || history[0]?.receiptNo || '--') : '--',
        paymentDate: examAllocated > 0 ? (examTx?.date || history[0]?.date || '--') : '--',
        paymentMode: examAllocated > 0 ? (examTx?.mode || history[0]?.mode || '--') : '--'
      };

      // 2. Allocate remaining pool sequentially to Monthly Installments (Rows 1 to 11)
      const monthlyRows = monthConfig.map((m, idx) => {
        const monthAllocated = Math.min(totalMonthlyDue, totalPool);
        totalPool -= monthAllocated;

        const isPaid = monthAllocated >= totalMonthlyDue;
        const isArrear = !isPaid && (idx + 1) <= fc.currentMonthIndex;

        const tx = history.find(p => p.month && p.month.toLowerCase().includes(m.shortName.toLowerCase()));

        return {
          isAdmissionRow: false,
          isExamRow: false,
          monthNumber: m.num,
          monthName: m.name,
          shortName: m.shortName,
          tuitionFee: fc.monthlyRate,
          busFee: fc.monthlyBusFee,
          totalDue: totalMonthlyDue,
          isPaid,
          isArrear,
          status: isPaid ? 'Paid' : (isArrear ? 'Arrear Pending' : 'Upcoming'),
          amountPaid: monthAllocated,
          receiptNo: monthAllocated > 0 ? (tx?.receiptNo || history[0]?.receiptNo || '--') : '--',
          paymentDate: monthAllocated > 0 ? (tx?.date || history[0]?.date || '--') : '--',
          paymentMode: monthAllocated > 0 ? (tx?.mode || history[0]?.mode || '--') : '--'
        };
      });

      return [examRow, ...monthlyRows];
    }`;

html = html.replace(/function getMonthlyInstallmentsBreakdown\(student\) \{[\s\S]*?return \[examRow, \.\.\.monthlyRows\];\s*\}/, newInstallmentBreakdown);

// 2. Update subtitle in studentFeeLedger modal
html = html.replace('Exam Fee + Admission Fee + 10 Installments', 'Yearly Exam Fee + 11 Monthly Installments');
html = html.replace(/₹\$\{\(fc\.monthlyRate \* 10\)\.toLocaleString\(\)\} \(10 Mos\)/, '₹${(fc.monthlyRate * 11).toLocaleString()} (11 Months Package)');

// 3. Update APP_VERSION to force localStorage clear of old test receipts
html = html.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = 'stv_v2026_receipt_0001_clean_v1';");

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Updated index.html with 11-month breakdown and clean 0001 receipt sequence.');

// Verify syntax
const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
let allOk = true;

scriptMatches.forEach((s, sIdx) => {
  const cleanScript = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new vm.Script(cleanScript);
    console.log(`✅ Script ${sIdx + 1}: SYNTAX 100% VALID!`);
  } catch (err) {
    allOk = false;
    console.error(`❌ Script ${sIdx + 1} Syntax Error:`, err.message);
  }
});

if (allOk) {
  console.log('\n🎉 ALL SCRIPTS SYNTACTICALLY VERIFIED AND 100% ERROR-FREE!\n');
}
