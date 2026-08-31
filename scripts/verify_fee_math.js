const feeStructure = [
  { className: 'Nursery', count: 33, monthlyFee: 2100, examFee: 1100 },
  { className: 'UKG', count: 52, monthlyFee: 2200, examFee: 1100 },
  { className: 'LKG', count: 49, monthlyFee: 2300, examFee: 1100 },
  { className: '1ST CLASS', count: 51, monthlyFee: 2400, examFee: 1100 },
  { className: '2ND CLASS', count: 53, monthlyFee: 2500, examFee: 1100 },
  { className: '3RD CLASS', count: 65, monthlyFee: 2600, examFee: 1100 },
  { className: '4TH CLASS', count: 58, monthlyFee: 2700, examFee: 1100 },
  { className: '5TH CLASS', count: 50, monthlyFee: 2800, examFee: 1100 },
  { className: '6TH CLASS', count: 54, monthlyFee: 3000, examFee: 1200 },
  { className: '7TH CLASS', count: 60, monthlyFee: 3200, examFee: 1200 },
  { className: '8TH CLASS', count: 81, monthlyFee: 3500, examFee: 1200 },
  { className: '9TH CLASS', count: 78, monthlyFee: 3800, examFee: 1200 },
  { className: '10TH CLASS', count: 72, monthlyFee: 4300, examFee: 2500 },
];

let totalStudents = 0;
let totalExamFee = 0;
let total11Months = 0;
let grandTotal = 0;

console.log('| Class | Students | Monthly Fee | Exam Fee | Yearly Exam Total | 11 Months Package | Total Class Fee |');
console.log('|---|---|---|---|---|---|---|');

feeStructure.forEach(c => {
  const examTotal = c.count * c.examFee;
  const elevenMoTotal = c.count * c.monthlyFee * 11;
  const classGrandTotal = examTotal + elevenMoTotal;

  totalStudents += c.count;
  totalExamFee += examTotal;
  total11Months += elevenMoTotal;
  grandTotal += classGrandTotal;

  console.log(`| ${c.className} | ${c.count} | ₹${c.monthlyFee.toLocaleString()} | ₹${c.examFee.toLocaleString()} | ₹${examTotal.toLocaleString()} | ₹${elevenMoTotal.toLocaleString()} | ₹${classGrandTotal.toLocaleString()} |`);
});

console.log('----------------------------------------------------------------------------------------------------');
console.log(`TOTALS: Students: ${totalStudents}, Exam Total: ₹${totalExamFee.toLocaleString()}, 11-Month Tuition: ₹${total11Months.toLocaleString()}, GRAND TOTAL: ₹${grandTotal.toLocaleString()}`);
