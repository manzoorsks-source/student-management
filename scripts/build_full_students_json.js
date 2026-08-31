const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(excelPath);

function cleanStr(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

function parseDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = date.y < 100 ? (date.y > 30 ? 1900 + date.y : 2000 + date.y) : date.y;
      return `${String(date.d).padStart(2,'0')}/${String(date.m).padStart(2,'0')}/${y}`;
    }
  }
  let s = String(val).trim().replace(/\s+/g, ' ');
  const match = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (match) {
    let d = match[1].padStart(2, '0');
    let m = match[2].padStart(2, '0');
    let y = match[3];
    if (y.length === 2) {
      y = parseInt(y) > 30 ? '19' + y : '20' + y;
    }
    return `${d}/${m}/${y}`;
  }
  return s;
}

function parseAadharAndPen(val) {
  if (!val) return { aadhar: '', pen: '' };
  const str = String(val).trim();
  const parts = str.split(/[\r\n]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { aadhar: parts[0], pen: parts[1] };
  }
  if (parts.length === 1) {
    const single = parts[0];
    if (single.length > 12) {
      return { aadhar: single.substring(0, 14).trim(), pen: single.substring(14).trim() };
    }
    return { aadhar: single, pen: '' };
  }
  return { aadhar: '', pen: '' };
}

function normalizeGrade(rawClass) {
  const c = rawClass.toUpperCase().trim();
  if (c === 'NURSERY') return 'Nursery';
  if (c === 'LKG') return 'LKG';
  if (c === 'UKG') return 'UKG';
  if (c === 'I' || c === '1' || c === '1ST') return '1st Class';
  if (c === 'II' || c === '2' || c === '2ND') return '2nd Class';
  if (c === 'III' || c === '3' || c === '3RD') return '3rd Class';
  if (c === 'IV' || c === '4' || c === '4TH') return '4th Class';
  if (c === 'V' || c === '5' || c === '5TH') return '5th Class';
  if (c === 'VI' || c === '6' || c === '6TH') return '6th Class';
  if (c === 'VII' || c === '7' || c === '7TH') return '7th Class';
  if (c === 'VIII' || c === '8' || c === '8TH') return '8th Class';
  if (c === 'IX' || c === '9' || c === '9TH') return '9th Class';
  if (c === 'X' || c === '10' || c === '10TH') return '10th Class';
  if (c === 'DOUBLE' || c === 'DOUBLE ') return 'Nursery';
  return `${rawClass} Class`;
}

function getMonthlyFee(grade) {
  if (grade.includes('Nursery')) return 2100;
  if (grade.includes('LKG')) return 2200;
  if (grade.includes('UKG')) return 2300;
  if (grade.includes('1st')) return 2400;
  if (grade.includes('2nd')) return 2500;
  if (grade.includes('3rd')) return 2600;
  if (grade.includes('4th')) return 2700;
  if (grade.includes('5th')) return 2800;
  if (grade.includes('6th')) return 3000;
  if (grade.includes('7th')) return 3200;
  if (grade.includes('8th')) return 3500;
  if (grade.includes('9th')) return 3800;
  if (grade.includes('10th')) return 4300;
  return 2500;
}

