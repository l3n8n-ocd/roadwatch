// Password strength (#44, DECISIONS #44). Same rules as the API (api/src/utils/passwordStrength.js) and the
// web (web/src/lib/passwordStrength.js); keep the three in step. The server refuses any new password that
// is not Strong, so this file only drives the meter and the form check.
//
// Kinds of character: lowercase, uppercase, number, symbol (anything else, including a space).
//   Weak:   under 8 characters, one kind only, a common password, or contains the person's name or email
//   Fair:   8+ characters with 2 kinds
//   Good:   8+ with 3 kinds, or 12+ with 2 kinds
//   Strong: 8+ with all 4 kinds, or 12+ with 3 kinds

enum PasswordLevel { empty, weak, fair, good, strong }

class PasswordStrength {
  const PasswordStrength(this.level, this.tip);
  final PasswordLevel level;
  final String tip;

  bool get isStrong => level == PasswordLevel.strong;

  /// "Weak", "Fair", "Good", "Strong"; empty for [PasswordLevel.empty].
  String get word => switch (level) {
    PasswordLevel.empty => '',
    PasswordLevel.weak => 'Weak',
    PasswordLevel.fair => 'Fair',
    PasswordLevel.good => 'Good',
    PasswordLevel.strong => 'Strong',
  };
}

const String notStrongMessage = 'Make the password Strong to save it.';
const int _minLength = 8;
const int _longLength = 12;

final List<(RegExp, String)> _kinds = [
  (RegExp(r'\p{Lu}', unicode: true), 'an uppercase letter'),
  (RegExp(r'\p{Ll}', unicode: true), 'a lowercase letter'),
  (RegExp(r'\p{Nd}', unicode: true), 'a number'),
  (RegExp(r'[^\p{L}\p{Nd}]', unicode: true), 'a symbol (like ! or #)'),
];

// Whole passwords that are too easy to guess (compared in lowercase).
const Set<String> _commonPasswords = {
  '12345678',
  '123456789',
  '1234567890',
  '0123456789',
  '87654321',
  '11111111',
  '00000000',
  '12341234',
  '11223344',
  '1q2w3e4r',
  '1qaz2wsx',
  'qwer1234',
  'abcd1234',
  'a1b2c3d4',
  'zaq12wsx',
};
// Common words: a password is weak if its letters are one of these, also when it only adds numbers or
// symbols at the end ("Password1!") or swaps letters for look-alikes ("P@ssw0rd").
const Set<String> _commonWords = {
  'password',
  'passwort',
  'qwerty',
  'qwertyuiop',
  'asdfgh',
  'asdfghjkl',
  'zxcvbnm',
  'qazwsx',
  'admin',
  'administrator',
  'welcome',
  'letmein',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'basketball',
  'monkey',
  'dragon',
  'master',
  'shadow',
  'superman',
  'batman',
  'trustno',
  'changeme',
  'secret',
  'login',
  'guest',
  'test',
  'user',
  'abc',
  'abcd',
  'abcde',
  'abcdef',
  'abcdefg',
  'abcdefgh',
};
const Map<String, String> _lookAlikes = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  r'$': 's',
  '5': 's',
  '7': 't',
};

bool _isCommon(String password) {
  final lower = password.toLowerCase();
  if (_commonPasswords.contains(lower)) return true;
  final lettersOnly = lower.replaceAll(RegExp('[^a-z]'), '');
  final core = lower
      .replaceFirst(RegExp(r'[^a-z]+$'), '')
      .replaceAllMapped(RegExp(r'[@4310!$57]'), (m) => _lookAlikes[m[0]]!)
      .replaceAll(RegExp('[^a-z]'), '');
  return _commonWords.contains(lettersOnly) || _commonWords.contains(core);
}

// Parts of the person's name and email (3+ letters) that must not appear in the password.
List<String> _personalParts(String? name, String? email) {
  final parts = <String>{};
  void add(String? text) {
    for (final p in (text ?? '').toLowerCase().split(RegExp(r'[^\p{L}\p{Nd}]+', unicode: true))) {
      if (p.length >= 3) parts.add(p);
    }
  }

  add(name);
  final local = (email ?? '').split('@').first;
  add(local);
  if (local.length >= 3) parts.add(local.toLowerCase());
  return parts.toList();
}

String _join(List<String> tips, String word) =>
    tips.length < 2 ? tips.join() : '${tips.sublist(0, tips.length - 1).join(', ')} $word ${tips.last}';

/// Level and tip for [password]. [name] and [email] are the account's, when known.
PasswordStrength checkPassword(String password, {String? name, String? email}) {
  final length = password.runes.length;
  if (length == 0) {
    return const PasswordStrength(
      PasswordLevel.empty,
      'Use 8+ characters with uppercase, lowercase, a number and a symbol.',
    );
  }
  PasswordStrength weak(String tip) => PasswordStrength(PasswordLevel.weak, tip);
  if (length < _minLength) return weak('Use at least $_minLength characters ($length so far).');
  if (_isCommon(password)) return weak('This is a common password. Pick something harder to guess.');
  final lower = password.toLowerCase();
  if (_personalParts(name, email).any(lower.contains)) {
    return weak("Don't use your name or email in the password.");
  }

  final missing = [
    for (final (re, tip) in _kinds)
      if (!re.hasMatch(password)) tip,
  ];
  final kinds = _kinds.length - missing.length;
  final long = length >= _longLength;
  if (kinds == 4 || (long && kinds == 3)) {
    return const PasswordStrength(PasswordLevel.strong, 'Strong password.');
  }
  if (kinds == 1) return weak('Add ${_join(missing, 'and')}.');
  if (kinds == 3) {
    return PasswordStrength(PasswordLevel.good, 'Add ${missing.first}, or use $_longLength+ characters.');
  }
  if (long) return PasswordStrength(PasswordLevel.good, 'Add ${_join(missing, 'or')}.');
  return PasswordStrength(PasswordLevel.fair, 'Add ${_join(missing, 'and')}.');
}
