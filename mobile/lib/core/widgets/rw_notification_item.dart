import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

/// Figma "Notification item" (106:902). Unread: blue-subtle row, semibold message, navy dot.
/// Read: white row, regular message. Unread is announced in words, not only by color.
class RwNotificationItem extends StatelessWidget {
  const RwNotificationItem({
    super.key,
    required this.message,
    required this.timeLabel,
    required this.isRead,
    this.icon = RwIcons.bell,
    this.iconColor,
    this.onTap,
  });

  final String message;

  /// "5 min ago" or "Oct 15, 2026 · 16:20".
  final String timeLabel;
  final bool isRead;

  /// Usually statusIconName(status) when the message is about a status change.
  final String icon;
  final Color? iconColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      isButton: onTap != null,
      semanticLabel: '${isRead ? '' : 'Unread. '}$message. $timeLabel',
      excludeChildSemantics: true,
      borderRadius: BorderRadius.zero,
      builder: (context, s) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(RwSpace.s16),
        decoration: BoxDecoration(
          color: s.pressed ? c.surfaceNavySubtle : (isRead ? c.surfaceWhite : c.surfaceBlueSubtle),
          border: Border(bottom: BorderSide(color: c.borderSubtle)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: c.surfaceWhite,
                shape: BoxShape.circle,
                border: Border.all(color: c.borderSubtle),
              ),
              alignment: Alignment.center,
              child: RwIcon(icon, size: RwSize.iconMd, color: iconColor ?? c.textBlue),
            ),
            const SizedBox(width: RwSpace.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(message, style: (isRead ? RwType.body : RwType.button).copyWith(color: c.textPrimary)),
                  const SizedBox(height: RwSpace.s4),
                  Text(timeLabel, style: RwType.caption.copyWith(color: c.textMuted)),
                ],
              ),
            ),
            if (!isRead) ...[
              const SizedBox(width: RwSpace.s12),
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(color: c.brandNavy, shape: BoxShape.circle),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
