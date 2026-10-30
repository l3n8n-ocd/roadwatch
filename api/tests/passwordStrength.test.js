// Password strength rules (#44). The web (web/src/lib/passwordStrength.js) and the app
// (mobile/test/password_strength_test.dart) check the same cases.
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkPassword, isStrong, assertStrongPassword } = require('../src/utils/passwordStrength');

const juan = { name: 'Juan Dela Cruz', email: 'juan.reporter@example.com' };
const CASES = [
  ['', undefined, 'empty', 'Use 8+ characters with uppercase, lowercase, a number and a symbol.'],
  ['abc', undefined, 'weak', 'Use at least 8 characters (3 so far).'],
  ['Abc12!', undefined, 'weak', 'Use at least 8 characters (6 so far).'],
  ['password', undefined, 'weak', 'This is a common password. Pick something harder to guess.'],
  ['Password1!', undefined, 'weak', 'This is a common password. Pick something harder to guess.'],
  ['P@ssw0rd!', undefined, 'weak', 'This is a common password. Pick something harder to guess.'],
  ['Qwerty2026!', undefined, 'weak', 'This is a common password. Pick something harder to guess.'],
  ['Roadwatch#2026', undefined, 'strong', 'Strong password.'],
  ['Liza-2026-temp', { name: 'Liza Manalo', email: 'l.manalo@roadwatch.example' }, 'weak', "Don't use your name or email in the password."],
  ['12345678', undefined, 'weak', 'This is a common password. Pick something harder to guess.'],
  ['Juan2026!x', juan, 'weak', "Don't use your name or email in the password."],
  ['Reporter#2026', juan, 'weak', "Don't use your name or email in the password."],
  ['lowercase', undefined, 'weak', 'Add an uppercase letter, a number and a symbol (like ! or #).'],
  ['Sunflower', undefined, 'fair', 'Add a number and a symbol (like ! or #).'],
  ['Sunflower7', undefined, 'good', 'Add a symbol (like ! or #), or use 12+ characters.'],
  ['sunflowerfield7', undefined, 'good', 'Add an uppercase letter or a symbol (like ! or #).'],
  ['Sunflower7!', undefined, 'strong', 'Strong password.'],
  ['Sunflowerfield7', undefined, 'strong', 'Strong password.'],
  ['sun flower 7', undefined, 'strong', 'Strong password.'],
  ['Juan2026!x', undefined, 'strong', 'Strong password.'],
];

test('password strength levels and tips', () => {
  for (const [password, person, level, tip] of CASES) {
    assert.deepEqual(
      (({ level: l, tip: t }) => ({ level: l, tip: t }))(checkPassword(password, person)),
      { level, tip },
      `"${password}"`,
    );
  }
});

test('only Strong passes; the error names the field', () => {
  assert.equal(isStrong('Sunflower7!'), true);
  assert.equal(isStrong('Sunflower7'), false);
  assert.doesNotThrow(() => assertStrongPassword('Sunflower7!', juan, 'password'));
  assert.throws(() => assertStrongPassword('Sunflower7', juan, 'new_password'), (err) => err.status === 400
    && err.message === 'Make the password Strong to save it.'
    && err.details.new_password[0] === 'Make the password Strong to save it.');
});
