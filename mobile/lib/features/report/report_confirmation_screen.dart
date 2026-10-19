import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants.dart';
import '../../core/format.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// Arguments for /report/confirmation.
class ReportConfirmationArgs {
  const ReportConfirmationArgs({
    required this.reportId,
    this.photoUploadFailed = false,
    this.failedPhotoCount = 0,
  });

  /// The new report_id from POST /reports.
  final int reportId;

  /// True when the report was saved but POST /reports/:id/photos failed (M5 failure state).
  final bool photoUploadFailed;

  /// How many photos did not upload (for the banner title); 0 when unknown.
  final int failedPhotoCount;
}

/// Report sent. Figma (Mobile page 90:4): M5/Confirmation/Default 115:1305, Photo upload failed 115:1364.
///
/// Shows the Report ID (RW-000128), the Submitted status and the Public submission badge.
/// The form is already cleared (ReportDraft.reset) by the photos step. Back returns to the tabs.
class ReportConfirmationScreen extends StatelessWidget {
  const ReportConfirmationScreen({super.key, required this.args});

  final ReportConfirmationArgs args;

  void _home(BuildContext context) => Navigator.of(context).popUntil((r) => r.isFirst);

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final fullName = context.select<AuthProvider?, String?>((a) => a?.user?.fullName) ?? '';
    final first = fullName.trim().split(RegExp(r'\s+')).first;
    final code = reportCode(args.reportId);
    final failed = args.failedPhotoCount;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _home(context);
      },
      child: Scaffold(
        backgroundColor: c.surfaceWhite,
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s16, RwSpace.s16, RwSpace.s32),
                  children: [
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(color: c.surfaceSuccessSubtle, shape: BoxShape.circle),
                        alignment: Alignment.center,
                        child: RwIcon(RwIcons.checkCircle, size: 40, color: c.textSuccess),
                      ),
                    ),
                    const SizedBox(height: RwSpace.s16),
                    Semantics(
                      header: true,
                      liveRegion: true,
                      child: Text(
                        'Report sent',
                        textAlign: TextAlign.center,
                        style: RwType.h1.copyWith(color: c.textPrimary),
                      ),
                    ),
                    const SizedBox(height: RwSpace.s8),
                    Text(
                      first.isEmpty
                          ? 'Thank you. An administrator will review it soon.'
                          : 'Thank you, $first. An administrator will review it soon.',
                      textAlign: TextAlign.center,
                      style: RwType.body.copyWith(color: c.textMuted),
                    ),
                    if (args.photoUploadFailed) ...[
                      const SizedBox(height: RwSpace.s16),
                      RwToast(
                        type: RwToastType.warning,
                        title: failed == 1
                            ? "1 photo didn't upload"
                            : (failed > 1 ? "$failed photos didn't upload" : "Photos didn't upload"),
                        message: failed == 1
                            ? 'Your report is saved. Add the photo again from the tracking screen.'
                            : 'Your report is saved. Add the photos again from the tracking screen.',
                      ),
                    ],
                    const SizedBox(height: RwSpace.s16),
                    Container(
                      // 16 px sides (Figma 24) so the status chip and record badge share one row.
                      padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: RwSpace.s24),
                      decoration: BoxDecoration(
                        color: c.surfaceWhite,
                        borderRadius: RwRadius.mdAll,
                        border: Border.all(color: c.borderSubtle),
                        boxShadow: RwShadow.sm,
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Your Report ID'.toUpperCase(),
                            semanticsLabel: 'Your Report ID',
                            style: RwType.overline.copyWith(color: c.textBlue),
                          ),
                          const SizedBox(height: RwSpace.s8),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              code,
                              semanticsLabel: 'Report ID $code',
                              style: RwType.display.copyWith(color: c.textPrimary),
                            ),
                          ),
                          const SizedBox(height: RwSpace.s8),
                          const Wrap(
                            alignment: WrapAlignment.center,
                            spacing: RwSpace.s8,
                            runSpacing: RwSpace.s8,
                            children: [RwStatusChip(Statuses.submitted), RwRecordBadge(verified: false)],
                          ),
                        ],
                      ),
                    ),
                    if (!args.photoUploadFailed) ...[
                      const SizedBox(height: RwSpace.s16),
                      Semantics(
                        header: true,
                        child: Text('What happens next', style: RwType.h3.copyWith(color: c.textPrimary)),
                      ),
                      const SizedBox(height: RwSpace.s12),
                      const _NextStep(1, 'An administrator reviews and verifies your report.'),
                      const SizedBox(height: RwSpace.s12),
                      const _NextStep(2, 'Once verified, a traffic officer is assigned to follow it up.'),
                      const SizedBox(height: RwSpace.s12),
                      const _NextStep(3, 'You get a notification and an email at every status change.'),
                    ],
                  ],
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: c.surfaceWhite,
                  border: Border(top: BorderSide(color: c.borderSubtle)),
                ),
                padding: const EdgeInsets.all(RwSpace.s16),
                child: Column(
                  children: [
                    RwButton(
                      label: 'Track this report',
                      semanticLabel: 'Track report $code',
                      onPressed: () => Navigator.of(
                        context,
                      ).pushNamedAndRemoveUntil(Routes.tracking, (r) => r.isFirst, arguments: args.reportId),
                    ),
                    const SizedBox(height: RwSpace.s12),
                    RwButton.secondary(label: 'Back to home', onPressed: () => _home(context)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Numbered navy circle + body text.
class _NextStep extends StatelessWidget {
  const _NextStep(this.number, this.text);

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return MergeSemantics(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
            decoration: BoxDecoration(color: c.brandNavy, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(
              '$number',
              semanticsLabel: 'Step $number.',
              style: RwType.label.copyWith(color: c.textInverse),
            ),
          ),
          const SizedBox(width: RwSpace.s12),
          Expanded(
            child: Text(text, style: RwType.body.copyWith(color: c.textPrimary)),
          ),
        ],
      ),
    );
  }
}
