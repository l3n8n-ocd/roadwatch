import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Appearance. Figma (Mobile page 90:4): Settings/Appearance 162:2465.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class AppearanceScreen extends StatelessWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Appearance'),
      body: const TodoPlaceholder(
        screen: 'Appearance',
        figmaFrames: 'Settings/Appearance 162:2465',
        notes: 'SettingsProvider.setThemeMode(System default / Light / Dark).',
      ),
    );
  }
}
