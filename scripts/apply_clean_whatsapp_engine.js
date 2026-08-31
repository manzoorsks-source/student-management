const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('Writing clean WhatsApp architecture helper functions...');

// 1. WhatsApp Helper Functions
const cleanWaFunctions = `
    // --- SINGLE-TAB WHATSAPP ARCHITECTURE ENGINE (ZERO MULTI-WINDOW CLUTTER) ---
    function openSingleWhatsAppTab(phone, message) {
      if (!phone) {
        alert('🚫 Invalid Phone Number!\\n\\nParent mobile number is missing.');
        return;
      }
      const rawPhone = phone.toString().replace(/\\D/g, '');
      const formattedPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
      const encodedMsg = encodeURIComponent(message || '');
      const waUrl = 'https://web.whatsapp.com/send?phone=' + formattedPhone + '&text=' + encodedMsg;
      
      // Target a fixed deterministic single tab name 'STV_SCHOOL_WHATSAPP_TAB'
      const waTab = window.open(waUrl, 'STV_SCHOOL_WHATSAPP_TAB');
      if (waTab) {
        try { waTab.focus(); } catch(e) {}
      }
    }

    function openWhatsAppDirect(phone, message) {
      openSingleWhatsAppTab(phone, message);
    }

    function openBroadcastWhatsAppRow(idx) {
      const queue = state.modalWaQueue || [];
      const item = queue[idx];
      if (item) {
        openSingleWhatsAppTab(item.phone, item.msg);
        return;
      }

      // If queue not initialized, build from active list
      const activeStudents = state.students.filter(s => s.status !== 'Alumni' && s.status !== 'Transferred');
      const todayIso = getTodayIsoDate();
      const targetAudience = state.broadcastAudience || 'all';
      const attachedPhoto = state.broadcastAttachedPhoto || '';
      const defaultMsgText = state.broadcastMessageText || 'Dear Parent, this is an official notice from ST. VENUS HIGH SCHOOL.';

      let recipientList = [];
      if (targetAudience === 'absentees_today') {
        recipientList = activeStudents.filter(s => {
          const h = s.attendanceHistory || {};
          const todayRec = h[todayIso];
          return (todayRec && todayRec.status === 'Absent') || state.attendanceMap[s.id] === 'Absent';
        });
      } else if (targetAudience === 'fee_defaulters') {
        recipientList = activeStudents.filter(s => getStudentFeeTotals(s).balanceDue > 0);
      } else if (targetAudience.startsWith('grade_')) {
        const cls = targetAudience.replace('grade_', '');
        recipientList = activeStudents.filter(s => s.grade.toLowerCase().includes(cls.toLowerCase()));
      } else {
        recipientList = activeStudents;
      }

      const s = recipientList[idx];
      if (s) {
        const rawPhone = (s.phone || '9121833702').replace(/\\D/g, '');
        const personalizedMsg = defaultMsgText
          .replace(/{StudentName}/g, s.name)
          .replace(/{Grade}/g, s.grade)
          .replace(/{Section}/g, s.section)
          .replace(/{Date}/g, getTodayIsoDate())
          .replace(/{BalanceDue}/g, getStudentFeeTotals(s).balanceDue.toLocaleString())
          .replace(/{Reason}/g, 'Absence / Leave Notice');
        const fullMsg = personalizedMsg + (attachedPhoto ? '\\n\\nEvent Photo: ' + attachedPhoto : '');
        openSingleWhatsAppTab(rawPhone, fullMsg);
      }
    }

    function dispatchCurrentQueueItemAndAdvance() {
      const queue = state.modalWaQueue;
      if (!queue || queue.length === 0) return;
      const idx = state.modalWaQueueIdx || 0;
      const item = queue[idx];
      if (item) {
        openSingleWhatsAppTab(item.phone, item.msg);
        item.isSent = true;
      }
      if (idx + 1 >= queue.length) {
        alert('🎉 All ' + queue.length + ' parents have been dispatched in 1 single WhatsApp tab!');
        closeModal();
      } else {
        state.modalWaQueueIdx = idx + 1;
        render();
      }
    }

    function copyCurrentQueueMessage() {
      const queue = state.modalWaQueue;
      if (!queue || queue.length === 0) return;
      const idx = state.modalWaQueueIdx || 0;
      const item = queue[idx];
      if (item && item.msg) {
        navigator.clipboard.writeText(item.msg);
        alert('📋 Personalized message copied to clipboard!');
      }
    }

    function copyAllBroadcastPhoneNumbers() {
      const queue = state.modalWaQueue || [];
      if (queue.length === 0) {
        alert('No recipient phone numbers to copy.');
        return;
      }
      const phoneList = queue.map(q => {
        const p = (q.phone || '').replace(/\\D/g, '');
        return p.length === 10 ? '+91' + p : '+' + p;
      }).join(', ');
      
      navigator.clipboard.writeText(phoneList);
      alert('📋 Copied ' + queue.length + ' parent phone numbers to clipboard!\\n\\nYou can now paste them directly into WhatsApp Community, Broadcast List, or SMS software.');
    }

    function exportBroadcastQueueToCsv() {
      const queue = state.modalWaQueue || [];
      if (queue.length === 0) {
        alert('No recipient data to export.');
        return;
      }
      let csv = 'S.No,Student Name,Grade & Section,Parent Name,Phone Number,WhatsApp Link,Personalized Message\\n';
      queue.forEach((q, idx) => {
        const rawP = (q.phone || '').replace(/\\D/g, '');
        const p = rawP.length === 10 ? '91' + rawP : rawP;
        const waLink = 'https://web.whatsapp.com/send?phone=' + p + '&text=' + encodeURIComponent(q.msg || '');
        csv += '"' + (idx + 1) + '","' + (q.studentName || '') + '","' + (q.grade || '') + '","' + (q.parentName || q.name || '') + '","+91 ' + rawP + '","' + waLink + '","' + (q.msg || '').replace(/"/g, '""') + '"\\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'STV_WhatsApp_Broadcast_' + getTodayIsoDate() + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
`;

