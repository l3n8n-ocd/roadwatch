import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// About RoadWatch. Figma (Mobile page 90:4): Settings/About 164:2646.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'About RoadWatch'),
      body: const TodoPlaceholder(
        screen: 'About RoadWatch',
        figmaFrames: 'Settings/About 164:2646',
        notes: 'Version AppConfig.appVersion; server status via RoadWatchApi.health().',
      ),
    );
  }
}
