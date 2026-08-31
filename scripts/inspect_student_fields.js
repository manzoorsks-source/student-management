const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

// Look for student field accesses
const matches = content.match(/s\.[a-zA-Z0-9_]+/g) || [];
const uniqueFields = [...new Set(matches.map(m => m.replace('s.', '')))];
console.log('Fields accessed on student (s.*):', uniqueFields);
