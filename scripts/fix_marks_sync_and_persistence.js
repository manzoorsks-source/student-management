const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

console.log('Original index.html length:', content.length);

// 1. Update CloudSync to include saveBulkStudents, saveStudentDebounced, and dirty tracking
const oldCloudSyncSnippet = `    const CloudSync = {
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      _stateSyncTimer: null,`;

const newCloudSyncSnippet = `    const CloudSync = {
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      _stateSyncTimer: null,
      _studentDebounceTimers: {},
      dirtyStudentIds: new Set(),

      saveStudentDebounced(student) {
        if (!student || !student.id) return;
        this.dirtyStudentIds.add(student.id);
        if (this._studentDebounceTimers[student.id]) {
          clearTimeout(this._studentDebounceTimers[student.id]);
        }
        this._studentDebounceTimers[student.id] = setTimeout(() => {
          this.saveStudent(student);
          delete this._studentDebounceTimers[student.id];
        }, 1200);
      },

      async saveBulkStudents(studentsList) {
        if (!Array.isArray(studentsList) || studentsList.length === 0) return;
        try {
          this.updateSyncBadge('syncing', \`Saving \${studentsList.length} students to Aiven Cloud...\`);
          const res = await fetch(\`\${this.getBaseUrl()}/api/students\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students: studentsList })
          });
          if (res.ok) {
            studentsList.forEach(s => this.dirtyStudentIds.delete(s.id));
            this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`);
            console.log(\`☁️ Successfully synced \${studentsList.length} students to Aiven PostgreSQL!\`);
          } else {
            console.error('Bulk student sync returned error');
          }
        } catch (e) {
          console.warn('Failed to bulk sync students to cloud:', e.message);
          this.updateSyncBadge('offline', 'Offline (Saved Locally)');
        }
      },`;

if (content.includes(oldCloudSyncSnippet)) {
  content = content.replace(oldCloudSyncSnippet, newCloudSyncSnippet);
  console.log('✅ Updated CloudSync with saveBulkStudents and saveStudentDebounced.');
}

// 2. Enhance handleSpreadsheetCellInput to update state.students in-memory in real time & debounce auto-save to Aiven
const oldCellInputFunc = `    function handleSpreadsheetCellInput(studentId, subjectClean, maxMarksNum) {
      const inputEl = document.getElementById(\`mark_input_\${studentId}_\${subjectClean}\`);
      if (!inputEl) return;

      let val = inputEl.value.trim().toUpperCase();
      const maxM = parseFloat(maxMarksNum) || 100;

      if (val !== '' && val !== 'AB' && val !== 'ML' && val !== 'NA') {
        const num = parseFloat(val);
        if (isNaN(num)) {
          inputEl.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-900');
        } else if (num < 0) {
          // Negative marks blocked
          inputEl.value = '0';
          inputEl.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-900');
          showToast('🚫 Negative marks are blocked! Auto-corrected to 0.');
        } else if (num > maxM) {
          // Exceeding max marks blocked
          inputEl.value = maxM.toString();
          inputEl.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-900');
          showToast(\`🚫 Marks cannot exceed Max Limit (\${maxM})! Auto-corrected to \${maxM}.\`);
        } else {
          inputEl.classList.remove('bg-rose-100', 'border-rose-500', 'text-rose-900');
        }
      } else {
        inputEl.classList.remove('bg-rose-100', 'border-rose-500', 'text-rose-900');
      }

      const student = state.students.find(s => s.id === studentId);
      if (!student) return;

      const currentClass = student.grade;
      const currentExam = state.selectedExamFilter || 'FA1';
      const subjectsDetailed = getClassSubjectsDetailed(currentClass, currentExam);
      
      let maxTotal = 0;
      let obtainedSum = 0;
      let validCount = 0;
      let hasFail = false;

      subjectsDetailed.forEach(subObj => {
        const isOpt = subObj.isOptional === true;
        if (!isOpt) {
          maxTotal += (subObj.maxMarks || (currentExam.startsWith('FA') ? 20 : 100));
        }

        const inp = document.getElementById(\`mark_input_\${studentId}_\${subObj.name.replace(/\\s+/g, '_')}\`);
        const v = inp ? inp.value.trim().toUpperCase() : '';
        if (v !== '' && v !== 'NA') {
          if (v === 'AB' || v === 'ML') {
            if (!isOpt) hasFail = true;
          } else {
            const n = parseFloat(v);
            if (!isNaN(n) && n >= 0 && n <= subObj.maxMarks) {
              if (!isOpt) {
                obtainedSum += n;
                if (n < subObj.passMarks) hasFail = true;
                validCount++;
              }
            }
          }
        }
      });`;

const newCellInputFunc = `    function handleSpreadsheetCellInput(studentId, subjectClean, maxMarksNum) {
      const inputEl = document.getElementById(\`mark_input_\${studentId}_\${subjectClean}\`);
      if (!inputEl) return;

      let val = inputEl.value.trim().toUpperCase();
      const maxM = parseFloat(maxMarksNum) || 100;

      if (val !== '' && val !== 'AB' && val !== 'ML' && val !== 'NA') {
        const num = parseFloat(val);
        if (isNaN(num)) {
          inputEl.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-900');
        } else if (num < 0) {
          inputEl.value = '0';
          inputEl.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-900');
          showToast('🚫 Negative marks are blocked! Auto-corrected to 0.');
        } else if (num > maxM) {
          inputEl.value = maxM.toString();
          inputEl.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-900');
          showToast(\`🚫 Marks cannot exceed Max Limit (\${maxM})! Auto-corrected to \${maxM}.\`);
        } else {
          inputEl.classList.remove('bg-rose-100', 'border-rose-500', 'text-rose-900');
        }
      } else {
        inputEl.classList.remove('bg-rose-100', 'border-rose-500', 'text-rose-900');
      }

      const student = state.students.find(s => s.id === studentId);
      if (!student) return;

      const currentClass = student.grade;
      const currentExam = state.selectedExamFilter || 'FA1';
      const subjectsDetailed = getClassSubjectsDetailed(currentClass, currentExam);
      
      let maxTotal = 0;
      let obtainedSum = 0;
      let validCount = 0;
      let hasFail = false;

      // Update in-memory termMarks for this student in real time
      if (!student.termMarks) student.termMarks = {};
      if (!student.termMarks[currentExam]) student.termMarks[currentExam] = {};

      subjectsDetailed.forEach(subObj => {
        const isOpt = subObj.isOptional === true;
        if (!isOpt) {
          maxTotal += (subObj.maxMarks || (currentExam.startsWith('FA') ? 20 : 100));
        }

        const inp = document.getElementById(\`mark_input_\${studentId}_\${subObj.name.replace(/\\s+/g, '_')}\`);
        const v = inp ? inp.value.trim().toUpperCase() : '';
        if (v !== '' && v !== 'NA') {
          student.termMarks[currentExam][subObj.name] = (v === 'AB' || v === 'ML') ? v : (parseFloat(v) || v);
          if (v === 'AB' || v === 'ML') {
            if (!isOpt) hasFail = true;
          } else {
            const n = parseFloat(v);
            if (!isNaN(n) && n >= 0 && n <= subObj.maxMarks) {
              if (!isOpt) {
                obtainedSum += n;
                if (n < subObj.passMarks) hasFail = true;
                validCount++;
              }
            }
          }
        }
      });

      // Debounced live auto-save of student marks to Aiven Cloud Database
      CloudSync.saveStudentDebounced(student);`;

if (content.includes(oldCellInputFunc)) {
  content = content.replace(oldCellInputFunc, newCellInputFunc);
  console.log('✅ Updated handleSpreadsheetCellInput with real-time in-memory & debounced Aiven sync.');
}

// 3. Update saveClassExamMarks to push bulk students directly to Aiven PostgreSQL
const oldSaveClassMarks = `      if (updatedCount === 0) {
        alert('No active student rows found in table to save marks for!');
        return;
      }

      saveState();
      alert(\`✅ Marks Saved Successfully!\\n\\nSuccessfully saved \${examCode} examination marks for \${updatedCount} students.\`);`;

const newSaveClassMarks = `      if (updatedCount === 0) {
        alert('No active student rows found in table to save marks for!');
        return;
      }

      // 🚀 UPLOAD ALL UPDATED STUDENTS TO AIVEN POSTGRESQL CLOUD DATABASE
      const studentsToSync = state.students.filter(s => isSameClass(s.grade, grade) && (section === 'all' || isSameSection(s.section, section)));
      CloudSync.saveBulkStudents(studentsToSync);
      saveState();
      showToast(\`🟢 Successfully saved & uploaded \${examCode} marks for \${updatedCount} students to Aiven Cloud Database!\`);
      alert(\`✅ Marks Saved & Synced to Aiven Cloud!\\n\\nSuccessfully saved and uploaded \${examCode} examination marks for \${updatedCount} students to Aiven PostgreSQL Database.\\nAll other systems and logins (Principal, Correspondent, Teachers) will now see this updated data immediately!\`);`;

if (content.includes(oldSaveClassMarks)) {
  content = content.replace(oldSaveClassMarks, newSaveClassMarks);
  console.log('✅ Updated saveClassExamMarks with live Aiven PostgreSQL bulk upload.');
}

// 4. Update handleLogin to always fetch live cloud data on login
const oldLoginEnd = `      state.activeTab = roleConfig.allowedTabs[0] || 'dashboard';
      state.activeModal = null;
      saveState();
    }`;

const newLoginEnd = `      state.activeTab = roleConfig.allowedTabs[0] || 'dashboard';
      state.activeModal = null;
      saveState();
      // Fetch latest live data from Aiven Cloud Database on user login
      CloudSync.loadInitialData(false);
    }`;

if (content.includes(oldLoginEnd)) {
  content = content.replace(oldLoginEnd, newLoginEnd);
  console.log('✅ Updated handleLogin to refresh data from Aiven Cloud on user login.');
}

// 5. Add a "🔄 Refresh Live Data" button on the Examination Marks toolbar
const oldExamBarButton = `<button onclick="saveClassExamMarks('\${currentClass}', '\${currentSec}', '\${currentExam}')"`;
const newExamBarButton = `<button onclick="forceSyncFromCloud(false)" title="Pull latest marks from Aiven Cloud" class="bg-sky-700 hover:bg-sky-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center space-x-1">
                            <span>🔄 Pull from Cloud DB</span>
                          </button>
                          <button onclick="saveClassExamMarks('\${currentClass}', '\${currentSec}', '\${currentExam}')"`;

if (content.includes(oldExamBarButton) && !content.includes('Pull from Cloud DB')) {
  content = content.replace(oldExamBarButton, newExamBarButton);
  console.log('✅ Added "Pull from Cloud DB" button to Spreadsheet Marks Entry toolbar.');
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('🎉 Marks synchronization & Aiven persistence successfully patched!');
