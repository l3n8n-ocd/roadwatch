import 'package:flutter/material.dart';

import '../password_strength.dart';
import '../theme/tokens.dart';

/// Figma "Password strength" (Components 422:4211, #44): 4 segments, the level word and one tip, under
/// every field that sets a new password. Saving needs Strong. The segments are decorative; the level
/// word is always shown, so the level never depends on color alone. Screen readers hear
/// "Password strength: Weak. Use at least 8 characters (6 so far)."
class RwPasswordStrength extends StatelessWidget {
  const RwPasswordStrength({super.key, required this.password, this.name, this.email});

  final String password;

  /// The account's name and email, when known: a password that contains them is Weak.
  final String? name;
  final String? email;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final s = checkPassword(password, name: name, email: email);
    final (int segments, Color bar, Color word) = switch (s.level) {
      PasswordLevel.empty => (0, c.borderSubtle, c.textMuted),
      PasswordLevel.weak => (1, c.brandDanger, c.textDanger),
      PasswordLevel.fair => (2, c.brandAmber, c.textPrimary),
      PasswordLevel.good => (3, c.brandBlue, c.textBlue),
      PasswordLevel.strong => (4, c.brandSuccess, c.textSuccess),
    };
    final duration = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 200);
    final spoken = s.word.isEmpty ? 'Password strength: ${s.tip}' : 'Password strength: ${s.word}. ${s.tip}';

    return Semantics(
      container: true,
      liveRegion: true,
      label: spoken,
      excludeSemantics: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              for (var i = 0; i < 4; i++) ...[
                if (i > 0) const SizedBox(width: RwSpace.s4),
                Expanded(
                  child: AnimatedContainer(
                    duration: duration,
                    height: 4,
                    decoration: BoxDecoration(
                      color: i < segments ? bar : c.borderSubtle,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (s.word.isNotEmpty) ...[
                Text(s.word, style: RwType.label.copyWith(color: word)),
                const SizedBox(width: 6),
              ],
              Expanded(
                child: Text(s.tip, style: RwType.bodySm.copyWith(color: c.textMuted)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
