import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// My reports. Figma (Mobile page 90:4): M6/My reports/Default 116:1286, Empty 116:1456, Loading 116:1506, Error 116:1581.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
///
/// Tab body hosted by HomeShell (no back button).
class MyReportsTab extends StatelessWidget {
  const MyReportsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'My reports'),
      body: const TodoPlaceholder(
        screen: 'My reports',
        figmaFrames: 'M6/My reports/Default 116:1286, Empty 116:1456, Loading 116:1506, Error 116:1581',
        notes: 'RoadWatchApi.myReports(); RwReportCard.fromReport -> /tracking with the report_id.',
      ),
    );
  }
}
