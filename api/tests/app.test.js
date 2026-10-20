const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

test('app exports an Express app', () => {
  assert.equal(typeof app, 'function');
});

test('health and app-info endpoints respond', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`).then((r) => r.json());
    assert.equal(health.status, 'ok');
    const info = await fetch(`http://127.0.0.1:${port}/api/app-info`).then((r) => r.json());
    assert.ok('demoVideoUrl' in info);
  } finally {
    server.close();
  }
});

test('login requires a valid platform (web or mobile) before any database lookup', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const login = (body) => fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  try {
    const missing = await login({ contact_email: 'someone@example.com', password: 'password123' });
    assert.equal(missing.status, 400);
    assert.ok(missing.body.details.platform);
    const wrong = await login({ contact_email: 'someone@example.com', password: 'password123', platform: 'desktop' });
    assert.equal(wrong.status, 400);
    assert.match(wrong.body.details.platform[0], /web' or 'mobile/);
  } finally {
    server.close();
  }
});
