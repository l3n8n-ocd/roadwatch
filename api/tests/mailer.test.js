// Brevo mailer (#37): no network is used; global fetch is replaced in each test.
const test = require('node:test');
const assert = require('node:assert');
const { sendMail, mailConfigured, parseSender } = require('../src/config/mailer');

const MAIL_KEYS = ['MAIL_PROVIDER', 'MAIL_FROM', 'BREVO_API_KEY'];

function withEnv(values, fn) {
  return async (t) => {
    const saved = Object.fromEntries(MAIL_KEYS.map((k) => [k, process.env[k]]));
    const realFetch = global.fetch;
    for (const k of MAIL_KEYS) delete process.env[k];
    Object.assign(process.env, values);
    try {
      await fn(t);
    } finally {
      global.fetch = realFetch;
      for (const k of MAIL_KEYS) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    }
  };
}

test('MAIL_FROM with or without a display name', () => {
  assert.deepEqual(parseSender('RoadWatch <no-reply@roadwatch-ph.me>'), { name: 'RoadWatch', email: 'no-reply@roadwatch-ph.me' });
  assert.deepEqual(parseSender('"Road Watch" <a@b.me>'), { name: 'Road Watch', email: 'a@b.me' });
  assert.deepEqual(parseSender('a@b.me'), { name: 'RoadWatch', email: 'a@b.me' });
});

test('email is off without a provider, or with brevo but no key', withEnv({}, async () => {
  assert.equal(mailConfigured(), false);
  process.env.MAIL_PROVIDER = 'brevo';
  process.env.MAIL_FROM = 'a@b.me';
  assert.equal(mailConfigured(), false);
  global.fetch = () => assert.fail('must not call Brevo');
  assert.deepEqual(await sendMail({ to: 'x@y.me', subject: 's', text: 't' }), { skipped: true });
}));

test('MAIL_PROVIDER=log prints instead of sending', withEnv({ MAIL_PROVIDER: 'log' }, async (t) => {
  global.fetch = () => assert.fail('must not call Brevo');
  const info = t.mock.method(console, 'info', () => {});
  assert.equal(mailConfigured(), true);
  assert.deepEqual(await sendMail({ to: 'x@y.me', subject: 'Hello', text: 'Body' }), { logged: true });
  assert.match(info.mock.calls[0].arguments[0], /to=x@y\.me subject="Hello"/);
}));

test('MAIL_PROVIDER=brevo posts to the Brevo API', withEnv(
  { MAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'test-key', MAIL_FROM: 'RoadWatch <no-reply@roadwatch-ph.me>' },
  async () => {
    let call;
    global.fetch = async (url, init) => {
      call = { url, init };
      return new Response(JSON.stringify({ messageId: '<abc@brevo>' }), { status: 201 });
    };
    const result = await sendMail({ to: 'x@y.me', subject: 'Report #1', text: 'Received' });
    assert.equal(result.messageId, '<abc@brevo>');
    assert.equal(call.url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(call.init.method, 'POST');
    assert.equal(call.init.headers['api-key'], 'test-key');
    assert.deepEqual(JSON.parse(call.init.body), {
      sender: { name: 'RoadWatch', email: 'no-reply@roadwatch-ph.me' },
      to: [{ email: 'x@y.me' }],
      subject: 'Report #1',
      textContent: 'Received',
    });
  }
));

test('a Brevo error is thrown without the API key', withEnv(
  { MAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'secret-key-value', MAIL_FROM: 'a@b.me' },
  async () => {
    global.fetch = async () => new Response(JSON.stringify({ code: 'unauthorized', message: 'Key not found' }), { status: 401 });
    await assert.rejects(sendMail({ to: 'x@y.me', subject: 's', text: 't' }), (err) => {
      assert.equal(err.message, 'Brevo answered 401: Key not found');
      assert.doesNotMatch(err.message, /secret-key-value/);
      return true;
    });
  }
));
