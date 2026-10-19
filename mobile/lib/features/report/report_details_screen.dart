import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import '../todo_placeholder.dart';

/// Report an accident. Figma (Mobile page 90:4): M2/Accident details/Default 113:517, Validation 113:659.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class ReportDetailsScreen extends StatelessWidget {
  const ReportDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Report an accident'),
      body: const TodoPlaceholder(
        screen: 'Report an accident',
        figmaFrames: 'M2/Accident details/Default 113:517, Validation 113:659',
        notes: 'Step 1 of 3 (RwStepper). Fill ReportDraft: accident type (GET /accident-types), date, time, location text, injury, vehicles, description (10+ chars).',
        links: {'Next: location': Routes.reportLocation},
      ),
    );
  }
}
