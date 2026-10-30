// Password strength (#44, DECISIONS #44). The same rules run in the web (web/src/lib/passwordStrength.js)
// and the app (mobile/lib/core/password_strength.dart), so the meter and the server always agree.
// Keep the three files in step; the test vectors in tests/passwordStrength.test.js cover the rules.
//
// Kinds of character: lowercase, uppercase, number, symbol (anything else, including a space).
//   Weak:   under 8 characters, one kind only, a common password, or contains the person's name or email
//   Fair:   8+ characters with 2 kinds
//   Good:   8+ with 3 kinds, or 12+ with 2 kinds
//   Strong: 8+ with all 4 kinds, or 12+ with 3 kinds
// Saving a new password needs Strong.
const HttpError = require('./httpError');

const MIN_LENGTH = 8;
const LONG_LENGTH = 12;
const LEVELS = ['empty', 'weak', 'fair', 'good', 'strong'];
const NOT_STRONG = 'Make the password Strong to save it.';

const KINDS = [
  { key: 'upper', test: /\p{Lu}/u, tip: 'an uppercase letter' },
  { key: 'lower', test: /\p{Ll}/u, tip: 'a lowercase letter' },
  { key: 'number', test: /\p{Nd}/u, tip: 'a number' },
  { key: 'symbol', test: /[^\p{L}\p{Nd}]/u, tip: 'a symbol (like ! or #)' },
];

// Whole passwords that are too easy to guess (compared in lowercase).
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '0123456789', '87654321', '11111111', '00000000', '12341234',
  '11223344', '1q2w3e4r', '1qaz2wsx', 'qwer1234', 'abcd1234', 'a1b2c3d4', 'zaq12wsx',
]);
// Common words: a password is weak if its letters are one of these, also when it only adds numbers or
// symbols at the end ("Password1!") or swaps letters for look-alikes ("P@ssw0rd").
const COMMON_WORDS = new Set([
  'password', 'passwort', 'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbnm', 'qazwsx', 'admin',
  'administrator', 'welcome', 'letmein', 'iloveyou', 'sunshine', 'princess', 'football', 'baseball',
  'basketball', 'monkey', 'dragon', 'master', 'shadow', 'superman', 'batman', 'trustno', 'changeme',
  'secret', 'login', 'guest', 'test', 'user', 'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg', 'abcdefgh',
]);
const LOOK_ALIKES = { '@': 'a', 4: 'a', 3: 'e', 1: 'i', '!': 'i', 0: 'o', $: 's', 5: 's', 7: 't' };

function isCommon(password) {
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  const lettersOnly = lower.replace(/[^a-z]/g, '');
  const core = lower
    .replace(/[^a-z]+$/, '')
    .replace(/[@4310!$57]/g, (c) => LOOK_ALIKES[c])
    .replace(/[^a-z]/g, '');
  return COMMON_WORDS.has(lettersOnly) || COMMON_WORDS.has(core);
}

// Parts of the person's name and email (3+ letters) that must not appear in the password.
function personalParts({ name, email } = {}) {
  const parts = new Set();
  const add = (text) => {
    for (const p of String(text || '').toLowerCase().split(/[^\p{L}\p{Nd}]+/u)) if (p.length >= 3) parts.add(p);
  };
  add(name);
  const local = String(email || '').split('@')[0];
  add(local);
  if (local.length >= 3) parts.add(local.toLowerCase());
  return [...parts];
}

const joinTips = (tips, word) => (tips.length < 2 ? tips.join('') : `${tips.slice(0, -1).join(', ')} ${word} ${tips[tips.length - 1]}`);

// Returns { level, score (0 to 4), tip }. person = { name, email } of the account, when known.
function checkPassword(password, person) {
  const pw = String(password || '');
  const length = [...pw].length;
  if (length === 0) {
    return { level: 'empty', score: 0, tip: 'Use 8+ characters with uppercase, lowercase, a number and a symbol.' };
  }
  const weak = (tip) => ({ level: 'weak', score: 1, tip });
  if (length < MIN_LENGTH) return weak(`Use at least ${MIN_LENGTH} characters (${length} so far).`);
  if (isCommon(pw)) return weak('This is a common password. Pick something harder to guess.');
  const lower = pw.toLowerCase();
  if (personalParts(person).some((part) => lower.includes(part))) return weak("Don't use your name or email in the password.");

  const missing = KINDS.filter((k) => !k.test.test(pw)).map((k) => k.tip);
  const kinds = KINDS.length - missing.length;
  const long = length >= LONG_LENGTH;
  if (kinds === 4 || (long && kinds === 3)) return { level: 'strong', score: 4, tip: 'Strong password.' };
  if (kinds === 1) return weak(`Add ${joinTips(missing, 'and')}.`);
  if (kinds === 3) return { level: 'good', score: 3, tip: `Add ${missing[0]}, or use ${LONG_LENGTH}+ characters.` };
  if (long) return { level: 'good', score: 3, tip: `Add ${joinTips(missing, 'or')}.` };
  return { level: 'fair', score: 2, tip: `Add ${joinTips(missing, 'and')}.` };
}

const isStrong = (password, person) => checkPassword(password, person).level === 'strong';

// For controllers: a 400 with the message on the field when the new password is not Strong.
function assertStrongPassword(password, person, field) {
  if (!isStrong(password, person)) throw new HttpError(400, NOT_STRONG, { [field]: [NOT_STRONG] });
}

module.exports = { checkPassword, isStrong, assertStrongPassword, LEVELS, NOT_STRONG };
