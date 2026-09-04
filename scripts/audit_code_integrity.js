const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🔍 DEEP CODE INTEGRITY & DUPLICATION AUDIT');
console.log('================================================================\n');

const htmlPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract all script tags
const scriptMatches = content.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log(`Found ${scriptMatches.length} <script> blocks in index.html.`);

// 2. Extract all function declarations
const funcRegex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function)/g;

const functionCounts = {};
let totalFuncs = 0;

for (const script of scriptMatches) {
  let match;
  while ((match = funcRegex.exec(script)) !== null) {
    const fnName = match[1] || match[2] || match[3];
    if (fnName) {
      functionCounts[fnName] = (functionCounts[fnName] || 0) + 1;
      totalFuncs++;
    }
  }
}

console.log(`Total functions declared: ${totalFuncs}`);
const duplicates = Object.entries(functionCounts).filter(([_, count]) => count > 1);

if (duplicates.length > 0) {
  console.log(`⚠️ Found ${duplicates.length} duplicate function names:`);
  duplicates.forEach(([name, count]) => {
    console.log(`  - ${name} (declared ${count} times)`);
  });
} else {
  console.log('✅ ZERO duplicate function declarations found in index.html.');
}

// 3. Check for window/document event listeners duplication
const eventRegex = /(?:window|document)\.addEventListener\(['"]([^'"]+)['"]/g;
const eventCounts = {};
let match;
while ((match = eventRegex.exec(content)) !== null) {
  const ev = match[1];
  eventCounts[ev] = (eventCounts[ev] || 0) + 1;
}

console.log('\nEvent Listeners attached:');
Object.entries(eventCounts).forEach(([ev, count]) => {
  console.log(`  - '${ev}' listener count: ${count}`);
});

// 4. Check for setInterval / timers
const intervalRegex = /setInterval\s*\(/g;
const intervalMatches = content.match(intervalRegex) || [];
console.log(`\nActive setInterval timers: ${intervalMatches.length}`);

console.log('\n================================================================');
console.log('🎉 AUDIT COMPLETE');
console.log('================================================================');
