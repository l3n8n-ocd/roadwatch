// Unit tests for the stateless reset code (#37). No database needed.
const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret-123456';
const { makeResetCode, isValidResetCode, normalizeCode } = require('../src/services/passwordResetService');

const user = { user_id: 7, password_hash: '$2b$12$example-hash-one' };

test('reset code: 8 letters and digits without look-alikes, valid for 15 minutes', (t) => {
  const code = makeResetCode(user);
  assert.match(code, /^[A-HJKMNP-Z2-9]{8}$/);
  assert.ok(isValidResetCode(user, code));
  assert.ok(isValidResetCode(user, ` ${code.toLowerCase().slice(0, 4)}-${code.slice(4)} `));
  assert.equal(normalizeCode('ab cd-ef'), 'ABCDEF');

  const start = Date.now();
  t.mock.method(Date, 'now', () => start + 14 * 60000);
  assert.ok(isValidResetCode(user, code), 'still valid at 14 minutes');
  Date.now.mock.mockImplementation(() => start + 16 * 60000);
  assert.ok(!isValidResetCode(user, code), 'expired after 15 minutes');
});

test('reset code: tied to the user and the current password', () => {
  const code = makeResetCode(user);
  assert.ok(!isValidResetCode({ ...user, user_id: 8 }, code), 'another user');
  assert.ok(!isValidResetCode({ ...user, password_hash: '$2b$12$example-hash-two' }, code), 'used once: a new password changes every code');
  assert.ok(!isValidResetCode(user, ''), 'empty');
  assert.ok(!isValidResetCode(user, `${code}X`), 'wrong length');
});
