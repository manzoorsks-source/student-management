const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original index.html length:', content.length);

// 1. Update state initialization
const oldStateBlock = `    // STATE STORE
    let state = {
      viewMode: localStorage.getItem('stv_view_mode') || 'public',
      currentUser: safeLoadJson('stv_auth_user_v12', null),`;

const newStateBlock = `    // STATE STORE - SECURE AUTHENTICATION STATE
    const _savedToken = localStorage.getItem('stv_auth_token') || sessionStorage.getItem('stv_auth_token') || null;
    let state = {
      token: _savedToken,
      isVerifyingAuth: false,
      viewMode: _savedToken ? (localStorage.getItem('stv_view_mode') || 'portal') : 'login',
      currentUser: _savedToken ? safeLoadJson('stv_auth_user_v12', null) : null,`;

if (!content.includes(oldStateBlock)) {
  console.error('Could not find oldStateBlock in index.html');
  process.exit(1);
}

content = content.replace(oldStateBlock, newStateBlock);

// 2. Add authFetch and update CloudSync methods
const oldCloudSyncStart = `    const CloudSync = {
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      _stateSyncTimer: null,
      _studentDebounceTimers: {},
      dirtyStudentIds: new Set(),`;

const newCloudSyncStart = `    const CloudSync = {
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      _stateSyncTimer: null,
      _studentDebounceTimers: {},
      dirtyStudentIds: new Set(),

      async authFetch(url, options = {}) {
        const token = state.token || localStorage.getItem('stv_auth_token') || sessionStorage.getItem('stv_auth_token') || '';
        const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        };
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }
        try {
          const res = await fetch(url, { ...options, headers });
          if (res.status === 401) {
            console.warn('Session unauthorized or expired (401). Redirecting to login.');
            if (typeof handleLogout === 'function' && state.currentUser) {
              handleLogout(false);
            }
          }
          return res;
        } catch (err) {
          console.warn('Request failed for ' + url + ':', err.message);
          throw err;
        }
      },`;

if (!content.includes(oldCloudSyncStart)) {
  console.error('Could not find oldCloudSyncStart in index.html');
  process.exit(1);
}

content = content.replace(oldCloudSyncStart, newCloudSyncStart);

// Replace raw fetch calls in CloudSync with authFetch
content = content.replace(
  `const studentsRes = await fetch(\`\${this.getBaseUrl()}/api/students\`);`,
  `const studentsRes = await this.authFetch(\`\${this.getBaseUrl()}/api/students\`);`
);
content = content.replace(
  `const stateRes = await fetch(\`\${this.getBaseUrl()}/api/state\`);`,
  `const stateRes = await this.authFetch(\`\${this.getBaseUrl()}/api/state\`);`
);
content = content.replace(
  `const res = await fetch(\`\${this.getBaseUrl()}/api/students\`, {`,
  `const res = await this.authFetch(\`\${this.getBaseUrl()}/api/students\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/students\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/students\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/students?id=\${encodeURIComponent(studentId)}\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/students?id=\${encodeURIComponent(studentId)}\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/fees\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/fees\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/academic\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/academic\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/attendance\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/attendance\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/attendance\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/attendance\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/state\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/state\`, {`
);
content = content.replace(
  `await fetch(\`\${this.getBaseUrl()}/api/state\`, {`,
  `await this.authFetch(\`\${this.getBaseUrl()}/api/state\`, {`
);

// 3. Update saveStateLocalOnly
const oldSaveStateLocal = `    function saveStateLocalOnly() {
      localStorage.setItem('stv_view_mode', state.viewMode);
      if (state.currentUser) localStorage.setItem('stv_auth_user_v12', JSON.stringify(state.currentUser));
      else localStorage.removeItem('stv_auth_user_v12');`;

