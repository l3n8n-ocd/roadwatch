import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

enum RwToastType { success, error, info, warning }

/// Figma "Toast" (101:708): white card, 4 px colored accent, type icon, title, message, close.
/// Also used inline as an alert banner (login errors, frames 109:79 / 109:164).
class RwToast extends StatelessWidget {
  const RwToast({super.key, required this.type, required this.title, this.message, this.onClose});

  final RwToastType type;
  final String title;
  final String? message;

  /// Shows the close (x) button when set.
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final (Color accent, String icon, Color iconColor, String prefix) = switch (type) {
      RwToastType.success => (c.brandSuccess, RwIcons.checkCircle, c.textSuccess, 'Success'),
      RwToastType.error => (c.brandDanger, RwIcons.xCircle, c.textDanger, 'Error'),
      RwToastType.info => (c.brandBlue, RwIcons.info, c.textBlue, 'Info'),
      RwToastType.warning => (c.brandAmber, RwIcons.alertTriangle, c.textPrimary, 'Warning'),
    };

    return Semantics(
      liveRegion: true,
      container: true,
      child: Container(
        decoration: BoxDecoration(
          color: c.surfaceWhite,
          borderRadius: RwRadius.mdAll,
          border: Border.all(color: c.borderSubtle),
          boxShadow: RwShadow.lg,
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: accent),
              const SizedBox(width: RwSpace.s12),
              Padding(
                padding: const EdgeInsets.only(top: RwSpace.s16),
                child: Align(
                  alignment: Alignment.topCenter,
                  child: RwIcon(icon, size: RwSize.iconLg, color: iconColor),
                ),
              ),
              const SizedBox(width: RwSpace.s12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: RwSpace.s16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        semanticsLabel: '$prefix: $title',
                        style: RwType.label.copyWith(color: c.textPrimary),
                      ),
                      if (message != null && message!.isNotEmpty) ...[
                        const SizedBox(height: RwSpace.s4),
                        Text(message!, style: RwType.bodySm.copyWith(color: c.textPrimary)),
                      ],
                    ],
                  ),
                ),
              ),
              if (onClose != null)
                Align(
                  alignment: Alignment.topCenter,
                  child: RwPressable(
                    onTap: onClose,
                    semanticLabel: 'Dismiss',
                    excludeChildSemantics: true,
                    borderRadius: RwRadius.fullAll,
                    builder: (context, s) => SizedBox(
                      width: RwSize.touch,
                      height: RwSize.touch,
                      child: Center(
                        child: RwIcon(RwIcons.x, size: RwSize.iconMd, color: c.textPrimary),
                      ),
                    ),
                  ),
                )
              else
                const SizedBox(width: 4),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shows a [RwToast] as a floating snackbar. Errors stay longer so they can be read.
void showRwToast(BuildContext context, {required RwToastType type, required String title, String? message}) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      padding: EdgeInsets.zero,
      behavior: SnackBarBehavior.floating,
      duration: Duration(seconds: type == RwToastType.error ? 8 : 5),
      content: RwToast(type: type, title: title, message: message, onClose: messenger.hideCurrentSnackBar),
    ),
  );
}
