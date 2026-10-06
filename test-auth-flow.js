const http = require('http');

const base = 'http://localhost:5000';
const user = {
  name: 'QA Test User',
  email: 'qa.test.user@example.com',
  password: 'Password123',
  role: 'candidate',
};

function requestJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(path, res.statusCode, body);
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    await requestJSON('/api/auth/register', user);
    await requestJSON('/api/auth/login', {
      email: user.email,
      password: user.password,
    });
  } catch (error) {
    console.error('AUTH_TEST_ERROR', error);
    process.exit(1);
  }
})();
