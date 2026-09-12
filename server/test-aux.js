const http = require('http');

function req(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const request = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const str = Buffer.concat(chunks).toString();
        let parsed = null;
        try { parsed = JSON.parse(str); } catch (e) { parsed = str; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function run() {
  console.log('Testing auxiliary backend endpoints...');
  let passed = 0, failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name} -> ${e.message}`);
      failed++;
    }
  }

  await test('GET /api/health', async () => {
    const r = await req('/api/health');
    if (r.status !== 200 || r.body.status !== 'ok') throw new Error(JSON.stringify(r));
  });

  await test('GET /api/admin/data', async () => {
    const r = await req('/api/admin/data');
    if (r.status !== 200 || !r.body.usersData) throw new Error(JSON.stringify(r));
  });

  await test('POST /api/contact', async () => {
    const r = await req('/api/contact', 'POST', {
      fullName: 'Test User',
      email: 'test@example.com',
      message: 'Test message from verification suite'
    });
    if (r.status !== 200 || !r.body.success) throw new Error(JSON.stringify(r));
  });

  await test('GET /api/admin/contact-messages', async () => {
    const r = await req('/api/admin/contact-messages');
    if (r.status !== 200 || !Array.isArray(r.body.messages)) throw new Error(JSON.stringify(r));
  });

  await test('POST /api/support/ticket', async () => {
    const r = await req('/api/support/ticket', 'POST', {
      category: 'Billing',
      issueDetails: 'Test ticket details',
      userEmail: 'test@example.com'
    });
    if (r.status !== 200 || !r.body.success) throw new Error(JSON.stringify(r));
  });

  await test('GET /api/user/invoices', async () => {
    const r = await req('/api/user/invoices');
    if (r.status !== 200 || !Array.isArray(r.body.invoices)) throw new Error(JSON.stringify(r));
  });

  await test('POST /api/user/billing', async () => {
    const r = await req('/api/user/billing', 'POST', { plan: 'PREMIUM' });
    if (r.status !== 200 || !r.body.success) throw new Error(JSON.stringify(r));
  });

  await test('POST /api/user/payment-method', async () => {
    const r = await req('/api/user/payment-method', 'POST', {
      cardType: 'MasterCard',
      cardNumber: '5555444433332222'
    });
    if (r.status !== 200 || !r.body.success) throw new Error(JSON.stringify(r));
  });

  await test('POST /api/user/profile', async () => {
    const r = await req('/api/user/profile', 'POST', {
      email: 'test@example.com',
      name: 'Tester Updated'
    });
    if (r.status !== 200 || !r.body.success) throw new Error(JSON.stringify(r));
  });

  console.log(`\nAuxiliary Endpoints Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
}

run();
