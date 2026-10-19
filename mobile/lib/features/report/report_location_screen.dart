import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import '../todo_placeholder.dart';

/// Location. Figma (Mobile page 90:4): M3/Location/Pin placed 113:804, Locating 113:913, Permission off 113:1016.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class ReportLocationScreen extends StatelessWidget {
  const ReportLocationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Location'),
      body: const TodoPlaceholder(
        screen: 'Location',
        figmaFrames: 'M3/Location/Pin placed 113:804, Locating 113:913, Permission off 113:1016',
        notes: 'Step 2 of 3. RwMap + LocationService.current(); the pin is optional.',
        links: {'Next: photos': Routes.reportPhotos},
      ),
    );
  }
}
