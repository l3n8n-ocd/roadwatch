import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Notifications. Figma (Mobile page 90:4): Notifications/Default 119:1759, Empty 119:1871.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
///
/// Tab body hosted by HomeShell (no back button).
class NotificationsTab extends StatelessWidget {
  const NotificationsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Notifications'),
      body: const TodoPlaceholder(
        screen: 'Notifications',
        figmaFrames: 'Notifications/Default 119:1759, Empty 119:1871',
        notes: 'NotificationsProvider (refresh, markRead, markAllRead); RwNotificationItem; tap opens /tracking for report_id.',
      ),
    );
  }
}
