import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Emergency hotlines. Figma (Mobile page 90:4): Settings/Emergency hotlines 252:2763.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class HotlinesScreen extends StatelessWidget {
  const HotlinesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Emergency hotlines'),
      body: const TodoPlaceholder(
        screen: 'Emergency hotlines',
        figmaFrames: 'Settings/Emergency hotlines 252:2763',
        notes: 'Hotlines constants (911, PNP, BFP) as tel: links via url_launcher; seals RwImages.pnpSeal / bfpSeal with alt text; accessible names like \'Call PNP, 117\'.',
      ),
    );
  }
}
