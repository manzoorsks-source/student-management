const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Reading index.html, length:', content.length);

// 1. Add RWPS helpers right after getStudentSubjectEntry
const oldHelpersLoc = `    function getStudentSubjectEntry(student, exKey, subItem) {`;

const newHelpers = `    function isHighSchoolWithRWPS(grade) {
      if (!grade) return false;
      const norm = normalizeClassCode(grade);
      return norm === '8' || norm === '9' || norm === '10';
    }

    function getStudentSubjectRWPS(student, exKey, subjectName) {
      const tData = findExamData(student, exKey);
      if (!tData) return null;

      // 1. Direct _rwps object lookup
      if (tData._rwps && typeof tData._rwps === 'object') {
        if (tData._rwps[subjectName]) return tData._rwps[subjectName];
        const targetClean = subjectName.toLowerCase().replace(/[\\s\\-_().]/g, '');
        for (const k in tData._rwps) {
          if (k.toLowerCase().replace(/[\\s\\-_().]/g, '') === targetClean) {
            return tData._rwps[k];
          }
        }
      }

      // 2. Direct subject__rwps key lookup
      if (tData[subjectName + '__rwps'] && typeof tData[subjectName + '__rwps'] === 'object') {
        return tData[subjectName + '__rwps'];
      }

      // 3. Subkeys _r, _w, _p, _s lookup
      const cleanKey = subjectName.replace(/\\s+/g, '_');
      if (tData[cleanKey + '_r'] !== undefined || tData[cleanKey + '_w'] !== undefined || tData[cleanKey + '_p'] !== undefined || tData[cleanKey + '_s'] !== undefined) {
        return {
          r: tData[cleanKey + '_r'],
          w: tData[cleanKey + '_w'],
          p: tData[cleanKey + '_p'],
          s: tData[cleanKey + '_s']
        };
      }

      return null;
    }

    function updateModalRWPSLive(cleanKey, maxMarksNum) {
      const rInp = document.getElementById('sub_r_' + cleanKey);
      const wInp = document.getElementById('sub_w_' + cleanKey);
      const pInp = document.getElementById('sub_p_' + cleanKey);
      const sInp = document.getElementById('sub_s_' + cleanKey);
      const totalInp = document.getElementById('sub_mark_' + cleanKey);

      if (!totalInp) return;

      const rVal = rInp ? rInp.value.trim() : '';
      const wVal = wInp ? wInp.value.trim() : '';
      const pVal = pInp ? pInp.value.trim() : '';
      const sVal = sInp ? sInp.value.trim() : '';

      const hasAny = rVal !== '' || wVal !== '' || pVal !== '' || sVal !== '';
      if (hasAny) {
        const r = parseFloat(rVal) || 0;
        const w = parseFloat(wVal) || 0;
        const p = parseFloat(pVal) || 0;
        const s = parseFloat(sVal) || 0;
        let sum = Math.round((r + w + p + s) * 10) / 10;
        const maxLimit = parseFloat(maxMarksNum) || 20;

        if (sum > maxLimit) {
          sum = maxLimit;
          if (typeof showToast === 'function') {
            showToast('⚠️ RWPS components cannot exceed Max Limit (' + maxLimit + ')! Capped to ' + maxLimit);
          }
        }
        totalInp.value = sum.toString();
      }
    }

    function getStudentSubjectEntry(student, exKey, subItem) {`;

if (!content.includes(oldHelpersLoc)) {
  console.error('Could not find oldHelpersLoc in index.html');
  process.exit(1);
}

content = content.replace(oldHelpersLoc, newHelpers);

