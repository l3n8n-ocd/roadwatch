// Forgot password (#37, DECISIONS #43): an 8-character code sent by email, typed in the app.
// The code is not stored anywhere (no new table): it is an HMAC of the user id, the current password
// hash and the minute it was made, keyed with JWT_SECRET. So it
// - expires after CODE_MINUTES (only the last CODE_MINUTES minutes are checked),
// - works once (resetting the password changes the hash, which changes every code),
// - cannot be guessed without the server secret.
const crypto = require('crypto');
const { getJwtSecret } = require('../config/env');

const CODE_MINUTES = 15;
const CODE_LENGTH = 8;
// Letters and digits without the look-alikes 0/O, 1/I/L.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const minuteNow = () => Math.floor(Date.now() / 60000);

function codeFor(user, minute) {
  const digest = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`password-reset|${user.user_id}|${user.password_hash}|${minute}`)
    .digest();
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[digest[i] % ALPHABET.length];
  return code;
}

// What the user typed: case and spaces or dashes do not matter ("k7q2-m9xp" works).
function normalizeCode(text) {
  return String(text || '').toUpperCase().replace(/[\s-]+/g, '');
}

function makeResetCode(user) {
  return codeFor(user, minuteNow());
}

function isValidResetCode(user, typed) {
  const code = Buffer.from(normalizeCode(typed));
  if (code.length !== CODE_LENGTH) return false;
  const now = minuteNow();
  let ok = false;
  // Check every minute in the window (no early exit, so the timing is the same for any code).
  for (let m = now; m > now - CODE_MINUTES; m -= 1) {
    if (crypto.timingSafeEqual(code, Buffer.from(codeFor(user, m)))) ok = true;
  }
  return ok;
}

module.exports = { makeResetCode, isValidResetCode, normalizeCode, CODE_MINUTES, CODE_LENGTH };
