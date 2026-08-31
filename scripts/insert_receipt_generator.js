const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const receiptGenFunction = `
    // --- OFFICIAL SEQUENTIAL RECEIPT NUMBER GENERATOR (STV/2026/0001, STV/2026/0002, ...) ---
    function getNextReceiptNumber() {
      let maxSeq = 0;

      if (state && typeof state.lastReceiptSequence === 'number') {
        maxSeq = Math.max(maxSeq, state.lastReceiptSequence);
      }

      // Scan all student payment histories to ensure strict chronological continuation
      (state.students || []).forEach(s => {
        (s.paymentHistory || []).forEach(tx => {
          if (tx && tx.receiptNo) {
            const match = tx.receiptNo.match(/STV\\/2026\\/(\\d+)/i) || tx.receiptNo.match(/(\\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxSeq) {
                maxSeq = num;
              }
            }
          }
        });
      });

      const nextSeq = maxSeq + 1;
      state.lastReceiptSequence = nextSeq;
      saveState();

      const padded = String(nextSeq).padStart(4, '0');
      return 'STV/2026/' + padded;
    }
`;

// Insert right before function saveFeePayment(e)
html = html.replace('function saveFeePayment(e) {', receiptGenFunction + '\n    function saveFeePayment(e) {');

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Successfully inserted getNextReceiptNumber before saveFeePayment.');

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
  console.log('\n🎉 SCRIPT SYNTAX VERIFIED 100% OK!\n');
}