const allStudents = [];
const admnSet = new Set();

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let currentClass = sheetName.replace(/[^A-Za-z0-9]/g, '').trim();
  let currentSection = 'A';

  rows.forEach((row) => {
    const rowStr = row.join(' ').toUpperCase();

    if (rowStr.includes('SECTION')) {
      if (rowStr.includes('SECTION B') || rowStr.includes('-B') || rowStr.includes(' B SECTION')) {
        currentSection = 'B';
      } else if (rowStr.includes('SECTION C') || rowStr.includes('-C') || rowStr.includes(' C SECTION')) {
        currentSection = 'C';
      } else if (rowStr.includes('SECTION A') || rowStr.includes('-A') || rowStr.includes(' A SECTION')) {
        currentSection = 'A';
      }
    }

    if (rowStr.includes('CLASS')) {
      const match = rowStr.match(/([IVXLCDM]+|NURSERY|LKG|UKG)\s*-\s*CLASS/i);
      if (match) {
        currentClass = match[1].trim();
      }
    }

    const sNo = row[0];
    const admnNo = cleanStr(row[1]);
    let studentName = cleanStr(row[2]);

    if ((typeof sNo === 'number' || (!isNaN(parseInt(sNo)) && parseInt(sNo) > 0)) &&
        studentName && studentName.length > 1 &&
        !studentName.includes('NAME OF') && !studentName.includes('STUDENT NAME') && !studentName.includes('SECTION')) {

      let fatherName = '';
      let motherName = '';
      let dob = '';
      let casteReligion = '';
      let subCaste = '';
      let admnDate = '';
      let motherTongue = '';
      let aadharPenRaw = '';
      let apaarId = '';
      let fatherPhone = '';
      let motherPhone = '';
      let whatsappPhone = '';

      if (sheetName === 'NURSERY' || sheetName === 'LKG') {
        fatherName = cleanStr(row[5]);
        motherName = cleanStr(row[6]);
        dob = parseDate(row[7]);
        casteReligion = cleanStr(row[8]);
        subCaste = cleanStr(row[9]);
        admnDate = parseDate(row[10]);
        motherTongue = cleanStr(row[11]);
        aadharPenRaw = row[12];
        fatherPhone = cleanStr(row[13]);
        motherPhone = cleanStr(row[14]);
        whatsappPhone = cleanStr(row[15]) || fatherPhone;
      } else if (sheetName === 'DOUBLE ') {
        fatherName = cleanStr(row[3]);
        motherName = cleanStr(row[4]);
        dob = parseDate(row[5]);
        casteReligion = cleanStr(row[6]);
        subCaste = cleanStr(row[7]);
        admnDate = parseDate(row[8]);
        motherTongue = cleanStr(row[9]);
        aadharPenRaw = row[10];
        fatherPhone = cleanStr(row[11]);
        motherPhone = cleanStr(row[12]);
        whatsappPhone = cleanStr(row[13]) || fatherPhone;
      } else {
        fatherName = cleanStr(row[3]);
        motherName = cleanStr(row[4]);
        dob = parseDate(row[5]);
        casteReligion = cleanStr(row[6]);
        subCaste = cleanStr(row[7]);
        admnDate = parseDate(row[8]);
        motherTongue = cleanStr(row[9]);
        aadharPenRaw = row[10];
        apaarId = cleanStr(row[11]);
        fatherPhone = cleanStr(row[12]);
        motherPhone = cleanStr(row[13]);
        whatsappPhone = cleanStr(row[14]) || fatherPhone;
      }

      const { aadhar, pen } = parseAadharAndPen(aadharPenRaw);
      
      let uniqueStudentId = `STV-${admnNo}`;
      if (!admnNo || admnSet.has(uniqueStudentId)) {
        uniqueStudentId = `STV-${admnNo ? admnNo + '-' + (allStudents.length + 1) : (1000 + allStudents.length + 1)}`;
      }
      admnSet.add(uniqueStudentId);

      const normGrade = normalizeGrade(currentClass);
      const monthlyFee = getMonthlyFee(normGrade);
      const contactPhone = fatherPhone || motherPhone || whatsappPhone || '+91 90000 00000';

      // Clean default marks - 0 marks until staff/teachers enter marks
      const zeroMarks = { Telugu: 0, Hindi: 0, English: 0, Maths: 0, Science: 0, Social: 0 };
      const term1Marks = { ...zeroMarks };
      const term2Marks = { ...zeroMarks };
      const term3Marks = { ...zeroMarks };

      allStudents.push({
        id: uniqueStudentId,
        rollNo: String(sNo || (allStudents.length + 1)),
        admnNo: String(admnNo || uniqueStudentId),
        admissionDate: admnDate || '12/06/2026',
        name: studentName,
        gender: 'Not Specified',
        dob: dob || '15/06/2018',
        grade: normGrade,
        section: currentSection,
        status: 'Active',
        studentAadhaar: aadhar || '3645 8912 4401',
        penNo: pen,
        apaarId: apaarId,
        parentName: `${fatherName || motherName || 'Parent'} (Parent of ${studentName})`,
        parentRelation: fatherName ? 'Father' : 'Mother',
        fatherName: fatherName,
        motherName: motherName,
        casteReligion: casteReligion,
        subCaste: subCaste,
        motherTongue: motherTongue || 'Telugu',
        phone: contactPhone,
        whatsappNo: whatsappPhone || contactPhone,
        altPhone: motherPhone || contactPhone,
        address: 'Secunderabad / Hyderabad, Telangana',
        photoUrl: 'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23ffffff"/%3E%3Cpath d="M20,85 C20,62 34,55 50,55 C66,55 80,62 80,85 Z" fill="%23ffffff"/%3E%3C/svg%3E',
        monthlyFee: monthlyFee,
        admissionFee: 5000,
        examFee: 2000,
        totalMonths: 10,
        paidMonths: 0,            // CLEAN: 0 months paid until staff records payments
        isNewStudent: false,
        attendanceHistory: {},
        admissionFeePaid: false,  // CLEAN: false until staff records payment
        examFeePaid: false,       // CLEAN: false until staff records payment
        termMarks: {
          '1st Term Exam': term1Marks,
          '2nd Term Exam': term2Marks,
          'Final Term Exam': term3Marks
        },
        paymentHistory: []        // CLEAN: empty array, waiting for staff entries
      });
    }
  });
});

console.log(`Generated ${allStudents.length} clean student objects (0 initial payments).`);

// Write to JSON file
const outJsonPath = path.join(__dirname, '..', 'data_import', 'all_students.json');
fs.writeFileSync(outJsonPath, JSON.stringify(allStudents, null, 2));
console.log('Saved to:', outJsonPath);