const newSaveStateLocal = `    function saveStateLocalOnly() {
      localStorage.setItem('stv_view_mode', state.viewMode);
      if (state.token) localStorage.setItem('stv_auth_token', state.token);
      else localStorage.removeItem('stv_auth_token');
      if (state.currentUser) localStorage.setItem('stv_auth_user_v12', JSON.stringify(state.currentUser));
      else localStorage.removeItem('stv_auth_user_v12');`;

if (!content.includes(oldSaveStateLocal)) {
  console.error('Could not find oldSaveStateLocal in index.html');
  process.exit(1);
}
content = content.replace(oldSaveStateLocal, newSaveStateLocal);

// 4. Update handleLogin and handleLogout
const oldAuthHandlers = `    function handleLogin(e) {
      if (e) e.preventDefault();
      const uInp = document.getElementById('loginUsername');
      const pInp = document.getElementById('loginPassword');
      
      const u = uInp ? uInp.value.trim().toLowerCase() : '';
      const p = pInp ? pInp.value.trim() : '';

      if (!u || !p) {
        state.loginError = '⚠️ Please enter both username and password.';
        render();
        return;
      }

      // Match username case-insensitively across state.users
      const matchedUser = state.users.find(usr => (usr.username || '').toLowerCase() === u);

      if (!matchedUser) {
        state.loginError = '⚠️ Access Denied! Username does not exist or this user account has been removed.';
        render();
        return;
      }

      if (matchedUser.status === 'Disabled' || matchedUser.status === 'Inactive') {
        state.loginError = \`⚠️ Access Denied! User account "\${matchedUser.fullName}" is DISABLED. Login is blocked.\`;
        render();
        return;
      }

      const enteredHash = sha256(p);
      const isPasswordMatch = (matchedUser.password && matchedUser.password === p) ||
                              (matchedUser.passwordHash && (matchedUser.passwordHash.toLowerCase() === enteredHash.toLowerCase() || matchedUser.passwordHash === p));

      if (!isPasswordMatch) {
        state.loginError = '⚠️ Incorrect Password! Please check your password.';
        render();
        return;
      }

      matchedUser.lastLogin = formatDateTime(new Date());
      state.currentUser = matchedUser;
      state.loginError = '';
      state.viewMode = 'portal';
      
      const roleConfig = ROLES_CONFIG[matchedUser.role] || ROLES_CONFIG['super_admin'] || ROLES_CONFIG['admin'];
      state.activeTab = (roleConfig.allowedTabs && roleConfig.allowedTabs[0]) ? roleConfig.allowedTabs[0] : 'dashboard';
      state.activeModal = null;
      saveStateLocalOnly();
      render();
      // Refresh latest data on successful login
      CloudSync.loadInitialData(false);
    }

    function togglePasswordVisibility(empId) {
      if (!state.visiblePasswords) state.visiblePasswords = {};
      state.visiblePasswords[empId] = !state.visiblePasswords[empId];
      render();
    }

    function handleLogout() {
      state.currentUser = null;
      state.viewMode = 'public';
      state.activeTab = 'dashboard';
      state.fullProfileStudentId = null;
      state.activeModal = null;
      state.editingUser = null;
      saveState();
    }`;

