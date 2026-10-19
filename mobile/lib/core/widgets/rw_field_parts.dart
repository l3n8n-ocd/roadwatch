import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';

/// Label row shared by the form fields: Label/Default text and an optional "Required" caption.
class RwFieldLabel extends StatelessWidget {
  const RwFieldLabel({super.key, required this.label, this.required = false, this.enabled = true});

  final String label;
  final bool required;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final color = enabled ? c.textPrimary : c.textMuted;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Text(label, style: RwType.label.copyWith(color: color)),
        ),
        if (required) ...[
          const SizedBox(width: RwSpace.s8),
          Text('Required', style: RwType.caption.copyWith(color: c.textMuted)),
        ],
      ],
    );
  }
}

/// Helper row under a field: info icon + muted text, or alert icon + text/danger for errors.
class RwHelperText extends StatelessWidget {
  const RwHelperText({super.key, required this.text, this.error = false});

  final String text;
  final bool error;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final color = error ? c.textDanger : c.textMuted;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: RwIcon(error ? RwIcons.alertCircle : RwIcons.info, size: RwSize.iconSm, color: color),
        ),
        const SizedBox(width: RwSpace.s8),
        Expanded(
          child: Semantics(
            liveRegion: error,
            // Screen readers hear "Error:" so the state is not conveyed by color alone.
            child: Text(
              text,
              style: RwType.bodySm.copyWith(color: color),
              semanticsLabel: error ? 'Error: $text' : null,
            ),
          ),
        ),
      ],
    );
  }
}

/// Visual states of a field box (Figma Input layer).
enum RwFieldState { normal, focused, error, disabled }

/// Decoration of the 48 px field box for each state, matching the Figma variants:
/// default 1 px border/control; focus 2 px border/focus + Focus/ring; error 2 px border/danger;
/// disabled navy-subtle fill with 1 px border/subtle.
BoxDecoration rwFieldDecoration(RwColors c, RwFieldState state) {
  switch (state) {
    case RwFieldState.focused:
      return BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderFocus, width: 2),
        boxShadow: RwShadow.focus(c),
      );
    case RwFieldState.error:
      return BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderDanger, width: 2),
      );
    case RwFieldState.disabled:
      return BoxDecoration(
        color: c.surfaceNavySubtle,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle, width: 1),
      );
    case RwFieldState.normal:
      return BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderControl, width: 1),
      );
  }
}

/// Column layout used by every field: label row, 8 px, box, 8 px, helper or error.
class RwFieldColumn extends StatelessWidget {
  const RwFieldColumn({
    super.key,
    required this.label,
    required this.child,
    this.required = false,
    this.enabled = true,
    this.helperText,
    this.errorText,
  });

  final String label;
  final Widget child;
  final bool required;
  final bool enabled;
  final String? helperText;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final message = errorText ?? helperText;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        ExcludeSemantics(
          child: RwFieldLabel(label: label, required: required, enabled: enabled),
        ),
        const SizedBox(height: RwSpace.s8),
        child,
        if (message != null && message.isNotEmpty) ...[
          const SizedBox(height: RwSpace.s8),
          RwHelperText(text: message, error: errorText != null),
        ],
      ],
    );
  }
}
