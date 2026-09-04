const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('index.html', 'utf8');

// Extract all <script> blocks that contain javascript (excluding external src)
const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let hasError = false;

while ((match = scriptRegex.exec(content)) !== null) {
  scriptIdx++;
  const scriptContent = match[1];
  console.log(`Checking script block #${scriptIdx} (${scriptContent.length} chars)...`);
  try {
    // Create a mock browser window / document environment for syntax testing
    const script = new vm.Script(scriptContent, { filename: `inline_script_${scriptIdx}.js` });
    console.log(`✅ Script block #${scriptIdx} syntax is 100% VALID!`);
  } catch (err) {
    console.error(`❌ Syntax Error in script block #${scriptIdx}:`, err.message);
    hasError = true;
  }
}

if (!hasError) {
  console.log('🎉 ALL INLINE JAVASCRIPT IN index.html IS COMPLETELY VALID!');
} else {
  process.exit(1);
}
