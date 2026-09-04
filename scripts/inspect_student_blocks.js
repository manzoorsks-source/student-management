const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

function printBlock(start, count, title) {
  console.log(`\n=================== ${title} (Lines ${start}-${start+count}) ===================`);
  for (let i = start - 1; i < Math.min(lines.length, start - 1 + count); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printBlock(1885, 35, 'Block 1: Excel Import or Student Generation');
printBlock(10025, 40, 'Block 2: Save Student Marks');
printBlock(10050, 60, 'Block 3: Save Edit Student');
printBlock(10245, 50, 'Block 4: Save Fee Payment');
printBlock(10350, 70, 'Block 5: Student Admission');