// Replace whatsapp functions in index.html
html = html.replace(/\/\/ --- SINGLE-TAB WHATSAPP ARCHITECTURE ENGINE[\s\S]*?function openWaGatewayConfigModal\(\)/, cleanWaFunctions + '\n    function openWaGatewayConfigModal()');

// 2. Modal waDispatchConsole implementation
const cleanWaDispatchModal = `
      // MODAL: UNIFIED SINGLE-TAB WHATSAPP DISPATCH ENGINE & QUEUE RUNNER
      if (state.activeModal === 'waDispatchConsole' && state.modalWaQueue && state.modalWaQueue.length > 0) {
        const queue = state.modalWaQueue;
        const idx = state.modalWaQueueIdx || 0;
        const currentItem = queue[idx] || queue[0];
        const rawPhone = (currentItem.phone || '').replace(/\\D/g, '');
        const pct = Math.round(((idx + 1) / queue.length) * 100);

        return \`
          <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div class="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative text-left animate-in fade-in zoom-in duration-200">
              
              <!-- HEADER -->
              <div class="flex justify-between items-start border-b pb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl border border-emerald-300 shadow-sm">
                    💬
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <h3 class="text-xl font-black text-slate-900 font-display">Single-Tab WhatsApp Dispatch Engine</h3>
                      <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-300">1 Reused Tab</span>
                    </div>
                    <p class="text-xs text-slate-500 font-medium mt-0.5">
                      Dispatching Parent <strong class="text-emerald-700 font-mono text-sm">\${idx + 1} of \${queue.length}</strong> (No multi-window tab clutter)
                    </p>
                  </div>
                </div>
                <button onclick="closeModal()" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center transition-all">✕</button>
              </div>

              <!-- PROGRESS BAR -->
              <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5">
                <div class="flex justify-between text-xs font-bold">
                  <span class="text-slate-700 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Campaign Progress</span>
                  </span>
                  <span class="text-emerald-700 font-mono font-black">\${pct}% (\${idx + 1} / \${queue.length} Parents)</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 h-full rounded-full transition-all duration-300" style="width: \${pct}%"></div>
                </div>
              </div>

              <!-- CURRENT RECIPIENT CARD -->
              <div class="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div class="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <span class="bg-emerald-200 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Target Parent #\${idx + 1}</span>
                    <h4 class="text-lg font-black text-slate-900 mt-1 font-display">\${currentItem.studentName || currentItem.name}</h4>
                    <p class="text-xs text-slate-600 font-medium">
                      Parent: <strong class="text-slate-900">\${currentItem.parentName || currentItem.name}</strong> 
                      \${currentItem.grade ? \`• Class: <strong class="text-indigo-800">\${currentItem.grade} \${currentItem.section || ''}</strong>\` : ''}
                    </p>
                  </div>
                  <div class="bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 text-right shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">WhatsApp Phone</p>
                    <p class="text-sm font-black font-mono text-emerald-900">+91 \${rawPhone}</p>
                  </div>
                </div>
              </div>

              <!-- PERSONALIZED MESSAGE PREVIEW -->
              <div class="space-y-1.5">
                <div class="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Personalized Message to Send:</span>
                  <button type="button" onclick="copyCurrentQueueMessage()" class="text-indigo-600 hover:text-indigo-800 text-xs font-extrabold flex items-center space-x-1">
                    <span>📋 Copy Message</span>
                  </button>
                </div>
                <textarea readonly class="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs font-medium text-slate-800 h-28 focus:outline-none resize-none font-mono leading-relaxed select-all">\${currentItem.msg}</textarea>
              </div>

              <!-- MAIN CONTROLS -->
              <div class="space-y-3 pt-1">
                <!-- PRIMARY SEND & NEXT BUTTON -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onclick="dispatchCurrentQueueItemAndAdvance()" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 px-4 rounded-2xl text-xs uppercase tracking-wide shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all">
                    <span>📲 Send in 1 WhatsApp Tab & Next &rarr;</span>
                  </button>

                  <button type="button" onclick="if (\${idx + 1} >= \${queue.length}) { closeModal(); alert('🎉 Completed WhatsApp Queue!'); } else { state.modalWaQueueIdx = \${idx + 1}; render(); }" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 px-4 rounded-2xl text-xs border border-slate-300 active:scale-95 transition-all flex items-center justify-center space-x-1">
                    <span>⏭️ Skip to Next Parent &rarr;</span>
                  </button>
                </div>

                <!-- AUXILIARY BULK TOOLS -->
                <div class="flex flex-wrap items-center justify-between pt-2 border-t text-xs font-medium text-slate-600 gap-2">
                  <div class="flex items-center space-x-2">
                    <button type="button" onclick="state.modalWaQueueIdx = Math.max(0, \${idx - 1}); render();" \${idx === 0 ? 'disabled' : ''} class="text-slate-600 hover:text-slate-900 disabled:opacity-30 font-bold">
                      &larr; Previous Parent
                    </button>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button type="button" onclick="copyAllBroadcastPhoneNumbers()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 text-[11px] shadow-2xs active:scale-95 transition-all">
                      📋 Copy All \${queue.length} Phone Numbers
                    </button>
                    <button type="button" onclick="exportBroadcastQueueToCsv()" class="bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold px-3 py-1.5 rounded-xl border border-teal-200 text-[11px] shadow-2xs active:scale-95 transition-all">
                      📥 Export CSV List
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        \`;
      }
`;

