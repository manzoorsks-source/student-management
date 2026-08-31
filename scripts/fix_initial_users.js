const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const targetBlock = `        status: '🟢 Delivered (11-Aug-2026)'
      },
      {
        id: 'BC-2026-002',
        timestamp: '10-Aug-2026 04:15 PM',
      heroSubtitle:`;

// Let's find where BC-2026-002 is
const correctSection = `        status: '🟢 Delivered (3/3 Success)'
      },
      {
        id: 'BC-2026-002',
        timestamp: '10-Aug-2026 04:15 PM',
        sender: 'Dr. S. K. Rao (Principal)',
        type: 'School Program & Achievement Photo Dispatch',
        targetAudience: 'ALL ENROLLED PARENTS',
        recipientCount: 130,
        message: '🎉 Congratulations! ST. VENUS HIGH SCHOOL won 1st Prize in State Science Fair 2026 for Robotics Project! Here is the celebration photo!',
        photoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        status: '🟢 Delivered (130/130 Success)'
      }
    ];

    // SHA-256 Cryptographically Hashed Staff Credentials (No Plaintext Passwords Stored)
    const INITIAL_USERS = [
      { empId: 'EMP-001', fullName: 'Mr. M. A. Manzoor', username: 'correspondent', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', mobile: '+91 9121833702', email: 'correspondent@stvenushighschool.edu.in', role: 'super_admin', status: 'Active', lastLogin: '2026-08-27 10:00' },
      { empId: 'EMP-002', fullName: 'Dr. S. K. Rao', username: 'principal', passwordHash: '3549f22fb8622a6d216ef2dcd592e04ed1f1e604cef032d7e5c425e8e72a878e', mobile: '+91 98490 20001', email: 'principal@stvenushighschool.edu.in', role: 'principal', status: 'Active', lastLogin: '2026-08-27 09:30' },
      { empId: 'EMP-003', fullName: 'Mrs. P. Swathi', username: 'admin', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', mobile: '+91 98490 20002', email: 'admin@stvenushighschool.edu.in', role: 'admin', status: 'Active', lastLogin: '2026-08-27 09:15' },
      { empId: 'EMP-004', fullName: 'Mr. R. K. Sharma', username: 'accountant', passwordHash: 'a3bb3e757cdafff78fe3aabe1055ccfdda164e5989eef213a683b5eecb3a0b64', mobile: '+91 98490 20003', email: 'accounts@stvenushighschool.edu.in', role: 'accountant', status: 'Active', lastLogin: '2026-08-27 09:00' }
    ];

    const INITIAL_WEBSITE_DATA = {
      heroTitle: "Welcome to ST. VENUS HIGH SCHOOL",
      motto: "Recognised by Govt. of Telangana • Empowering Minds, Shaping Futures",
      heroSubtitle:`;

html = html.replace(/status: '🟢 Delivered \(3\/3 Success\)'[\s\S]*?heroSubtitle:/, correctSection);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ Successfully fixed INITIAL_USERS and INITIAL_WEBSITE_DATA!');
