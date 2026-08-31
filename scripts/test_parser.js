const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data_import', 'Students Particulars-2026 - 2027.xlsx');
const workbook = XLSX.readFile(filePath);

function cleanStr(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

function parseDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = date.y < 100 ? (date.y > 30 ? 1900 + date.y : 2000 + date.y) : date.y;
      return `${String(date.d).padStart(2,'0')}/${String(date.m).padStart(2,'0')}/${y}`;
    }
  }
  let s = String(val).trim().replace(/\s+/g, ' ');
  // Handle DD/MM/YY format
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

const allStudents = [];

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let currentClass = sheetName.replace(/[^A-Za-z0-9]/g, '').trim();
  let currentSection = 'A';

  rows.forEach((row, idx) => {
    const rowStr = row.join(' ').toUpperCase();

    // Check for section headers
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
    const admnNo = row[1];
    let studentName = cleanStr(row[2]);

    // Check if valid student row
    if ((typeof sNo === 'number' || (!isNaN(parseInt(sNo)) && parseInt(sNo) > 0)) &&
        studentName && studentName.length > 1 &&
        !studentName.includes('NAME OF') && !studentName.includes('STUDENT NAME') && !studentName.includes('SECTION')) {

      // Determine column mappings based on sheet structure
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
        // [S.NO, ADMN, STUDENT NAME, CLASS, SECTION, FATHER NAME, MOTHER NAME, DOB, CASTE, SUB CASTE, ADMN DATE, MOTHER TONGUE, AADHAR&PEN, FATHER PH, MOTHER PH, WHATSAPP]
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
        // [S.NO, ADMN NO., NAME, FATHER, MOTHER, DOB, CASTE & RELIGION, SUB CASTE, DATE OF ADMN, MOTHER TONGUE, AADHAR & PEN, APAAR ID, FATHER MOB, MOTHER MOB, WHATSAPP]
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
      const studentId = `STV-${admnNo || (1000 + allStudents.length + 1)}`;
      const contactPhone = fatherPhone || motherPhone || whatsappPhone || '+91 90000 00000';

      allStudents.push({
        student_id: studentId,
        admn_no: String(admnNo || ''),
        roll_no: parseInt(sNo) || (allStudents.length + 1),
        student_name: studentName,
        school_branch: 'ST. VENUS HIGH SCHOOL',
        class: currentClass,
        section: currentSection,
        academic_year: '2026-2027',
        dob: dob,
        father_name: fatherName,
        mother_name: motherName,
        parent_name: fatherName || motherName || 'Parent / Guardian',
        relation: fatherName ? 'Father' : 'Mother',
        contact_phone: contactPhone,
        father_mobile: fatherPhone,
        mother_mobile: motherPhone,
        whatsapp_no: whatsappPhone,
        caste_religion: casteReligion,
        sub_caste: subCaste,
        admission_date: admnDate,
        mother_tongue: motherTongue,
        aadhar_number: aadhar,
        pen_number: pen,
        apaar_id: apaarId
      });
    }
  });
});

console.log(`\n✅ Successfully parsed ${allStudents.length} total students from Excel!`);
console.log('\nFirst 3 parsed students:');
console.log(allStudents.slice(0, 3));
console.log('\nLast 3 parsed students:');
console.log(allStudents.slice(-3));
