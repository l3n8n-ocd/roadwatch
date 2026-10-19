import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Change password. Figma (Mobile page 90:4): Settings/Change password (validation) 162:2396.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class ChangePasswordScreen extends StatelessWidget {
  const ChangePasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Change password'),
      body: const TodoPlaceholder(
        screen: 'Change password',
        figmaFrames: 'Settings/Change password (validation) 162:2396',
        notes: 'RoadWatchApi.changePassword (not built on the API yet). New password 8+ characters.',
      ),
    );
  }
}
