import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Privacy. Figma (Mobile page 90:4): Settings/Privacy 177:2752.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Privacy'),
      body: const TodoPlaceholder(screen: 'Privacy', figmaFrames: 'Settings/Privacy 177:2752'),
    );
  }
}
