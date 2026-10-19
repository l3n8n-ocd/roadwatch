import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Arguments for /report/confirmation.
class ReportConfirmationArgs {
  const ReportConfirmationArgs({required this.reportId, this.photoUploadFailed = false});

  /// The new report_id from POST /reports.
  final int reportId;

  /// True when the report was saved but POST /reports/:id/photos failed (M5 failure state).
  final bool photoUploadFailed;
}

/// Report sent. Figma (Mobile page 90:4): M5/Confirmation/Default 115:1305, Photo upload failed 115:1364.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class ReportConfirmationScreen extends StatelessWidget {
  const ReportConfirmationScreen({super.key, required this.args});

  final ReportConfirmationArgs args;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Report sent'),
      body: TodoPlaceholder(
        screen: 'Report sent (${reportCode(args.reportId)})',
        figmaFrames: 'M5/Confirmation/Default 115:1305, Photo upload failed 115:1364',
        notes: 'Show reportCode(args.reportId). If args.photoUploadFailed show the retry state. Call ReportDraft.reset().',
      ),
    );
  }
}
