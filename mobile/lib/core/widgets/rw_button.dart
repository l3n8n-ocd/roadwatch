import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

enum RwButtonVariant { primary, secondary, destructive }

/// Figma "Button" (96:193), mobile size: 48 px tall, 16 px radius, Label/Button text,
/// optional 20 px leading icon. Disabled keeps the label readable (text/muted on navy-subtle).
class RwButton extends StatelessWidget {
  const RwButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = RwButtonVariant.primary,
    this.icon,
    this.expand = true,
    this.loading = false,
    this.semanticLabel,
  });

  const RwButton.secondary({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.expand = true,
    this.loading = false,
    this.semanticLabel,
  }) : variant = RwButtonVariant.secondary;

  const RwButton.destructive({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.expand = true,
    this.loading = false,
    this.semanticLabel,
  }) : variant = RwButtonVariant.destructive;

  /// Describes the action ("Submit report", not "OK").
  final String label;

  /// Null disables the button.
  final VoidCallback? onPressed;
  final RwButtonVariant variant;

  /// Leading icon name from [RwIcons].
  final String? icon;

  /// Full width (default) or hug the label.
  final bool expand;

  /// Shows a spinner and blocks taps (e.g. while submitting).
  final bool loading;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final enabled = onPressed != null && !loading;

    return RwPressable(
      onTap: enabled ? onPressed : null,
      semanticLabel: semanticLabel,
      semanticHint: loading ? 'Working' : null,
      builder: (context, s) {
        late Color bg;
        late Color fg;
        Color? borderColor;
        final disabled = !enabled;
        switch (variant) {
          case RwButtonVariant.primary:
            bg = disabled ? c.surfaceNavySubtle : (s.active ? c.surfaceNavyHover : c.brandNavy);
            fg = disabled ? c.textMuted : c.textInverse;
          case RwButtonVariant.secondary:
            bg = disabled || s.active ? c.surfaceNavySubtle : c.surfaceWhite;
            fg = disabled ? c.textMuted : c.textPrimary;
            borderColor = disabled ? c.borderSubtle : c.brandNavy;
          case RwButtonVariant.destructive:
            bg = disabled ? c.surfaceNavySubtle : (s.active ? c.surfaceDangerSubtle : c.surfaceWhite);
            fg = disabled ? c.textMuted : c.textDanger;
            borderColor = disabled ? c.borderSubtle : c.brandDanger;
        }
        // While loading keep the variant colors so the button does not flash grey.
        if (loading) {
          switch (variant) {
            case RwButtonVariant.primary:
              bg = c.surfaceNavyHover;
              fg = c.textInverse;
            case RwButtonVariant.secondary:
              bg = c.surfaceNavySubtle;
              fg = c.textPrimary;
              borderColor = c.brandNavy;
            case RwButtonVariant.destructive:
              bg = c.surfaceDangerSubtle;
              fg = c.textDanger;
              borderColor = c.brandDanger;
          }
        }

        final leading = loading
            ? SizedBox(
                width: RwSize.iconMd,
                height: RwSize.iconMd,
                child: CircularProgressIndicator(strokeWidth: 2, color: fg),
              )
            : (icon == null ? null : RwIcon(icon!, size: RwSize.iconMd, color: fg));

        return Container(
          constraints: const BoxConstraints(minHeight: RwSize.touch),
          width: expand ? double.infinity : null,
          padding: const EdgeInsets.symmetric(horizontal: RwSpace.s24, vertical: 12),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: RwRadius.mdAll,
            border: borderColor == null ? null : Border.all(color: borderColor, width: 2),
          ),
          child: Row(
            mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (leading != null) ...[leading, const SizedBox(width: RwSpace.s8)],
              Flexible(
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: RwType.button.copyWith(color: fg),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
