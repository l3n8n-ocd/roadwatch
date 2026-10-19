import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Language. Figma (Mobile page 90:4): Settings/Language 162:2516.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class LanguageScreen extends StatelessWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Language'),
      body: const TodoPlaceholder(
        screen: 'Language',
        figmaFrames: 'Settings/Language 162:2516',
        notes: 'SettingsProvider.setLanguage(English / Filipino). Translations are not built yet.',
      ),
    );
  }
}