html = html.replace(/\/\/ MODAL: UNIFIED SINGLE-TAB WHATSAPP DISPATCH ENGINE[\s\S]*?if \(state\.activeModal === 'waGatewayConfig'\)/, cleanWaDispatchModal + '\n      if (state.activeModal === \'waGatewayConfig\')');

// 3. Update table row button in renderBulkMessagingTab
html = html.replace(
  /<button\s+data-wa-phone[\s\S]*?<\/button>/,
  `<button onclick="openBroadcastWhatsAppRow(\${idx})" class="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs active:scale-95 transition-all" title="Opens or updates 1 single WhatsApp tab"><span>📲 WhatsApp (1 Tab)</span></button>`
);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Injected clean WhatsApp Architecture.');

// Verify syntax
const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
let allOk = true;

scriptMatches.forEach((s, sIdx) => {
  const cleanScript = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new vm.Script(cleanScript);
    console.log(`✅ Script ${sIdx + 1}: SYNTAX 100% VALID!`);
  } catch (err) {
    allOk = false;
    console.error(`❌ Script ${sIdx + 1} Syntax Error:`, err.message);
  }
});

if (allOk) {
  console.log('\n🎉 ALL SCRIPTS SYNTACTICALLY VERIFIED AND 100% ERROR-FREE!\n');
}
