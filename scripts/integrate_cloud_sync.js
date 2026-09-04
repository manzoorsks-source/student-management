const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

console.log('Original index.html length:', content.length);

// 1. Check if CloudSync is already inserted
if (!content.includes('const CloudSync = {')) {
  // Define CloudSync Engine
  const cloudSyncCode = `
    // =========================================================================
    // AIVEN POSTGRESQL REAL-TIME CLOUD DATABASE SYNCHRONIZATION ENGINE
    // =========================================================================
    const CloudSync = {
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      _stateSyncTimer: null,

      getBaseUrl() {
        return window.location.origin;
      },

      async checkHealth() {
        try {
          const res = await fetch(\`\${this.getBaseUrl()}/api/health\`);
          if (res.ok) {
            const data = await res.json();
            this.isOnline = true;
            this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${data.studentCount || state.students.length} Students)\`);
            return true;
          }
        } catch (e) {
          console.warn('Cloud Database Health Check Failed:', e.message);
        }
        this.isOnline = false;
        this.updateSyncBadge('offline', 'Offline (Local Cache)');
        return false;
      },

      async loadInitialData(silent = false) {
        if (!silent) this.updateSyncBadge('syncing', 'Connecting to Aiven Cloud DB...');
        try {
          // 1. Fetch Students from Aiven PostgreSQL
          const studentsRes = await fetch(\`\${this.getBaseUrl()}/api/students\`);
          if (studentsRes.ok) {
            const studentsJson = await studentsRes.json();
            if (studentsJson.success && Array.isArray(studentsJson.data) && studentsJson.data.length > 0) {
              state.students = studentsJson.data;
              console.log(\`☁️ Loaded \${studentsJson.data.length} students from Aiven PostgreSQL!\`);
            }
          }

          // 2. Fetch App State from Aiven PostgreSQL
          const stateRes = await fetch(\`\${this.getBaseUrl()}/api/state\`);
          if (stateRes.ok) {
            const stateJson = await stateRes.json();
            if (stateJson.success && stateJson.data) {
              const d = stateJson.data;
              if (d.users) state.users = d.users;
              if (d.teachers) state.teachers = d.teachers;
              if (d.website) state.website = d.website;
              if (d.timetable) state.timetable = d.timetable;
              if (d.tasks) state.tasks = d.tasks;
              if (d.notes) state.notes = d.notes;
              if (d.classFeeStructure) state.classFeeStructure = d.classFeeStructure;
              if (d.classSubjectsMap) state.classSubjectsMap = d.classSubjectsMap;
              if (d.examsList) state.examsList = d.examsList;
              if (d.gradeRules) state.gradeRules = d.gradeRules;
              if (d.examStatuses) state.examStatuses = d.examStatuses;
              if (d.marksAuditLogs) state.marksAuditLogs = d.marksAuditLogs;
              if (d.subjects) state.subjects = d.subjects;
              if (d.availableYears) state.availableYears = d.availableYears;
              if (d.activeAcademicYear) state.activeAcademicYear = d.activeAcademicYear;
              if (d.academicHistory) state.academicHistory = d.academicHistory;
              if (d.attendanceMap) state.attendanceMap = d.attendanceMap;
              if (d.broadcastLogs) state.broadcastLogs = d.broadcastLogs;
              if (d.overrideLogs) state.overrideLogs = d.overrideLogs;
              console.log('☁️ Loaded application state keys from Aiven PostgreSQL!');
            }
          }

          this.isOnline = true;
          this.lastSyncTime = new Date();
          this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`);
          
          saveStateLocalOnly();
          render();
          if (!silent && typeof showToast === 'function') {
            showToast(\`🟢 Loaded \${state.students.length} students live from Aiven PostgreSQL Cloud Database!\`);
          }
        } catch (err) {
          console.warn('Could not load from cloud DB, using local data:', err.message);
          this.isOnline = false;
          this.updateSyncBadge('offline', 'Offline (Local Cache)');
        }
      },

      async saveStudent(student) {
        if (!student || !student.id) return;
        try {
          this.updateSyncBadge('syncing', 'Saving to Aiven Cloud DB...');
          const res = await fetch(\`\${this.getBaseUrl()}/api/students\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student })
          });
          if (res.ok) {
            this.updateSyncBadge('connected', \`Saved to Aiven Cloud (\${student.id})\`);
            setTimeout(() => this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`), 2500);
          }
        } catch (e) {
          console.warn('Failed to save student to cloud:', e.message);
          this.updateSyncBadge('offline', 'Offline (Saved Locally)');
        }
      },

      async deleteStudent(studentId) {
        if (!studentId) return;
        try {
          this.updateSyncBadge('syncing', 'Deleting from Aiven Cloud DB...');
          await fetch(\`\${this.getBaseUrl()}/api/students?id=\${encodeURIComponent(studentId)}\`, {
            method: 'DELETE'
          });
          this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`);
        } catch (e) {
          console.warn('Failed to delete student from cloud:', e.message);
        }
      },

      async recordFeePayment(studentId, paymentData, student) {
        try {
          this.updateSyncBadge('syncing', 'Recording payment in Aiven Cloud...');
          const res = await fetch(\`\${this.getBaseUrl()}/api/fees\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: studentId,
              ...paymentData,
              student
            })
          });
          if (res.ok) {
            this.updateSyncBadge('connected', 'Payment Saved to Aiven Cloud!');
            setTimeout(() => this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`), 2500);
          }
        } catch (e) {
          console.warn('Failed to save fee payment to cloud:', e.message);
        }
      },

      async saveStudentMarks(studentId, termName, marks, student) {
        try {
          this.updateSyncBadge('syncing', 'Saving marks in Aiven Cloud...');
          const res = await fetch(\`\${this.getBaseUrl()}/api/academic\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: studentId,
              term_name: termName,
              marks,
              student
            })
          });
          if (res.ok) {
            this.updateSyncBadge('connected', 'Marks Saved to Aiven Cloud!');
            setTimeout(() => this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`), 2500);
          }
        } catch (e) {
          console.warn('Failed to save academic marks to cloud:', e.message);
        }
      },

      async saveAttendance(attendanceMap, targetDate, studentUpdates) {
        try {
          this.updateSyncBadge('syncing', 'Saving attendance in Aiven Cloud...');
          await fetch(\`\${this.getBaseUrl()}/api/attendance\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attendanceMap,
              targetDate,
              studentUpdates
            })
          });
          this.updateSyncBadge('connected', 'Attendance Saved to Aiven Cloud!');
          setTimeout(() => this.updateSyncBadge('connected', \`Aiven Cloud DB Live (\${state.students.length} Students)\`), 2500);
        } catch (e) {
          console.warn('Failed to save attendance to cloud:', e.message);
        }
      },

      syncAppStateDebounced() {
        if (this._stateSyncTimer) clearTimeout(this._stateSyncTimer);
        this._stateSyncTimer = setTimeout(() => {
          this.syncAppStateImmediate();
        }, 1200);
      },

      async syncAppStateImmediate() {
        try {
          const updates = {
            users: state.users,
            website: state.website,
            overrideLogs: state.overrideLogs,
            broadcastLogs: state.broadcastLogs,
            availableYears: state.availableYears,
            activeAcademicYear: state.activeAcademicYear,
            yearStatuses: state.yearStatuses,
            academicHistory: state.academicHistory,
            subjects: state.subjects,
            teachers: state.teachers,
            timetable: state.timetable,
            notes: state.notes,
            tasks: state.tasks,
            classFeeStructure: state.classFeeStructure,
            classSubjectsMap: state.classSubjectsMap,
            examsList: state.examsList,
            gradeRules: state.gradeRules,
            examStatuses: state.examStatuses,
            marksAuditLogs: state.marksAuditLogs,
            attendanceMap: state.attendanceMap
          };

          await fetch(\`\${this.getBaseUrl()}/api/state\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
          });
        } catch (e) {
          console.warn('Debounced state sync failed:', e.message);
        }
      },

      updateSyncBadge(status, text) {
        const badgeEl = document.getElementById('cloud-sync-badge');
        if (!badgeEl) return;
        if (status === 'connected') {
          badgeEl.className = 'bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-xl text-xs flex items-center space-x-1.5 font-bold shadow-xs';
          badgeEl.innerHTML = \`<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span id="cloud-sync-text">\${text}</span><button onclick="forceSyncFromCloud()" title="Sync with Aiven Cloud Database" class="ml-1 text-emerald-700 hover:text-emerald-950 underline text-[11px]">🔄 Sync</button>\`;
        } else if (status === 'syncing') {
          badgeEl.className = 'bg-amber-50 border border-amber-300 text-amber-800 px-3 py-1 rounded-xl text-xs flex items-center space-x-1.5 font-bold shadow-xs';
          badgeEl.innerHTML = \`<span class="inline-block w-2 h-2 rounded-full bg-amber-500 animate-spin"></span><span id="cloud-sync-text">\${text}</span>\`;
        } else if (status === 'offline') {
          badgeEl.className = 'bg-rose-50 border border-rose-300 text-rose-800 px-3 py-1 rounded-xl text-xs flex items-center space-x-1.5 font-bold shadow-xs';
          badgeEl.innerHTML = \`<span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span><span id="cloud-sync-text">\${text}</span><button onclick="forceSyncFromCloud()" title="Retry Connecting" class="ml-1 text-rose-700 hover:text-rose-950 underline text-[11px]">🔄 Retry</button>\`;
        }
      }
    };

    function saveStateLocalOnly() {
      localStorage.setItem('stv_view_mode', state.viewMode);
      if (state.currentUser) localStorage.setItem('stv_auth_user_v12', JSON.stringify(state.currentUser));
      else localStorage.removeItem('stv_auth_user_v12');
      localStorage.setItem('stv_users_v12', JSON.stringify(state.users));
      localStorage.setItem('stv_website_v12', JSON.stringify(state.website));
      localStorage.setItem('stv_override_logs_v12', JSON.stringify(state.overrideLogs));
      localStorage.setItem('stv_years_v11', JSON.stringify(state.availableYears));
      localStorage.setItem('stv_active_year_v11', state.activeAcademicYear);
      localStorage.setItem('stv_year_statuses_v11', JSON.stringify(state.yearStatuses));
      localStorage.setItem('stv_academic_history_v11', JSON.stringify(state.academicHistory));
      localStorage.setItem('stv_students_v11', JSON.stringify(state.students));
      localStorage.setItem('stv_fee_structure_v1', JSON.stringify(state.classFeeStructure));
      localStorage.setItem('stv_class_subjects_v105', JSON.stringify(state.classSubjectsMap));
      localStorage.setItem('stv_exams_v105', JSON.stringify(state.examsList));
      localStorage.setItem('stv_grade_rules_v1', JSON.stringify(state.gradeRules));
      localStorage.setItem('stv_exam_statuses_v1', JSON.stringify(state.examStatuses));
      localStorage.setItem('stv_marks_audit_v1', JSON.stringify(state.marksAuditLogs));
      localStorage.setItem('stv_subjects_v10', JSON.stringify(state.subjects));
      localStorage.setItem('stv_teachers_v15', JSON.stringify(state.teachers));
      localStorage.setItem('stv_timetable_v10', JSON.stringify(state.timetable));
      localStorage.setItem('stv_attendance_v10', JSON.stringify(state.attendanceMap));
      localStorage.setItem('stv_attendance_date', state.selectedAttendanceDate || getTodayIsoDate());
      localStorage.setItem('stv_attendance_subtab', state.attendanceSubTab || 'register');
      localStorage.setItem('stv_attendance_student_id', state.selectedAttendanceStudentId || '');
      localStorage.setItem('stv_attendance_cal_month', JSON.stringify(state.selectedCalendarMonth !== undefined ? state.selectedCalendarMonth : 7));
      localStorage.setItem('stv_notes_v10', JSON.stringify(state.notes));
      localStorage.setItem('stv_tasks_v10', JSON.stringify(state.tasks));
    }

    async function forceSyncFromCloud(silent = false) {
      if (!silent && typeof showToast === 'function') showToast('🔄 Refreshing live data from Aiven PostgreSQL Cloud Database...');
      await CloudSync.loadInitialData(silent);
    }
  `;

  // Insert CloudSync right before function saveState()
  content = content.replace('function saveState() {', `${cloudSyncCode}\n\n    function saveState() {\n      CloudSync.syncAppStateDebounced();`);
  console.log('✅ Injected CloudSync Engine and updated saveState().');
}

// 2. Add Cloud Sync Badge to Header
if (!content.includes('id="cloud-sync-badge"')) {
  const exportButtonMatch = '<button onclick="exportToExcel()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5';
  if (content.includes(exportButtonMatch)) {
    const badgeMarkup = `
                  <!-- AIVEN POSTGRESQL LIVE CLOUD SYNC BADGE -->
                  <div id="cloud-sync-badge" class="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-xl text-xs flex items-center space-x-1.5 font-bold shadow-xs">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span id="cloud-sync-text">Aiven Cloud DB Live</span>
                    <button onclick="forceSyncFromCloud()" title="Sync with Aiven Cloud Database" class="ml-1 text-emerald-700 hover:text-emerald-950 underline text-[11px]">🔄 Sync</button>
                  </div>
    `;
    content = content.replace(exportButtonMatch, `${badgeMarkup}\n                  ${exportButtonMatch}`);
    console.log('✅ Injected Cloud Sync Badge to Navigation Header.');
  }
}

// 3. Hook into saveStudent in Student Admission
if (content.includes('state.students.unshift(newStudent);') && !content.includes('CloudSync.saveStudent(newStudent);')) {
  content = content.replace(
    'state.students.unshift(newStudent);',
    'state.students.unshift(newStudent);\n      CloudSync.saveStudent(newStudent);'
  );
  console.log('✅ Hooked CloudSync.saveStudent into Student Admission.');
}

// 4. Hook into saveEditStudent
if (content.includes('state.students.unshift(updatedRecord);') && !content.includes('CloudSync.saveStudent(updatedRecord);')) {
  content = content.replace(
    'state.students.unshift(updatedRecord);',
    'state.students.unshift(updatedRecord);\n        CloudSync.saveStudent(updatedRecord);'
  );
  console.log('✅ Hooked CloudSync.saveStudent into Student Edit.');
}

// 5. Hook into saveFeePayment
if (content.includes('state.activeModal = \'printReceipt\';') && !content.includes('CloudSync.recordFeePayment')) {
  content = content.replace(
    'state.activeModal = \'printReceipt\';',
    'if (updatedTargetStudent) { CloudSync.recordFeePayment(updatedTargetStudent.id, { receiptNo, amount, date: paymentDate, month, mode }, updatedTargetStudent); }\n      state.activeModal = \'printReceipt\';'
  );
  console.log('✅ Hooked CloudSync.recordFeePayment into Fee Payment.');
}

// 6. Hook into saveStudentMarks
if (content.includes('state.modalSelectedTerm = term;') && !content.includes('CloudSync.saveStudentMarks')) {
  content = content.replace(
    'state.modalSelectedTerm = term;',
    'CloudSync.saveStudentMarks(student.id, term, updatedTermMarks, student);\n        state.modalSelectedTerm = term;'
  );
  console.log('✅ Hooked CloudSync.saveStudentMarks into Student Marks.');
}

// 7. Hook into Attendance
if (content.includes('function saveAllAttendanceChanges() {') && !content.includes('CloudSync.saveAttendance')) {
  content = content.replace(
    'function saveAllAttendanceChanges() {',
    `function saveAllAttendanceChanges() {
      const dStr = getSelectedAttendanceDate();
      CloudSync.saveAttendance(state.attendanceMap, dStr);`
  );
  console.log('✅ Hooked CloudSync.saveAttendance into Attendance Changes.');
}

// 8. Auto-initialize Cloud Sync on Startup & Auto-polling
if (!content.includes('CloudSync.loadInitialData()')) {
  const startupHook = `
    // INITIALIZE AIVEN POSTGRESQL CLOUD DATABASE SYNC ON STARTUP
    window.addEventListener('DOMContentLoaded', () => {
      CloudSync.loadInitialData();
      // Auto background sync polling every 25 seconds
      setInterval(() => {
        if (!document.hidden) {
          CloudSync.loadInitialData(true);
        }
      }, 25000);
      // Auto sync when user switches back to this tab/window
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          CloudSync.loadInitialData(true);
        }
      });
    });
    // Immediate fallback trigger if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(() => CloudSync.loadInitialData(), 100);
    }
  `;

  content = content.replace('render();\n  </script>', `render();\n${startupHook}\n  </script>`);
  console.log('✅ Injected Startup CloudSync initialization & multi-device auto-polling.');
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('🎉 Successfully integrated Aiven PostgreSQL Cloud Database into index.html!');
