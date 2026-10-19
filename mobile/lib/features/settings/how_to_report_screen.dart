import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// How to report. Figma (Mobile page 90:4): Settings/How to report 164:2576.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class HowToReportScreen extends StatelessWidget {
  const HowToReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'How to report'),
      body: const TodoPlaceholder(screen: 'How to report', figmaFrames: 'Settings/How to report 164:2576'),
    );
  }
}
