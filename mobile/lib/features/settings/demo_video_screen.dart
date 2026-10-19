import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Demo video. Figma (Mobile page 90:4): Settings/Demo video/Playing 119:1923, Coming soon 119:1991.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class DemoVideoScreen extends StatelessWidget {
  const DemoVideoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Demo video'),
      body: const TodoPlaceholder(
        screen: 'Demo video',
        figmaFrames: 'Settings/Demo video/Playing 119:1923, Coming soon 119:1991',
        notes: 'GET /app-info; play demoVideoUrl with video_player, or RwEmptyState.videoComingSoon() when null. Never bundle the video.',
      ),
    );
  }
}
