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
    assert.deepEqual(Object.keys(info.demoVideos).sort(), ['admin', 'officer', 'reporter']);
    assert.ok('url' in info.promoVideo && 'transcript' in info.promoVideo);
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

test('app-info sends each clip URL with its transcript, and no transcript without a URL (#48)', () => {
  const { appInfo, TRANSCRIPTS } = require('../src/config/videos');
  const keys = ['PROMO_VIDEO_URL', 'PROMO_VIDEO_TRANSCRIPT', 'DEMO_VIDEO_URL', 'DEMO_VIDEO_REPORTER_URL', 'DEMO_VIDEO_OFFICER_URL', 'DEMO_VIDEO_ADMIN_URL'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    keys.forEach((k) => delete process.env[k]);
    process.env.DEMO_VIDEO_URL = 'https://example.com/old.mp4';
    process.env.DEMO_VIDEO_OFFICER_URL = 'https://example.com/officer.mp4';
    let info = appInfo();
    assert.equal(info.demoVideoUrl, 'https://example.com/old.mp4');
    assert.deepEqual(info.promoVideo, { url: null, transcript: null });
    assert.deepEqual(info.demoVideos.officer, { url: 'https://example.com/officer.mp4', transcript: TRANSCRIPTS.officer });
    assert.deepEqual(info.demoVideos.reporter, { url: null, transcript: null });

    process.env.PROMO_VIDEO_URL = 'https://example.com/promo.mp4';
    process.env.PROMO_VIDEO_TRANSCRIPT = 'Hello';
    info = appInfo();
    assert.equal(info.demoVideoUrl, 'https://example.com/promo.mp4');
    assert.deepEqual(info.promoVideo, { url: 'https://example.com/promo.mp4', transcript: 'Hello' });
  } finally {
    keys.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  }
});
