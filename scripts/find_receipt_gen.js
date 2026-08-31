const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('receiptNo') || line.includes('generateReceipt') || line.includes('STV-REC') || line.includes('REC-') || line.includes('printFeeReceipt') || line.includes('handlePaymentSubmit') || line.includes('recordPayment')) {
    if (line.length < 200) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
