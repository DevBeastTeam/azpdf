const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testAuth() {
  console.log('--- Testing Live Authentication Flow ---');
  const testEmail = `user_${Date.now()}@test.com`;
  const testPassword = 'Password123!';
  const testName = 'Zubair Khan';

  // 1. New user signup
  console.log('1. Signing up new user...');
  const resSignup = await post('/api/auth/signup', { name: testName, email: testEmail, password: testPassword });
  console.log('Signup Response:', resSignup.status, resSignup.body);
  if (!resSignup.body.success || resSignup.body.user.name !== testName) {
    throw new Error('Signup failed');
  }

  // 2. Duplicate signup attempt
  console.log('\n2. Attempting duplicate signup with same email...');
  const resDup = await post('/api/auth/signup', { name: 'Dup', email: testEmail, password: 'any' });
  console.log('Duplicate Signup Response:', resDup.status, resDup.body);
  if (resDup.status !== 400) {
    throw new Error('Duplicate check failed');
  }

  // 3. Login with wrong password
  console.log('\n3. Logging in with wrong password...');
  const resWrong = await post('/api/auth/login', { email: testEmail, password: 'WrongPassword' });
  console.log('Wrong Password Response:', resWrong.status, resWrong.body);
  if (resWrong.status !== 401) {
    throw new Error('Wrong password check failed');
  }

  // 4. Login with correct password
  console.log('\n4. Logging in with correct password...');
  const resLogin = await post('/api/auth/login', { email: testEmail, password: testPassword });
  console.log('Correct Login Response:', resLogin.status, resLogin.body);
  if (!resLogin.body.success || resLogin.body.user.email !== testEmail) {
    throw new Error('Login failed');
  }

  console.log('\n=======================================');
  console.log('ALL AUTH TESTS PASSED WITH 100% SUCCESS!');
  console.log('=======================================');
}

testAuth().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