const newAuthHandlers = `    async function handleLogin(e) {
      if (e) e.preventDefault();
      const uInp = document.getElementById('loginUsername');
      const pInp = document.getElementById('loginPassword');
      
      const u = uInp ? uInp.value.trim().toLowerCase() : '';
      const p = pInp ? pInp.value.trim() : '';

      if (!u || !p) {
        state.loginError = '⚠️ Please enter both username and password.';
        render();
        return;
      }

      const loginBtn = document.getElementById('loginSubmitBtn');
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>⏳ Verifying credentials...</span>';
      }

      try {
        const res = await fetch(\`\${CloudSync.getBaseUrl()}/api/auth/login\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          state.loginError = json.error || '⚠️ Invalid username or password.';
          if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Sign In to School Portal &rarr;</span>';
          }
          render();
          return;
        }

        // Authentication Successful
        state.token = json.token;
        state.currentUser = json.user;
        state.loginError = '';
        state.viewMode = 'portal';
        localStorage.setItem('stv_auth_token', json.token);
        localStorage.setItem('stv_auth_user_v12', JSON.stringify(json.user));
        localStorage.setItem('stv_view_mode', 'portal');

        const roleConfig = ROLES_CONFIG[json.user.role] || ROLES_CONFIG['super_admin'] || ROLES_CONFIG['admin'];
        state.activeTab = (roleConfig.allowedTabs && roleConfig.allowedTabs[0]) ? roleConfig.allowedTabs[0] : 'dashboard';
        state.activeModal = null;

        render();
        // Load latest central database records
        await CloudSync.loadInitialData(false);
      } catch (err) {
        console.error('Login error:', err);
        state.loginError = '⚠️ Connection error with authentication server. Please check your connection and try again.';
        render();
      }
    }

    function togglePasswordVisibility(empId) {
      if (!state.visiblePasswords) state.visiblePasswords = {};
      state.visiblePasswords[empId] = !state.visiblePasswords[empId];
      render();
    }

    async function handleLogout(callBackend = true) {
      const token = state.token || localStorage.getItem('stv_auth_token');
      if (callBackend && token) {
        try {
          await fetch(\`\${CloudSync.getBaseUrl()}/api/auth/logout\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          });
        } catch (e) {}
      }

      // Completely invalidate tokens and in-memory session caches
      localStorage.removeItem('stv_auth_token');
      sessionStorage.removeItem('stv_auth_token');
      localStorage.removeItem('stv_auth_user_v12');
      localStorage.removeItem('stv_view_mode');

      state.currentUser = null;
      state.token = null;
      state.students = [];
      state.viewMode = 'login';
      state.activeTab = 'dashboard';
      state.fullProfileStudentId = null;
      state.activeModal = null;
      state.editingUser = null;
      state.loginError = '';

      // Prevent browser back-button caching
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      render();
    }

    async function verifyCurrentSession() {
      const token = state.token || localStorage.getItem('stv_auth_token') || sessionStorage.getItem('stv_auth_token');
      if (!token) {
        state.currentUser = null;
        state.token = null;
        state.students = [];
        state.viewMode = 'login';
        state.isVerifyingAuth = false;
        render();
        return;
      }

      state.isVerifyingAuth = true;
      try {
        const res = await fetch(\`\${CloudSync.getBaseUrl()}/api/auth/me\`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            state.currentUser = json.user;
            state.token = token;
            state.isVerifyingAuth = false;
            state.viewMode = 'portal';
            localStorage.setItem('stv_auth_user_v12', JSON.stringify(json.user));
            render();
            await CloudSync.loadInitialData(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Session verification network check failed:', err.message);
      }

      // If token is invalid/expired
      localStorage.removeItem('stv_auth_token');
      sessionStorage.removeItem('stv_auth_token');
      localStorage.removeItem('stv_auth_user_v12');
      state.currentUser = null;
      state.token = null;
      state.students = [];
      state.viewMode = 'login';
      state.isVerifyingAuth = false;
      render();
    }`;

if (!content.includes(oldAuthHandlers)) {
  console.error('Could not find oldAuthHandlers in index.html');
  process.exit(1);
}
content = content.replace(oldAuthHandlers, newAuthHandlers);

// 5. Update render() start with Authentication Guard and renderLoginScreen()
const oldRenderStart = `    // --- MAIN RENDERER ENGINE ---
    function render() {
      const app = document.getElementById('app');
      if (!app) return;

      // 1. PUBLIC SCHOOL WEBSITE VIEW (HERO LANDING PAGE)
      if (state.viewMode === 'public' || !state.currentUser || !ROLES_CONFIG[state.currentUser.role]) {
        state.viewMode = 'public';`;

