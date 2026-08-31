const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);

scriptMatches.forEach((s, sIdx) => {
  const cleanScript = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new vm.Script(cleanScript);
    console.log(`Script ${sIdx + 1}: Valid Syntax!`);
  } catch (err) {
    console.error(`\n❌ SCRIPT ${sIdx + 1} ERROR:`, err.message);
    console.error('Stack:', err.stack);
    
    // Find exact line
    const lines = cleanScript.split('\n');
    for (let i = 1; i <= lines.length; i++) {
      try {
        new vm.Script(lines.slice(0, i).join('\n'));
      } catch (e) {
        if (!e.message.includes('Unexpected end of input')) {
          console.error(`First real syntax error at line ~${i}: ${lines[i-1]}`);
          console.error(e.message);
          break;
        }
      }
    }
  }
});