// 2. Replace renderFaCardHtml in Modal 4 (printReportCard)
const oldFaCardStart = `        // 2. FORMATIVE ASSESSMENT CARD HTML GENERATOR (FA1, FA2, FA3, FA4)
        const renderFaCardHtml = (faCode) => {
          let faObtainedSum = 0;
          let faMaxSum = 0;
          let enteredCount = 0;

          const faRows = subjectsForCard.map((item, idx) => {
            const entry = getStudentSubjectEntry(s, faCode, item);
            const faLimit = item.faMax;

            if (entry.entered) {
              const obt = entry.mark;
              if (!item.isOptional) {
                faObtainedSum += obt;
                faMaxSum += faLimit;
                enteredCount++;
              }

              // Component breakdown (Read & Reflection, Written Work, Project Work, Slip Test)
              const slipTest = Math.round(obt * 0.25);
              const project = Math.round(obt * 0.25);
              const written = Math.round(obt * 0.25);
              const readRef = obt - (slipTest + project + written);
              const subGrade = calculateGradeAndGPA((obt / faLimit) * 100).grade;

              return {
                label: item.label,
                isOptional: item.isOptional,
                readRef, written, project, slipTest,
                totalObt: \`\${obt} / \${faLimit}\`,
                grade: subGrade
              };
            } else {
              return {
                label: item.label,
                isOptional: item.isOptional,
                readRef: '--',
                written: '--',
                project: '--',
                slipTest: '--',
                totalObt: \`-- / \${faLimit}\`,
                grade: '--'
              };
            }
          });

          const hasMarks = enteredCount > 0 && faMaxSum > 0;
          const faPct = hasMarks ? ((faObtainedSum / faMaxSum) * 100).toFixed(1) : '0.0';
          const faGradeInfo = hasMarks ? calculateGradeAndGPA(faPct) : { grade: '--', gpa: '--' };

          return \`
            <div class="bg-sky-50/40 border-2 border-sky-800 rounded-3xl p-6 space-y-5 shadow-sm text-xs font-semibold">
              <!-- HEADER TITLE BANNER MATCHING IMAGE 2 -->
              <div class="flex flex-wrap justify-between items-center border-b-2 border-sky-800 pb-3 gap-2">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-sky-800 text-sky-200 font-black rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-sky-300">
                    SV
                  </div>
                  <div>
                    <h2 class="text-xl font-black text-sky-950 uppercase font-display tracking-tight">ST. VENUS HIGH SCHOOL</h2>
                    <p class="text-[11px] font-bold text-slate-600 uppercase">New Ramnagar Colony, Chilkanagar, Uppal, Hyderabad • Academic Year 2026–2027</p>
                  </div>
                </div>
                <div class="bg-sky-800 text-white px-4 py-2 rounded-2xl text-center shadow-md">
                  <span class="block text-[10px] text-sky-200 font-bold uppercase">FORMATIVE ASSESSMENT</span>
                  <span class="text-sm font-black uppercase tracking-wider">\${faCode}</span>
                </div>
              </div>

              <!-- STUDENT DETAILS ROW -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-sky-200">
                <div><span class="text-slate-500 font-bold">Student:</span> <strong class="text-sky-950 font-black">\${s.name}</strong></div>
                <div><span class="text-slate-500 font-bold">Class & Sec:</span> <strong class="text-slate-900">\${s.grade} - \${s.section}</strong></div>
                <div><span class="text-slate-500 font-bold">Admn No:</span> <strong class="font-mono text-slate-900">\${s.admnNo || s.id}</strong></div>
                <div><span class="text-slate-500 font-bold">Roll No:</span> <strong class="font-mono text-slate-900">#\${s.rollNo}</strong></div>
              </div>

              <!-- CURRICULAR SUBJECTS TABLE WITH FA COMPONENTS (EXACT MATCHING IMAGE 2) -->
              <div class="overflow-x-auto bg-white rounded-xl border border-sky-800">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-sky-800 text-white font-black text-center text-[11px]">
                      <th class="p-2 border-r border-sky-700 w-10">Sl No.</th>
                      <th class="p-2 border-r border-sky-700 text-left bg-sky-900">SUBJECTS (CURRICULAR SUBJECTS)</th>
                      <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-24">Read & Reflection</th>
                      <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-24">Written Work</th>
                      <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-24">Project Work</th>
                      <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-20">Slip Test</th>
                      <th class="p-2 border-r border-sky-700 bg-emerald-800 text-white w-20">Marks</th>
                      <th class="p-2 bg-sky-950 text-white w-16">Grade</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-300 font-bold text-center">
                    \${faRows.map((row, idx) => \`
                      <tr class="hover:bg-sky-50/50">
                        <td class="p-2 border-r border-slate-300 text-slate-500">\${idx + 1}</td>
                        <td class="p-2 border-r border-slate-300 text-left font-extrabold text-slate-900 bg-slate-50">\${row.label}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.readRef}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.written}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.project}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.slipTest}</td>
                        <td class="p-2 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-50">\${row.totalObt}</td>
                        <td class="p-2 font-black text-sky-950 bg-sky-50">\${row.grade}</td>
                      </tr>
                    \`).join('')}
                    <tr class="bg-sky-100 text-sky-950 font-black text-center border-t-2 border-sky-800">
                      <td colspan="2" class="p-2 text-left uppercase font-black tracking-wider">TOTAL FORMATIVE SCORE</td>
                      <td colspan="4" class="p-2 text-sky-800 font-medium">Cumulative Component Aggregate</td>
                      <td class="p-2 font-mono text-base font-black text-emerald-950 bg-emerald-100">\${hasMarks ? \`\${faObtainedSum} / \${faMaxSum}\` : '--'}</td>
                      <td class="p-2 text-base font-black text-sky-950 bg-sky-200">\${faGradeInfo.grade}</td>
                    </tr>
                  </tbody>
                </table>
              </div>`;

