import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_pressable.dart';

/// Underlined text/blue link (Label/Default) with a 48 px touch target. [alignment] places the text
/// inside the target (Figma "Forgot password?" sits top-right under the password field).
class RwTextLink extends StatelessWidget {
  const RwTextLink({
    super.key,
    required this.label,
    required this.onTap,
    this.alignment = Alignment.centerLeft,
  });

  final String label;
  final VoidCallback? onTap;
  final AlignmentGeometry alignment;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final color = onTap == null ? c.textMuted : c.textBlue;
    return RwPressable(
      onTap: onTap,
      borderRadius: RwRadius.smAll,
      isButton: false,
      builder: (context, s) => Container(
        constraints: const BoxConstraints(minHeight: RwSize.touch),
        alignment: alignment,
        child: Semantics(
          link: true,
          child: Text(
            label,
            style: RwType.label.copyWith(
              color: color,
              decoration: TextDecoration.underline,
              decorationColor: color,
            ),
          ),
        ),
      ),
    );
  }
}
