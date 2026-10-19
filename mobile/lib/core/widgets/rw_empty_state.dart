import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_button.dart';
import 'rw_icon.dart';

/// Figma "Empty / error state" (101:760): 80 px icon circle, H3 title, body text, optional button.
/// Named constructors carry the Figma copy.
class RwEmptyState extends StatelessWidget {
  const RwEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.actionIcon,
    this.onAction,
    this.secondaryAction = false,
    this.isError = false,
  });

  /// "No reports yet" (M6/My reports/Empty).
  const RwEmptyState.noReports({super.key, this.onAction})
    : icon = RwIcons.inbox,
      title = 'No reports yet',
      message = 'When you report an accident it appears here, so you can follow its status.',
      actionLabel = 'Report an accident',
      actionIcon = null,
      secondaryAction = false,
      isError = false;

  /// "No reports match these filters".
  const RwEmptyState.noResults({super.key, this.onAction})
    : icon = RwIcons.search,
      title = 'No reports match these filters',
      message = 'Try a wider date range or clear the status filter.',
      actionLabel = 'Clear filters',
      actionIcon = null,
      secondaryAction = true,
      isError = false;

  /// Load error with "Try again" (M6/My reports/Error). [message] can carry the API message.
  const RwEmptyState.error({
    super.key,
    this.onAction,
    this.title = "Couldn't load your reports",
    this.message = 'Check your connection, then try again. Nothing you entered was lost.',
  }) : icon = RwIcons.wifiOff,
       actionLabel = 'Try again',
       actionIcon = RwIcons.refresh,
       secondaryAction = true,
       isError = true;

  /// Demo video not published yet (demoVideoUrl = null).
  const RwEmptyState.videoComingSoon({super.key})
    : icon = RwIcons.playCircle,
      title = 'Video coming soon',
      message = 'The team will publish the RoadWatch demo video here before November 2.',
      actionLabel = null,
      actionIcon = null,
      onAction = null,
      secondaryAction = false,
      isError = false;

  final String icon;
  final String title;
  final String message;
  final String? actionLabel;
  final String? actionIcon;
  final VoidCallback? onAction;

  /// Outline button instead of the primary navy one.
  final bool secondaryAction;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Padding(
      padding: const EdgeInsets.all(RwSpace.s32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: isError ? c.surfaceDangerSubtle : c.surfaceNavySubtle,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: RwIcon(icon, size: 40, color: isError ? c.textDanger : c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s16),
          Semantics(
            header: true,
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: RwType.h3.copyWith(color: c.textPrimary),
            ),
          ),
          const SizedBox(height: RwSpace.s16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: RwType.body.copyWith(color: c.textMuted),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: RwSpace.s16),
            RwButton(
              label: actionLabel!,
              icon: actionIcon,
              onPressed: onAction,
              expand: false,
              variant: secondaryAction ? RwButtonVariant.secondary : RwButtonVariant.primary,
            ),
          ],
        ],
      ),
    );
  }
}
