import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Report details. Figma (Mobile page 90:4): M6/Tracking/Under Review 118:1606, Additional info required 118:1731.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key, required this.reportId});

  /// report_id passed as the route argument.
  final int reportId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: RwTopBar.inner(title: reportCode(reportId)),
      body: const TodoPlaceholder(
        screen: 'Report details',
        figmaFrames: 'M6/Tracking/Under Review 118:1606, Additional info required 118:1731',
        notes: 'GET /reports/:id. RwStatusChip, RwRecordBadge, RwTimelineItem list (role, never staff names), photos, RwMap read-only.',
      ),
    );
  }
}
