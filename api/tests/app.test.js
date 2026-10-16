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