const newRenderStart = `    // --- DEDICATED LOGIN SCREEN RENDERER ---
    function renderLoginScreen() {
      const app = document.getElementById('app');
      if (!app) return;

      app.innerHTML = \`
        <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans flex flex-col justify-between antialiased selection:bg-sky-500 selection:text-white relative overflow-hidden">
          <!-- Ambient Glow Lights -->
          <div class="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <!-- TOP BAR -->
          <header class="p-6 max-w-7xl mx-auto w-full flex justify-between items-center z-10">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-sky-700 flex items-center justify-center shadow-xl border-2 border-amber-400">
                <span class="text-xl font-black text-white font-display">ST.V</span>
              </div>
              <div>
                <h1 class="text-lg sm:text-xl font-black tracking-tight text-white font-display uppercase">ST. VENUS HIGH SCHOOL</h1>
                <p class="text-[10px] text-sky-300 font-bold uppercase tracking-wider">(Recognised by Govt. of Telangana)</p>
              </div>
            </div>

            <button onclick="switchViewMode('public')" class="bg-white/10 hover:bg-white/20 text-sky-200 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 backdrop-blur-md">
              <span>🌐 Public School Site</span>
            </button>
          </header>

          <!-- MAIN LOGIN CONTAINER -->
          <main class="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
            <div class="bg-white/95 text-slate-900 border border-white/40 shadow-2xl rounded-3xl p-6 sm:p-10 max-w-md w-full backdrop-blur-xl space-y-6 animate-in fade-in zoom-in duration-300">
              <div class="text-center space-y-2">
                <div class="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                  <span>🔒 Official Staff Authentication</span>
                </div>
                <h2 class="text-2xl font-black text-slate-900 font-display">Staff Portal Sign In</h2>
                <p class="text-xs text-slate-500 font-medium">Please enter your authorized school credentials to access the Dashboard & Administration System.</p>
              </div>

              \${state.loginError ? \`
                <div class="bg-rose-50 border border-rose-300 text-rose-700 text-xs p-3.5 rounded-2xl font-bold flex items-start space-x-2.5 animate-shake">
                  <span class="text-base leading-none">⚠️</span>
                  <span class="leading-relaxed">\${state.loginError}</span>
                </div>
              \` : ''}

              <form onsubmit="handleLogin(event)" class="space-y-4 text-xs font-medium">
                <div>
                  <label class="block text-slate-700 font-bold mb-1.5">Username <span class="text-rose-600">*</span></label>
                  <div class="relative">
                    <input id="loginUsername" required placeholder="e.g. shaikmadar786" autocomplete="username" autofocus class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400" />
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <label class="block text-slate-700 font-bold">Password <span class="text-rose-600">*</span></label>
                    <button type="button" onclick="const p = document.getElementById('loginPassword'); if(p.type==='password'){p.type='text'; this.innerText='🙈 Hide';}else{p.type='password'; this.innerText='👁️ Show';}" class="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer">
                      👁️ Show
                    </button>
                  </div>
                  <div class="relative">
                    <input type="password" id="loginPassword" required placeholder="Enter your password" autocomplete="current-password" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400" />
                  </div>
                </div>

                <button type="submit" id="loginSubmitBtn" class="w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-2">
                  <span>Sign In to School Portal &rarr;</span>
                </button>
              </form>

              <div class="pt-2 border-t border-slate-200/80 text-center">
                <p class="text-[11px] text-slate-500 font-medium flex items-center justify-center space-x-1">
                  <span>🔒 256-bit Central PostgreSQL Server Verification</span>
                </p>
                <p class="text-[10px] text-slate-400 mt-1">St. Venus High School • Uppal, Hyderabad</p>
              </div>
            </div>
          </main>

          <!-- FOOTER -->
          <footer class="p-4 text-center text-slate-400 text-xs z-10">
            <p>© 2026 ST. VENUS HIGH SCHOOL. All Rights Reserved. Recognized by Govt. of Telangana.</p>
          </footer>
        </div>
      \`;
    }

    // --- MAIN RENDERER ENGINE ---
    function render() {
      const app = document.getElementById('app');
      if (!app) return;

      // 0. AUTHENTICATION & SESSION VERIFICATION GUARD
      const hasValidAuth = !!(state.token && state.currentUser && ROLES_CONFIG[state.currentUser.role]);

      if (state.isVerifyingAuth) {
        app.innerHTML = \`
          <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
            <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl border-2 border-amber-400 animate-pulse mb-4">
              <span class="text-2xl font-black font-display">ST.V</span>
            </div>
            <h2 class="text-lg font-bold text-slate-200 font-display">ST. VENUS HIGH SCHOOL</h2>
            <p class="text-xs text-sky-400 mt-2 flex items-center space-x-1.5 font-medium">
              <span>🔒 Verifying secure authenticated session...</span>
            </p>
          </div>
        \`;
        return;
      }

      // If unauthenticated and not viewing public info, strictly show Login Screen
      if (!hasValidAuth && state.viewMode !== 'public') {
        state.viewMode = 'login';
        renderLoginScreen();
        return;
      }

      // 1. PUBLIC SCHOOL WEBSITE VIEW (HERO LANDING PAGE)
      if (state.viewMode === 'public') {
        state.viewMode = 'public';`;

