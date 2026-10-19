import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import '../todo_placeholder.dart';

/// Settings. Figma (Mobile page 90:4): Settings/Main (Light) 161:2022, (Dark) 161:2285.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
///
/// Tab body hosted by HomeShell (no back button).
class SettingsTab extends StatelessWidget {
  const SettingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Settings'),
      body: const TodoPlaceholder(
        screen: 'Settings',
        figmaFrames: 'Settings/Main (Light) 161:2022, (Dark) 161:2285',
        notes: 'Profile header (AuthProvider.user), RwSettingsRow list (#25). Log out: showRwConfirmDialog, then AuthProvider.logout().',
        links: {
          'Edit profile': Routes.editProfile,
          'Change password': Routes.changePassword,
          'Privacy': Routes.privacy,
          'Appearance': Routes.appearance,
          'Language': Routes.language,
          'Emergency hotlines': Routes.hotlines,
          'How to report': Routes.howToReport,
          'Demo video': Routes.demoVideo,
          'About RoadWatch': Routes.about,
        },
      ),
    );
  }
}
