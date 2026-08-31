const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('openWhatsApp') || line.includes('api.whatsapp') || line.includes('web.whatsapp') || line.includes('wa.me') || line.includes('stvWaWindow') || line.includes('STV_SINGLE_WA_TAB') || line.includes('STV_WHATSAPP_POPUP_WIN')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