if (!content.includes(oldRenderStart)) {
  console.error('Could not find oldRenderStart in index.html');
  process.exit(1);
}
content = content.replace(oldRenderStart, newRenderStart);

// Update Staff Sign in button in public header
const oldHeaderBtn = `                    \${state.currentUser ? \`
                      <button onclick="switchViewMode('portal')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5">
                        <span>💼 Staff Portal &rarr;</span>
                      </button>
                    \` : \`
                      <button onclick="openModal('loginModal')" class="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 active:scale-95 transition-all">
                        <span>🔑 Staff Sign In</span>
                      </button>
                    \`}`;

const newHeaderBtn = `                    \${(state.token && state.currentUser) ? \`
                      <button onclick="switchViewMode('portal')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5">
                        <span>💼 Staff Portal &rarr;</span>
                      </button>
                    \` : \`
                      <button onclick="switchViewMode('login')" class="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 active:scale-95 transition-all">
                        <span>🔑 Staff Sign In</span>
                      </button>
                    \`}`;

if (content.includes(oldHeaderBtn)) {
  content = content.replace(oldHeaderBtn, newHeaderBtn);
}

// 6. Update startup script at bottom of index.html
const oldStartup = `    // INITIAL RENDER WITH HASH ANCHOR AUTO-DETECTION
    if (window.location.hash && ['#about', '#facilities', '#reviews', '#contact', '#achievements', '#hero'].some(h => window.location.hash.toLowerCase().includes(h))) {
      state.viewMode = 'public';
    }
    render();

    // INITIALIZE BACKGROUND DATABASE SYNC ON STARTUP
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
    }`;

const newStartup = `    // INITIAL RENDER WITH HASH ANCHOR AUTO-DETECTION
    if (window.location.hash && ['#about', '#facilities', '#reviews', '#contact', '#achievements', '#hero'].some(h => window.location.hash.toLowerCase().includes(h))) {
      state.viewMode = 'public';
    }

    // INITIALIZE SECURE AUTHENTICATION CHECK & BACKGROUND DATABASE SYNC ON STARTUP
    window.addEventListener('DOMContentLoaded', () => {
      verifyCurrentSession();
      // Auto background sync polling every 25 seconds (only when authenticated)
      setInterval(() => {
        if (!document.hidden && state.token && state.currentUser) {
          CloudSync.loadInitialData(true);
        }
      }, 25000);
      // Auto sync when user switches back to this tab/window
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.token && state.currentUser) {
          CloudSync.loadInitialData(true);
        }
      });
    });

    // Immediate fallback trigger if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(() => verifyCurrentSession(), 50);
    } else {
      render();
    }`;

if (!content.includes(oldStartup)) {
  console.error('Could not find oldStartup in index.html');
  process.exit(1);
}
content = content.replace(oldStartup, newStartup);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully updated index.html! New length:', content.length);
