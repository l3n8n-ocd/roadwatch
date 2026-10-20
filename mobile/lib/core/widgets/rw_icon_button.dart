import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

enum RwIconButtonTone { light, dark }

/// Figma "Icon button" (96:261): 48 px circle, 24 px icon. Always needs [semanticLabel].
/// Dark tone sits on navy bars and uses the amber focus ring.
class RwIconButton extends StatelessWidget {
  const RwIconButton({
    super.key,
    required this.icon,
    required this.semanticLabel,
    required this.onPressed,
    this.tone = RwIconButtonTone.light,
    this.badgeCount,
    this.iconColor,
  });

  /// Icon name from [RwIcons].
  final String icon;
  final String semanticLabel;
  final VoidCallback? onPressed;
  final RwIconButtonTone tone;

  /// Amber unread badge (Top bar mobile bell). Hidden when null or 0.
  final int? badgeCount;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final dark = tone == RwIconButtonTone.dark;
    final count = badgeCount ?? 0;
    final label = count > 0 ? '$semanticLabel, $count unread' : semanticLabel;

    return RwPressable(
      onTap: onPressed,
      semanticLabel: label,
      excludeChildSemantics: true,
      onDark: dark,
      borderRadius: RwRadius.fullAll,
      builder: (context, s) {
        final bg = dark
            ? (s.active ? c.surfaceNavyHover : c.brandNavy)
            : (s.active ? c.surfaceNavySubtle : c.surfaceWhite);
        final fg = !s.enabled
            ? (dark ? c.textInverseMuted : c.textMuted)
            : (iconColor ?? (dark ? c.textInverse : c.textPrimary));
        return SizedBox(
          width: RwSize.touch,
          height: RwSize.touch,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
                  child: Center(
                    child: RwIcon(icon, size: RwSize.iconLg, color: fg),
                  ),
                ),
              ),
              if (count > 0)
                Positioned(
                  left: 26,
                  top: 4,
                  child: Container(
                    height: 20,
                    constraints: const BoxConstraints(minWidth: 20),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: c.brandAmber, borderRadius: RwRadius.fullAll),
                    child: Text(
                      count > 99 ? '99+' : '$count',
                      style: RwType.caption.copyWith(color: c.textPrimary, height: 1),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
