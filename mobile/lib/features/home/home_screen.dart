import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/notifications_provider.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import '../todo_placeholder.dart';
import 'home_shell.dart';

/// Home. Figma (Mobile page 90:4): M1/Home/Default 112:263, Empty 112:415, Loading 112:495, Dark 164:2704.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
///
/// Tab body hosted by HomeShell. Uses the navy home top bar with the notifications bell.
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<NotificationsProvider>().unread;
    return Scaffold(
      appBar: RwTopBar.home(
        unreadCount: unread,
        onNotifications: () => HomeShell.selectTab(context, RwTab.notifications),
      ),
      body: const TodoPlaceholder(
        screen: 'Home',
        figmaFrames: 'M1/Home/Default 112:263, Empty 112:415, Loading 112:495, Dark 164:2704',
        notes: 'Prominent \'Report an accident\' button, recent reports, \'Emergency? Call 911 first\' shortcut to hotlines.',
        links: {'Report an accident': Routes.reportDetails, 'Emergency hotlines': Routes.hotlines},
      ),
    );
  }
}
