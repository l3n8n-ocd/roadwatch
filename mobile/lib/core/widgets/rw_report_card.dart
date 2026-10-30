import 'package:flutter/material.dart';

import '../api/models.dart';
import '../format.dart';
import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';
import 'rw_priority_chip.dart';
import 'rw_status_chip.dart';

/// Figma "Report card" (99:348): report code + status chip, accident type, location, date and time.
/// Accessible name: "Report RW-000128, Collision, status Under Review".
class RwReportCard extends StatelessWidget {
  const RwReportCard({
    super.key,
    required this.reportId,
    required this.accidentType,
    required this.location,
    required this.dateTimeLabel,
    required this.status,
    this.priority,
    this.onTap,
  });

  /// Convenience constructor from an API [Report].
  RwReportCard.fromReport(Report report, {super.key, this.onTap})
    : reportId = report.reportId,
      accidentType = report.accidentTypeName ?? 'Accident',
      location = report.location,
      dateTimeLabel = formatAccidentDateTime(report.accidentDate, report.accidentTime),
      status = report.status,
      priority = report.priority;

  final int reportId;
  final String accidentType;
  final String location;

  /// For example "Oct 17, 2026 · 08:15".
  final String dateTimeLabel;
  final String status;

  /// Staff only (#54): the API never sends priority to reporters, so their cards have no chip.
  final String? priority;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final code = reportCode(reportId);
    return RwPressable(
      onTap: onTap,
      semanticLabel:
          'Report $code, $accidentType, status $status${priority == null ? '' : ', priority $priority'}, '
          '$location, $dateTimeLabel',
      excludeChildSemantics: true,
      builder: (context, s) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(RwSpace.s16),
        decoration: BoxDecoration(
          color: s.pressed ? c.surfaceNavySubtle : c.surfaceWhite,
          borderRadius: RwRadius.mdAll,
          border: Border.all(color: c.borderSubtle),
          boxShadow: RwShadow.sm,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: RwSpace.s8,
              runSpacing: RwSpace.s8,
              children: [
                Text(code, style: RwType.label.copyWith(color: c.textMuted)),
                if (priority != null) RwPriorityChip(priority!),
                RwStatusChip(status),
              ],
            ),
            const SizedBox(height: RwSpace.s12),
            Row(
              children: [
                Expanded(
                  child: Text(accidentType, style: RwType.h3.copyWith(color: c.textPrimary)),
                ),
                if (onTap != null) RwIcon(RwIcons.chevronRight, size: RwSize.iconMd, color: c.textPrimary),
              ],
            ),
            const SizedBox(height: RwSpace.s12),
            _MetaRow(icon: RwIcons.mapPin, text: location),
            const SizedBox(height: RwSpace.s12),
            _MetaRow(icon: RwIcons.calendar, text: dateTimeLabel),
          ],
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.text});
  final String icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: RwIcon(icon, size: RwSize.iconSm, color: c.textMuted),
        ),
        const SizedBox(width: RwSpace.s8),
        Expanded(
          child: Text(text, style: RwType.bodySm.copyWith(color: c.textMuted)),
        ),
      ],
    );
  }
}