const newFaCard = `        // 2. FORMATIVE ASSESSMENT CARD HTML GENERATOR (FA1, FA2, FA3, FA4)
        const renderFaCardHtml = (faCode) => {
          let faObtainedSum = 0;
          let faMaxSum = 0;
          let enteredCount = 0;
          const isHighSchool = isHighSchoolWithRWPS(s.grade);

          const faRows = subjectsForCard.map((item, idx) => {
            const entry = getStudentSubjectEntry(s, faCode, item);
            const faLimit = item.faMax;

            if (entry.entered) {
              const obt = entry.mark;
              if (!item.isOptional) {
                faObtainedSum += obt;
                faMaxSum += faLimit;
                enteredCount++;
              }

              // Retrieve manually entered RWPS components if available
              const rwps = getStudentSubjectRWPS(s, faCode, item.key || item.name);
              let readRef = '--';
              let written = '--';
              let project = '--';
              let slipTest = '--';

              if (rwps && (rwps.r !== undefined || rwps.w !== undefined || rwps.p !== undefined || rwps.s !== undefined)) {
                readRef = (rwps.r !== undefined && rwps.r !== '' && rwps.r !== null) ? rwps.r : '--';
                written = (rwps.w !== undefined && rwps.w !== '' && rwps.w !== null) ? rwps.w : '--';
                project = (rwps.p !== undefined && rwps.p !== '' && rwps.p !== null) ? rwps.p : '--';
                slipTest = (rwps.s !== undefined && rwps.s !== '' && rwps.s !== null) ? rwps.s : '--';
              }

              const subGrade = calculateGradeAndGPA((obt / faLimit) * 100).grade;

              return {
                label: item.label,
                isOptional: item.isOptional,
                readRef, written, project, slipTest,
                totalObt: \`\${obt} / \${faLimit}\`,
                rawObt: obt,
                faLimit: faLimit,
                grade: subGrade
              };
            } else {
              return {
                label: item.label,
                isOptional: item.isOptional,
                readRef: '--',
                written: '--',
                project: '--',
                slipTest: '--',
                totalObt: \`-- / \${faLimit}\`,
                rawObt: '--',
                faLimit: faLimit,
                grade: '--'
              };
            }
          });

          const hasMarks = enteredCount > 0 && faMaxSum > 0;
          const faPct = hasMarks ? ((faObtainedSum / faMaxSum) * 100).toFixed(1) : '0.0';
          const faGradeInfo = hasMarks ? calculateGradeAndGPA(faPct) : { grade: '--', gpa: '--' };

          return \`
            <div class="bg-sky-50/40 border-2 border-sky-800 rounded-3xl p-6 space-y-5 shadow-sm text-xs font-semibold">
              <!-- HEADER TITLE BANNER MATCHING IMAGE 2 -->
              <div class="flex flex-wrap justify-between items-center border-b-2 border-sky-800 pb-3 gap-2">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-sky-800 text-sky-200 font-black rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-sky-300">
                    SV
                  </div>
                  <div>
                    <h2 class="text-xl font-black text-sky-950 uppercase font-display tracking-tight">ST. VENUS HIGH SCHOOL</h2>
                    <p class="text-[11px] font-bold text-slate-600 uppercase">New Ramnagar Colony, Chilkanagar, Uppal, Hyderabad • Academic Year 2026–2027</p>
                  </div>
                </div>
                <div class="bg-sky-800 text-white px-4 py-2 rounded-2xl text-center shadow-md">
                  <span class="block text-[10px] text-sky-200 font-bold uppercase">FORMATIVE ASSESSMENT</span>
                  <span class="text-sm font-black uppercase tracking-wider">\${faCode}</span>
                </div>
              </div>

              <!-- STUDENT DETAILS ROW -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-sky-200">
                <div><span class="text-slate-500 font-bold">Student:</span> <strong class="text-sky-950 font-black">\${s.name}</strong></div>
                <div><span class="text-slate-500 font-bold">Class & Sec:</span> <strong class="text-slate-900">\${s.grade} - \${s.section}</strong></div>
                <div><span class="text-slate-500 font-bold">Admn No:</span> <strong class="font-mono text-slate-900">\${s.admnNo || s.id}</strong></div>
                <div><span class="text-slate-500 font-bold">Roll No:</span> <strong class="font-mono text-slate-900">#\${s.rollNo}</strong></div>
              </div>

              <!-- CURRICULAR SUBJECTS TABLE (8TH, 9TH, 10TH WITH RWPS; NURSERY TO 7TH STANDARD) -->
              <div class="overflow-x-auto bg-white rounded-xl border border-sky-800">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    \${isHighSchool ? \`
                      <tr class="bg-sky-800 text-white font-black text-center text-[11px]">
                        <th class="p-2 border-r border-sky-700 w-10">Sl No.</th>
                        <th class="p-2 border-r border-sky-700 text-left bg-sky-900">SUBJECTS (CURRICULAR SUBJECTS)</th>
                        <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-24">Read & Reflection</th>
                        <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-24">Written Work</th>
                        <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-24">Project Work</th>
                        <th class="p-2 border-r border-sky-700 bg-amber-700 text-slate-950 w-20">Slip Test</th>
                        <th class="p-2 border-r border-sky-700 bg-emerald-800 text-white w-20">Marks</th>
                        <th class="p-2 bg-sky-950 text-white w-16">Grade</th>
                      </tr>
                    \` : \`
                      <tr class="bg-sky-800 text-white font-black text-center text-[11px]">
                        <th class="p-2 border-r border-sky-700 w-12">Sl No.</th>
                        <th class="p-2 border-r border-sky-700 text-left bg-sky-900">SUBJECTS (CURRICULAR SUBJECTS)</th>
                        <th class="p-2 border-r border-sky-700 bg-indigo-900 text-white w-28">Max Marks</th>
                        <th class="p-2 border-r border-sky-700 bg-emerald-800 text-white w-32">Marks Obtained</th>
                        <th class="p-2 bg-sky-950 text-white w-20">Grade</th>
                      </tr>
                    \`}
                  </thead>
                  <tbody class="divide-y divide-slate-300 font-bold text-center">
                    \${isHighSchool ? faRows.map((row, idx) => \`
                      <tr class="hover:bg-sky-50/50">
                        <td class="p-2 border-r border-slate-300 text-slate-500">\${idx + 1}</td>
                        <td class="p-2 border-r border-slate-300 text-left font-extrabold text-slate-900 bg-slate-50">\${row.label}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.readRef}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.written}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.project}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.slipTest}</td>
                        <td class="p-2 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-50">\${row.totalObt}</td>
                        <td class="p-2 font-black text-sky-950 bg-sky-50">\${row.grade}</td>
                      </tr>
                    \`).join('') : faRows.map((row, idx) => \`
                      <tr class="hover:bg-sky-50/50">
                        <td class="p-2 border-r border-slate-300 text-slate-500">\${idx + 1}</td>
                        <td class="p-2 border-r border-slate-300 text-left font-extrabold text-slate-900 bg-slate-50">\${row.label}</td>
                        <td class="p-2 border-r border-slate-300 font-mono text-slate-700">\${row.faLimit}</td>
                        <td class="p-2 border-r border-slate-300 font-mono font-black text-emerald-950 bg-emerald-50">\${row.totalObt}</td>
                        <td class="p-2 font-black text-sky-950 bg-sky-50">\${row.grade}</td>
                      </tr>
                    \`).join('')}
                    <tr class="bg-sky-100 text-sky-950 font-black text-center border-t-2 border-sky-800">
                      <td colspan="2" class="p-2 text-left uppercase font-black tracking-wider">TOTAL FORMATIVE SCORE</td>
                      \${isHighSchool ? \`
                        <td colspan="4" class="p-2 text-sky-800 font-medium">Cumulative Component Aggregate</td>
                        <td class="p-2 font-mono text-base font-black text-emerald-950 bg-emerald-100">\${hasMarks ? \`\${faObtainedSum} / \${faMaxSum}\` : '--'}</td>
                        <td class="p-2 text-base font-black text-sky-950 bg-sky-200">\${faGradeInfo.grade}</td>
                      \` : \`
                        <td class="p-2 font-mono text-slate-700">\${faMaxSum}</td>
                        <td class="p-2 font-mono text-base font-black text-emerald-950 bg-emerald-100">\${hasMarks ? \`\${faObtainedSum} / \${faMaxSum}\` : '--'}</td>
                        <td class="p-2 text-base font-black text-sky-950 bg-sky-200">\${faGradeInfo.grade}</td>
                      \`}
                    </tr>
                  </tbody>
                </table>
              </div>\`;

if (!content.includes(oldFaCardStart)) {
  console.error('Could not find oldFaCardStart in index.html');
  process.exit(1);
}

content = content.replace(oldFaCardStart, newFaCard);

// 3. Update Modal 3: EDIT MARKS modal to support manual RWPS entry for 8th, 9th, 10th
const oldEditMarksModal = `      // MODAL 3: EDIT MARKS
      if (state.activeModal === 'editMarks' && state.modalStudent) {
        const currentTerm = state.modalSelectedTerm || 'FA1';
        const currentMarks = state.modalStudent.termMarks?.[currentTerm] || {};
        const subjectsDetailed = getClassSubjectsDetailed(state.modalStudent.grade, currentTerm);
        const isFA = currentTerm.startsWith('FA');
        const termMax = isFA ? 20 : 100;

        return \`
          <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div class="bg-white border text-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
              <div class="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 class="text-base font-bold text-slate-900">Enter Assessment Marks</h3>
                  <p class="text-xs text-slate-500 font-semibold">\${currentTerm} • Max \${termMax} Marks Per Subject</p>
                </div>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
              </div>

              <form onsubmit="saveStudentMarks(event)" class="space-y-4 text-xs font-medium">
                <div class="bg-slate-50 p-3 rounded-xl border flex justify-between items-center">
                  <div>
                    <p class="font-black text-indigo-900 text-sm">\${state.modalStudent.name}</p>
                    <p class="text-slate-500 font-semibold">\${state.modalStudent.grade} - Section \${state.modalStudent.section} (Roll #\${state.modalStudent.rollNo})</p>
                  </div>
                  <span class="px-3 py-1 bg-indigo-100 text-indigo-900 font-black rounded-xl text-xs">\${currentTerm}</span>
                </div>

                <div>
                  <label class="block text-slate-700 mb-1 font-bold">Select Assessment Term</label>
                  <select id="examTermInput" onchange="changeModalTerm(this.value)" class="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold text-indigo-700">
                    \${DEFAULT_EXAMS.map(e => \`<option value="\${e.code}" \${currentTerm === e.code ? 'selected' : ''}>\${e.code} – \${e.name ? e.name.replace(/^[A-Z0-9]+\\s*[–-]\\s*/, '') : e.code} (Max \${e.maxMarks})</option>\`).join('')}
                  </select>
                </div>

                <div class="space-y-2 border-t pt-3">
                  <p class="font-bold text-slate-800">Marks for \${currentTerm} (Out of \${termMax} Each):</p>
                  <div class="grid grid-cols-2 gap-3">
                    \${subjectsDetailed.map(subObj => \`
                      <div>
                        <label class="block text-slate-700 mb-1 font-bold">\${subObj.name} <span class="text-[10px] text-slate-400 font-normal">(Max \${subObj.maxMarks})</span></label>
                        <input type="text" id="sub_mark_\${subObj.name.replace(/\\s+/g, '_')}" value="\${currentMarks[subObj.name] !== undefined ? currentMarks[subObj.name] : ''}" placeholder="0" class="w-full bg-slate-50 border rounded-xl px-3 py-1.5 font-bold text-slate-900 text-sm" />
                      </div>
                    \`).join('')}
                  </div>
                </div>

                  <button type="button" onclick="closeModal()" class="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-700">Cancel</button>
                  <button type="submit" class="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md">Save Term Marks</button>
                </div>
              </form>
            </div>
          </div>
        \`;
      }`;

const newEditMarksModal = `      // MODAL 3: EDIT MARKS & MANUAL RWPS ENTRY
      if (state.activeModal === 'editMarks' && state.modalStudent) {
        const currentTerm = state.modalSelectedTerm || 'FA1';
        const currentMarks = state.modalStudent.termMarks?.[currentTerm] || {};
        const subjectsDetailed = getClassSubjectsDetailed(state.modalStudent.grade, currentTerm);
        const isFA = currentTerm.startsWith('FA');
        const isHighSchool = isHighSchoolWithRWPS(state.modalStudent.grade) && isFA;
        const termMax = isFA ? 20 : 100;

        return \`
          <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div class="bg-white border text-slate-900 rounded-3xl \${isHighSchool ? 'max-w-3xl' : 'max-w-lg'} w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
              <div class="flex justify-between items-center border-b pb-3 shrink-0">
                <div>
                  <h3 class="text-lg font-black text-slate-900 font-display">
                    \${isHighSchool ? 'Assessment Marks & RWPS Entry Console' : 'Enter Assessment Marks'}
                  </h3>
                  <p class="text-xs text-slate-500 font-semibold">
                    \${currentTerm} • \${isHighSchool ? 'Manual R, W, P, S Entry (8th–10th) with Live Auto-Sum & Validation' : 'Max ' + termMax + ' Marks Per Subject'}
                  </p>
                </div>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">✕</button>
              </div>

              <form onsubmit="saveStudentMarks(event)" class="space-y-4 text-xs font-medium overflow-y-auto pr-1 flex-1">
                <div class="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <p class="font-black text-indigo-950 text-sm">\${state.modalStudent.name}</p>
                    <p class="text-slate-600 font-semibold">\${state.modalStudent.grade} - Section \${state.modalStudent.section} (Roll #\${state.modalStudent.rollNo} • Admn #\${state.modalStudent.admnNo || state.modalStudent.id})</p>
                  </div>
                  <span class="px-3 py-1 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase shadow-sm">\${currentTerm}</span>
                </div>

                <div>
                  <label class="block text-slate-700 mb-1 font-bold">Select Assessment Term</label>
                  <select id="examTermInput" onchange="changeModalTerm(this.value)" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-900 cursor-pointer">
                    \${DEFAULT_EXAMS.map(e => \`<option value="\${e.code}" \${currentTerm === e.code ? 'selected' : ''}>\${e.code} – \${e.name ? e.name.replace(/^[A-Z0-9]+\\s*[–-]\\s*/, '') : e.code} (Max \${e.maxMarks})</option>\`).join('')}
                  </select>
                </div>

                \${isHighSchool ? \`
                  <!-- HIGH SCHOOL (8TH, 9TH, 10TH) RWPS COMPONENT ENTRY TABLE -->
                  <div class="space-y-2 border-t pt-3">
                    <div class="flex justify-between items-center">
                      <p class="font-black text-slate-800 text-xs uppercase tracking-wide">
                        📝 Curricular Subjects & RWPS Components (Max 20/10 Each):
                      </p>
                      <span class="text-[11px] text-indigo-700 font-bold">💡 R + W + P + S auto-calculates Total Marks</span>
                    </div>

                    <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50">
                      <table class="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr class="bg-slate-900 text-white font-bold text-center text-[11px]">
                            <th class="py-2.5 px-3 text-left bg-indigo-950">Subject Name</th>
                            <th class="py-2.5 px-2 bg-amber-800 text-white w-20">Read (R)</th>
                            <th class="py-2.5 px-2 bg-amber-800 text-white w-20">Write (W)</th>
                            <th class="py-2.5 px-2 bg-amber-800 text-white w-20">Project (P)</th>
                            <th class="py-2.5 px-2 bg-amber-800 text-white w-20">Slip (S)</th>
                            <th class="py-2.5 px-3 bg-emerald-900 text-white w-28">Total Marks</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 font-semibold text-slate-800">
                          \${subjectsDetailed.map(subObj => {
                            const cleanKey = subObj.name.replace(/\\s+/g, '_');
                            const subMax = subObj.maxMarks || 20;
                            const rwps = getStudentSubjectRWPS(state.modalStudent, currentTerm, subObj.name) || {};
                            const curTotal = currentMarks[subObj.name] !== undefined ? currentMarks[subObj.name] : '';

                            return \`
                              <tr class="hover:bg-white transition-colors">
                                <td class="py-2 px-3 font-bold text-slate-900">
                                  \${subObj.name}
                                  <div class="text-[10px] text-indigo-600 font-normal">Max \${subMax} \${subObj.isOptional ? '(Optional)' : ''}</div>
                                </td>
                                <td class="py-2 px-1 text-center">
                                  <input type="number" step="0.5" min="0" max="\${subMax}"
                                    id="sub_r_\${cleanKey}"
                                    value="\${rwps.r !== undefined && rwps.r !== null ? rwps.r : ''}"
                                    placeholder="-"
                                    oninput="updateModalRWPSLive('\${cleanKey}', '\${subMax}')"
                                    class="w-16 bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                                  />
                                </td>
                                <td class="py-2 px-1 text-center">
                                  <input type="number" step="0.5" min="0" max="\${subMax}"
                                    id="sub_w_\${cleanKey}"
                                    value="\${rwps.w !== undefined && rwps.w !== null ? rwps.w : ''}"
                                    placeholder="-"
                                    oninput="updateModalRWPSLive('\${cleanKey}', '\${subMax}')"
                                    class="w-16 bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                                  />
                                </td>
                                <td class="py-2 px-1 text-center">
                                  <input type="number" step="0.5" min="0" max="\${subMax}"
                                    id="sub_p_\${cleanKey}"
                                    value="\${rwps.p !== undefined && rwps.p !== null ? rwps.p : ''}"
                                    placeholder="-"
                                    oninput="updateModalRWPSLive('\${cleanKey}', '\${subMax}')"
                                    class="w-16 bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                                  />
                                </td>
                                <td class="py-2 px-1 text-center">
                                  <input type="number" step="0.5" min="0" max="\${subMax}"
                                    id="sub_s_\${cleanKey}"
                                    value="\${rwps.s !== undefined && rwps.s !== null ? rwps.s : ''}"
                                    placeholder="-"
                                    oninput="updateModalRWPSLive('\${cleanKey}', '\${subMax}')"
                                    class="w-16 bg-white border border-slate-300 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                                  />
                                </td>
                                <td class="py-2 px-2 text-center">
                                  <input type="text"
                                    id="sub_mark_\${cleanKey}"
                                    value="\${curTotal}"
                                    placeholder="0"
                                    class="w-20 bg-emerald-50 border border-emerald-300 font-mono font-black text-emerald-950 rounded-lg py-1 px-2 text-center text-xs focus:ring-2 focus:ring-emerald-500"
                                  />
                                </td>
                              </tr>
                            \`;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                \` : \`
                  <!-- STANDARD MARKS ENTRY (NURSERY TO 7TH CLASS OR SA EXAMS) -->
                  <div class="space-y-2 border-t pt-3">
                    <p class="font-bold text-slate-800">Marks for \${currentTerm} (Out of \${termMax} Each):</p>
                    <div class="grid grid-cols-2 gap-3">
                      \${subjectsDetailed.map(subObj => {
                        const cleanKey = subObj.name.replace(/\\s+/g, '_');
                        return \`
                          <div>
                            <label class="block text-slate-700 mb-1 font-bold">\${subObj.name} <span class="text-[10px] text-slate-400 font-normal">(Max \${subObj.maxMarks})</span></label>
                            <input type="text" id="sub_mark_\${cleanKey}" value="\${currentMarks[subObj.name] !== undefined ? currentMarks[subObj.name] : ''}" placeholder="0" class="w-full bg-slate-50 border rounded-xl px-3 py-1.5 font-bold text-slate-900 text-sm" />
                          </div>
                        \`;
                      }).join('')}
                    </div>
                  </div>
                \`}

                <div class="pt-3 border-t flex justify-end space-x-2 shrink-0">
                  <button type="button" onclick="closeModal()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700">Cancel</button>
                  <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all">💾 Save Assessment Marks</button>
                </div>
              </form>
            </div>
          </div>
        \`;
      }`;

if (!content.includes(oldEditMarksModal)) {
  console.error('Could not find oldEditMarksModal in index.html');
  process.exit(1);
}

content = content.replace(oldEditMarksModal, newEditMarksModal);

// 4. Update saveStudentMarks handler to save both subject total and RWPS breakdown
const oldSaveMarksHandler = `    // MODAL SUBMIT HANDLERS
    function saveStudentMarks(e) {
      e.preventDefault();
      if (!state.modalStudent) return;
      const term = document.getElementById('examTermInput').value;
      const subjectsDetailed = getClassSubjectsDetailed(state.modalStudent.grade, term);
      const newTermMarks = {};
      subjectsDetailed.forEach(subObj => {
        const inp = document.getElementById(\`sub_mark_\${subObj.name.replace(/\\s+/g, '_')}\`);
        newTermMarks[subObj.name] = inp ? inp.value.trim().toUpperCase() : '';
      });

      let updatedStudentRecord = null;
      state.students = state.students.map(s => {
        if (s.id === state.modalStudent.id) {
          const updatedTermMarks = { ...(s.termMarks || {}), [term]: newTermMarks };
          updatedStudentRecord = { ...s, termMarks: updatedTermMarks };
          return updatedStudentRecord;
        }
        return s;
      });

      if (updatedStudentRecord) {
        CloudSync.saveStudentMarks(updatedStudentRecord.id, term, newTermMarks, updatedStudentRecord);
      }
      saveState();
      closeModal();
      showToast('Changes saved successfully.');
    }`;

const newSaveMarksHandler = `    // MODAL SUBMIT HANDLERS
    function saveStudentMarks(e) {
      e.preventDefault();
      if (!state.modalStudent) return;
      const term = document.getElementById('examTermInput').value;
      const subjectsDetailed = getClassSubjectsDetailed(state.modalStudent.grade, term);
      const isFA = term.startsWith('FA');
      const isHighSchool = isHighSchoolWithRWPS(state.modalStudent.grade) && isFA;

      const existingTermMarks = state.modalStudent.termMarks?.[term] || {};
      const newTermMarks = { ...existingTermMarks };
      const rwpsData = { ...(newTermMarks._rwps || {}) };

      subjectsDetailed.forEach(subObj => {
        const subName = subObj.name;
        const cleanKey = subName.replace(/\\s+/g, '_');
        const totalInp = document.getElementById(\`sub_mark_\${cleanKey}\`);
        const rInp = document.getElementById(\`sub_r_\${cleanKey}\`);
        const wInp = document.getElementById(\`sub_w_\${cleanKey}\`);
        const pInp = document.getElementById(\`sub_p_\${cleanKey}\`);
        const sInp = document.getElementById(\`sub_s_\${cleanKey}\`);

        let totalVal = totalInp ? totalInp.value.trim().toUpperCase() : '';
        let rVal = rInp ? rInp.value.trim() : '';
        let wVal = wInp ? wInp.value.trim() : '';
        let pVal = pInp ? pInp.value.trim() : '';
        let sVal = sInp ? sInp.value.trim() : '';

        const hasAnyRWPS = rVal !== '' || wVal !== '' || pVal !== '' || sVal !== '';

        if (hasAnyRWPS) {
          const rNum = parseFloat(rVal) || 0;
          const wNum = parseFloat(wVal) || 0;
          const pNum = parseFloat(pVal) || 0;
          const sNum = parseFloat(sVal) || 0;
          let rwpsSum = Math.round((rNum + wNum + pNum + sNum) * 10) / 10;
          const maxLimit = subObj.maxMarks || (isFA ? 20 : 100);

          // Validation: RWPS total cannot exceed subject max marks
          if (rwpsSum > maxLimit) rwpsSum = maxLimit;

          rwpsData[subName] = {
            r: rVal !== '' ? (parseFloat(rVal) || 0) : '',
            w: wVal !== '' ? (parseFloat(wVal) || 0) : '',
            p: pVal !== '' ? (parseFloat(pVal) || 0) : '',
            s: sVal !== '' ? (parseFloat(sVal) || 0) : '',
            total: rwpsSum
          };

          newTermMarks[subName] = totalVal !== '' ? totalVal : rwpsSum.toString();
        } else {
          if (totalVal !== '') {
            newTermMarks[subName] = totalVal;
          }
        }
      });

      if (isHighSchool && Object.keys(rwpsData).length > 0) {
        newTermMarks._rwps = rwpsData;
      }

      let updatedStudentRecord = null;
      state.students = state.students.map(s => {
        if (s.id === state.modalStudent.id) {
          const updatedTermMarks = { ...(s.termMarks || {}), [term]: newTermMarks };
          updatedStudentRecord = { ...s, termMarks: updatedTermMarks };
          return updatedStudentRecord;
        }
        return s;
      });

      if (updatedStudentRecord) {
        CloudSync.saveStudentMarks(updatedStudentRecord.id, term, newTermMarks, updatedStudentRecord);
      }
      saveState();
      closeModal();
      showToast('✅ Assessment marks and RWPS components saved successfully.');
    }`;

if (!content.includes(oldSaveMarksHandler)) {
  console.error('Could not find oldSaveMarksHandler in index.html');
  process.exit(1);
}

content = content.replace(oldSaveMarksHandler, newSaveMarksHandler);

// 5. Add openEditMarksModal trigger button into the spreadsheet actions column
const oldActionCol = `                                  <td class="py-2.5 px-3 text-right space-x-1.5 shrink-0">
                                    <button onclick="openStudentProgressReportModal('\${s.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg shadow-2xs text-[11px]">
                                      📜 Report
                                    </button>
                                  </td>`;

const newActionCol = `                                  <td class="py-2.5 px-3 text-right space-x-1.5 shrink-0">
                                    <button onclick="openEditMarksModal('\${s.id}', '\${currentExam}')" class="bg-amber-600 hover:bg-amber-700 text-white font-black px-2.5 py-1 rounded-lg shadow-2xs text-[11px]">
                                      ✏️ \${isHighSchoolWithRWPS(s.grade) ? 'RWPS' : 'Marks'}
                                    </button>
                                    <button onclick="openStudentProgressReportModal('\${s.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg shadow-2xs text-[11px]">
                                      📜 Report
                                    </button>
                                  </td>`;

if (content.includes(oldActionCol)) {
  content = content.replace(oldActionCol, newActionCol);
}

// 6. Update openEditMarksModal to accept optional term parameter
const oldOpenEditMarks = `    function openEditMarksModal(id) {
      const s = state.students.find(st => st.id === id);
      if (s) {
        state.modalStudent = s;
        state.modalSelectedTerm = '1st Term Exam';
        state.activeModal = 'editMarks';
        saveState();
      }
    }`;

const newOpenEditMarks = `    function openEditMarksModal(id, termName) {
      const s = state.students.find(st => st.id === id);
      if (s) {
        state.modalStudent = s;
        state.modalSelectedTerm = termName || state.selectedExamFilter || 'FA1';
        state.activeModal = 'editMarks';
        saveState();
      }
    }`;

if (content.includes(oldOpenEditMarks)) {
  content = content.replace(oldOpenEditMarks, newOpenEditMarks);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully applied RWPS enhancements to index.html! New length:', content.length);
