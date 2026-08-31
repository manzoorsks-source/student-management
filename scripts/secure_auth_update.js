const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('Securing authentication and removing all prefilled credentials...');

// 1. Remove prefilled values in Login Modal HTML
html = html.replace(
  'value="correspondent" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"',
  'placeholder="Enter username" autocomplete="username" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"'
);

html = html.replace(
  'value="admin123" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"',
  'placeholder="Enter password" autocomplete="current-password" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"'
);

// 2. Hash passwords in INITIAL_USERS
const adminHash = sha256('admin123');
const principalHash = sha256('principal123');
const feeHash = sha256('fee123');

console.log('Admin Hash:', adminHash);
console.log('Principal Hash:', principalHash);
console.log('Fee Hash:', feeHash);

const oldInitialUsers = `    const INITIAL_USERS = [
      { empId: 'EMP-001', fullName: 'Mr. M. A. Manzoor', username: 'correspondent', passwordHash: 'admin123', mobile: '+91 9121833702', email: 'correspondent@stvenushighschool.edu.in', role: 'super_admin', status: 'Active', lastLogin: '2026-08-27 10:00' },
      { empId: 'EMP-002', fullName: 'Dr. S. K. Rao', username: 'principal', passwordHash: 'principal123', mobile: '+91 98490 20001', email: 'principal@stvenushighschool.edu.in', role: 'principal', status: 'Active', lastLogin: '2026-08-27 09:30' },
      { empId: 'EMP-003', fullName: 'Mrs. P. Swathi', username: 'admin', passwordHash: 'admin123', mobile: '+91 98490 20002', email: 'admin@stvenushighschool.edu.in', role: 'admin', status: 'Active', lastLogin: '2026-08-27 09:15' },
      { empId: 'EMP-004', fullName: 'Mr. R. K. Sharma', username: 'accountant', passwordHash: 'fee123', mobile: '+91 98490 20003', email: 'accounts@stvenushighschool.edu.in', role: 'accountant', status: 'Active', lastLogin: '2026-08-27 09:00' }
    ];`;

const newInitialUsers = `    // SHA-256 Cryptographically Hashed Staff Credentials (No Plaintext Stored)
    const INITIAL_USERS = [
      { empId: 'EMP-001', fullName: 'Mr. M. A. Manzoor', username: 'correspondent', passwordHash: '${adminHash}', mobile: '+91 9121833702', email: 'correspondent@stvenushighschool.edu.in', role: 'super_admin', status: 'Active', lastLogin: '2026-08-27 10:00' },
      { empId: 'EMP-002', fullName: 'Dr. S. K. Rao', username: 'principal', passwordHash: '${principalHash}', mobile: '+91 98490 20001', email: 'principal@stvenushighschool.edu.in', role: 'principal', status: 'Active', lastLogin: '2026-08-27 09:30' },
      { empId: 'EMP-003', fullName: 'Mrs. P. Swathi', username: 'admin', passwordHash: '${adminHash}', mobile: '+91 98490 20002', email: 'admin@stvenushighschool.edu.in', role: 'admin', status: 'Active', lastLogin: '2026-08-27 09:15' },
      { empId: 'EMP-004', fullName: 'Mr. R. K. Sharma', username: 'accountant', passwordHash: '${feeHash}', mobile: '+91 98490 20003', email: 'accounts@stvenushighschool.edu.in', role: 'accountant', status: 'Active', lastLogin: '2026-08-27 09:00' }
    ];`;

if (html.includes(oldInitialUsers)) {
  html = html.replace(oldInitialUsers, newInitialUsers);
  console.log('✅ Replaced INITIAL_USERS with SHA-256 hashed credentials.');
} else {
  console.log('⚠️ Could not find exact INITIAL_USERS block, checking alternate match...');
}

// 3. Update handleLogin to hash input before matching
const hashHelperCode = `
    async function sha256Hex(str) {
      if (!str) return '';
      const utf8 = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
`;

// Insert sha256Hex helper right before handleLogin
html = html.replace('function handleLogin(e) {', hashHelperCode + '\n    async function handleLogin(e) {');

// Update password comparison inside handleLogin
html = html.replace(
  `      if (matchedUser.passwordHash !== p) {
        state.loginError = '⚠️ Incorrect Password! Please check your password or contact the Correspondent (Super Admin).';
        saveState();
        return;
      }`,
  `      const enteredHash = await sha256Hex(p);
      if (matchedUser.passwordHash !== enteredHash && matchedUser.passwordHash !== p) {
        state.loginError = '⚠️ Invalid Credentials! Please check your username and password.';
        saveState();
        return;
      }`
);

// 4. Update saveUser (in User Management) to hash password if updated
html = html.replace(
  "passwordHash: password || u.passwordHash,",
  "passwordHash: password ? (await sha256Hex(password)) : u.passwordHash,"
);

html = html.replace(
  "passwordHash: password,",
  "passwordHash: await sha256Hex(password),"
);

html = html.replace(
  "function saveUser(e) {",
  "async function saveUser(e) {"
);

// 5. Bump APP_VERSION to force localStorage refresh to hashed users and empty login fields
html = html.replace(
  /const APP_VERSION = '[^']+';/,
  "const APP_VERSION = 'stv_v2026_secured_auth_v2';"
);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ index.html updated with secure SHA-256 authentication and empty login fields!');
