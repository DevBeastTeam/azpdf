const http = require('http');

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runLiveTests() {
  console.log('🧪 Testing Live Node.js Backend Server on http://localhost:5000...\n');
  const results = [];

  const endpoints = [
    { name: 'Health Check', path: '/api/health', method: 'GET' },
    { name: 'Admin Data', path: '/api/admin/data', method: 'GET' },
    { name: 'User Invoices', path: '/api/user/invoices', method: 'GET' },
    { 
      name: 'Auth Login', 
      path: '/api/auth/login', 
      method: 'POST', 
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      headers: { 'Content-Type': 'application/json' }
    },
    { 
      name: 'Auth Signup', 
      path: '/api/auth/signup', 
      method: 'POST', 
      body: JSON.stringify({ name: 'Test User', email: `test_${Date.now()}@example.com`, password: 'password123' }),
      headers: { 'Content-Type': 'application/json' }
    },
    { 
      name: 'Contact Support', 
      path: '/api/contact', 
      method: 'POST', 
      body: JSON.stringify({ name: 'User', email: 'user@example.com', subject: 'Help', message: 'Test message' }),
      headers: { 'Content-Type': 'application/json' }
    },
    { 
      name: 'Support Ticket', 
      path: '/api/support/ticket', 
      method: 'POST', 
      body: JSON.stringify({ category: 'Billing', issueDetails: 'Test ticket', userEmail: 'user@example.com' }),
      headers: { 'Content-Type': 'application/json' }
    },
    { 
      name: 'Billing Upgrade', 
      path: '/api/user/billing', 
      method: 'POST', 
      body: JSON.stringify({ userId: 1, plan: 'PREMIUM', billingCycle: 'monthly' }),
      headers: { 'Content-Type': 'application/json' }
    },
    { 
      name: 'Payment Method', 
      path: '/api/user/payment-method', 
      method: 'POST', 
      body: JSON.stringify({ cardType: 'Visa', cardNumber: '4242424242424242' }),
      headers: { 'Content-Type': 'application/json' }
    }
  ];

  for (const ep of endpoints) {
    try {
      const res = await makeRequest(ep.path, ep.method, ep.body, ep.headers);
      const pass = res.statusCode >= 200 && res.statusCode < 300;
      results.push({ name: ep.name, path: ep.path, status: res.statusCode, pass });
      console.log(`${pass ? '✅ PASS' : '❌ FAIL'} [${res.statusCode}] ${ep.name} (${ep.path})`);
    } catch (err) {
      results.push({ name: ep.name, path: ep.path, error: err.message, pass: false });
      console.log(`❌ FAIL ${ep.name} (${ep.path}) - Error: ${err.message}`);
    }
  }

  // PDF Tool Endpoints
  const pdfTools = [
    '/api/merge', '/api/split', '/api/compress', '/api/jpg-to-pdf', '/api/pdf-to-jpg',
    '/api/rotate', '/api/watermark', '/api/protect', '/api/pdf-to-txt', '/api/pdf-to-word',
    '/api/pdf-to-ppt', '/api/pdf-to-excel', '/api/word-to-pdf', '/api/ppt-to-pdf', '/api/excel-to-pdf',
    '/api/organize', '/api/unlock', '/api/ai-summarizer', '/api/translate', '/api/pdf-to-markdown',
    '/api/edit-pdf', '/api/sign-pdf', '/api/html-to-pdf', '/api/pdf-to-pdfa', '/api/repair',
    '/api/page-numbers', '/api/scan-to-pdf', '/api/ocr', '/api/compare', '/api/redact',
    '/api/crop', '/api/forms'
  ];

  console.log('\n📄 Testing PDF Tool Processing Endpoints...');
  for (const toolEndpoint of pdfTools) {
    try {
      const res = await makeRequest(toolEndpoint, 'POST');
      const pass = res.statusCode >= 200 && res.statusCode < 300;
      results.push({ name: toolEndpoint, path: toolEndpoint, status: res.statusCode, pass });
      console.log(`${pass ? '✅ PASS' : '❌ FAIL'} [${res.statusCode}] ${toolEndpoint}`);
    } catch (err) {
      results.push({ name: toolEndpoint, path: toolEndpoint, error: err.message, pass: false });
      console.log(`❌ FAIL ${toolEndpoint} - Error: ${err.message}`);
    }
  }

  const totalPassed = results.filter(r => r.pass).length;
  console.log(`\n=================================`);
  console.log(`Summary: ${totalPassed} / ${results.length} tests passed successfully!`);
  console.log(`=================================`);
}

runLiveTests();
