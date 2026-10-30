// Password strength (#44): the same cases as api/tests/passwordStrength.test.js, plus the meter widget.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:roadwatch_mobile/core/password_strength.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/core/widgets/widgets.dart';

const _juan = (name: 'Juan Dela Cruz', email: 'juan.reporter@example.com');
const _liza = (name: 'Liza Manalo', email: 'l.manalo@roadwatch.example');

const _cases = <(String, ({String name, String email})?, PasswordLevel, String)>[
  ('', null, PasswordLevel.empty, 'Use 8+ characters with uppercase, lowercase, a number and a symbol.'),
  ('abc', null, PasswordLevel.weak, 'Use at least 8 characters (3 so far).'),
  ('Abc12!', null, PasswordLevel.weak, 'Use at least 8 characters (6 so far).'),
  ('password', null, PasswordLevel.weak, 'This is a common password. Pick something harder to guess.'),
  ('Password1!', null, PasswordLevel.weak, 'This is a common password. Pick something harder to guess.'),
  ('P@ssw0rd!', null, PasswordLevel.weak, 'This is a common password. Pick something harder to guess.'),
  ('Qwerty2026!', null, PasswordLevel.weak, 'This is a common password. Pick something harder to guess.'),
  ('Roadwatch#2026', null, PasswordLevel.strong, 'Strong password.'),
  ('Liza-2026-temp', _liza, PasswordLevel.weak, "Don't use your name or email in the password."),
  ('12345678', null, PasswordLevel.weak, 'This is a common password. Pick something harder to guess.'),
  ('Juan2026!x', _juan, PasswordLevel.weak, "Don't use your name or email in the password."),
  ('Reporter#2026', _juan, PasswordLevel.weak, "Don't use your name or email in the password."),
  ('lowercase', null, PasswordLevel.weak, 'Add an uppercase letter, a number and a symbol (like ! or #).'),
  ('Sunflower', null, PasswordLevel.fair, 'Add a number and a symbol (like ! or #).'),
  ('Sunflower7', null, PasswordLevel.good, 'Add a symbol (like ! or #), or use 12+ characters.'),
  ('sunflowerfield7', null, PasswordLevel.good, 'Add an uppercase letter or a symbol (like ! or #).'),
  ('Sunflower7!', null, PasswordLevel.strong, 'Strong password.'),
  ('Sunflowerfield7', null, PasswordLevel.strong, 'Strong password.'),
  ('sun flower 7', null, PasswordLevel.strong, 'Strong password.'),
  ('Juan2026!x', null, PasswordLevel.strong, 'Strong password.'),
];

void main() {
  test('levels and tips match the API rules', () {
    for (final (password, person, level, tip) in _cases) {
      final s = checkPassword(password, name: person?.name, email: person?.email);
      expect((s.level, s.tip), (level, tip), reason: '"$password"');
    }
  });

  testWidgets('meter shows the word and tip, and reads them to screen readers', (tester) async {
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: RwPasswordField(label: 'New password', controller: controller, showStrength: true),
          ),
        ),
      ),
    );
    expect(find.text('Use 8+ characters with uppercase, lowercase, a number and a symbol.'), findsOneWidget);

    for (final (typed, word) in [
      ('Abc12!', 'Weak'),
      ('Sunflower', 'Fair'),
      ('Sunflower7', 'Good'),
      ('Sunflower7!', 'Strong'),
    ]) {
      await tester.enterText(find.byType(TextField), typed);
      await tester.pumpAndSettle();
      expect(find.text(word), findsOneWidget, reason: typed);
    }
    expect(find.bySemanticsLabel('Password strength: Strong. Strong password.'), findsOneWidget);
  });
}
