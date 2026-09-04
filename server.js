/**
 * Production-Ready Node.js Server for St. Venus High School Management System
 * Powers the web interface and handles all REST API requests with Aiven PostgreSQL
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import modular API handlers
const healthHandler = require('./api/health');
const stateHandler = require('./api/state');
const studentsHandler = require('./api/students');
const academicHandler = require('./api/academic');
const feesHandler = require('./api/fees');
const attendanceHandler = require('./api/attendance');

const PORT = parseInt(process.env.PORT, 10) || 8000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Helper to polyfill Express-like req.body and req.query for Vercel/Node compatibility
function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (body) {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      } else {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

function enhanceResponse(res) {
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };
  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  res.send = function (data) {
    res.end(data);
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  req.query = parsedUrl.query || {};

  // Parse JSON Body for POST/PUT/DELETE
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }

  // --- API ROUTING ---
  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/health') {
        return await healthHandler(req, res);
      }
      if (pathname === '/api/state') {
        return await stateHandler(req, res);
      }
      if (pathname === '/api/students' || pathname.startsWith('/api/students/')) {
        return await studentsHandler(req, res);
      }
      if (pathname === '/api/academic') {
        return await academicHandler(req, res);
      }
      if (pathname === '/api/fees') {
        return await feesHandler(req, res);
      }
      if (pathname === '/api/attendance') {
        return await attendanceHandler(req, res);
      }

      return res.status(404).json({ error: `API route not found: ${pathname}` });
    } catch (err) {
      console.error(`Error handling ${pathname}:`, err);
      return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
  }

  // --- STATIC FILE SERVING ---
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

  // Security check to prevent directory traversal
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    return res.end('Access Denied');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for Single-Page App routing
      safePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 500;
        return res.end('Error loading resource');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('🏫 ST. VENUS HIGH SCHOOL MANAGEMENT SYSTEM - BACKEND SERVER');
  console.log('================================================================');
  console.log(`🚀 Server running at:`);
  console.log(`   - Local:    http://localhost:${PORT}/`);
  console.log(`   - Network:  http://127.0.0.1:${PORT}/`);
  console.log(`☁️ Connected to Aiven PostgreSQL Cloud Database`);
  console.log(`📡 Endpoints active: /api/health, /api/state, /api/students, /api/fees, /api/academic, /api/attendance`);
  console.log('================================================================');
});
