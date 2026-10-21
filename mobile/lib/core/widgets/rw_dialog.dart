import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_button.dart';

/// Figma "Dialog" (106:880): H2 title, muted body, optional extra content (e.g. a Textarea),
/// Cancel (secondary) and a confirm button (primary, or destructive outline).
class RwDialog extends StatelessWidget {
  const RwDialog({
    super.key,
    required this.title,
    required this.message,
    required this.confirmLabel,
    this.cancelLabel = 'Cancel',
    this.destructive = false,
    this.confirmIcon,
    this.content,
    this.onConfirm,
  });

  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool destructive;

  /// Optional icon on the confirm button (Log out uses RwIcons.logOut, #40).
  final String? confirmIcon;
  final Widget? content;

  /// Defaults to closing the dialog with `true`.
  final VoidCallback? onConfirm;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final cancel = RwButton.secondary(label: cancelLabel, onPressed: () => Navigator.of(context).pop(false));
    final confirm = RwButton(
      label: confirmLabel,
      variant: destructive ? RwButtonVariant.destructive : RwButtonVariant.primary,
      icon: confirmIcon,
      onPressed: onConfirm ?? () => Navigator.of(context).pop(true),
    );
    // The panel grows from 96% as it fades in (#41, M8); the route already fades.
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: MediaQuery.disableAnimationsOf(context) ? 1 : 0.96, end: 1),
      duration: const Duration(milliseconds: 200),
      curve: const Cubic(0.22, 1, 0.36, 1),
      builder: (context, scale, child) => Transform.scale(scale: scale, child: child),
      child: Dialog(
        backgroundColor: c.surfaceWhite,
        surfaceTintColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(RwSpace.s16),
        shape: const RoundedRectangleBorder(borderRadius: RwRadius.mdAll),
        child: Padding(
          padding: const EdgeInsets.all(RwSpace.s24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  header: true,
                  child: Text(title, style: RwType.h2.copyWith(color: c.textPrimary)),
                ),
                const SizedBox(height: RwSpace.s8),
                Text(message, style: RwType.body.copyWith(color: c.textMuted)),
                if (content != null) ...[const SizedBox(height: RwSpace.s24), content!],
                const SizedBox(height: RwSpace.s24),
                // Phone width: stack full-width buttons, confirm first; side by side when wide.
                LayoutBuilder(
                  builder: (context, box) => box.maxWidth < 400
                      ? Column(
                          children: [
                            confirm,
                            const SizedBox(height: RwSpace.s12),
                            cancel,
                          ],
                        )
                      : Row(
                          children: [
                            Expanded(child: cancel),
                            const SizedBox(width: RwSpace.s12),
                            Expanded(child: confirm),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Shows a [RwDialog] and resolves to true when confirmed.
Future<bool> showRwConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
  bool destructive = false,
  String? confirmIcon,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (_) => RwDialog(
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      destructive: destructive,
      confirmIcon: confirmIcon,
    ),
  );
  return result ?? false;
}
