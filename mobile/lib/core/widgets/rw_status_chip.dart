import 'package:flutter/material.dart';

import '../constants.dart';
import '../theme/tokens.dart';
import 'rw_icon.dart';

/// Icon used for each status (Figma Status chip variants). Also used by timeline nodes and
/// notification rows.
String statusIconName(String status) {
  switch (status) {
    case Statuses.underReview:
      return RwIcons.search;
    case Statuses.additionalInfo:
      return RwIcons.alertTriangle;
    case Statuses.verified:
      return RwIcons.shieldCheck;
    case Statuses.assigned:
      return RwIcons.userCheck;
    case Statuses.inProgress:
      return RwIcons.clock;
    case Statuses.resolved:
      return RwIcons.checkCircle;
    case Statuses.rejected:
      return RwIcons.xCircle;
    default:
      return RwIcons.send;
  }
}

/// Icon color per status (Figma: text/primary, text/blue, text/success or text/danger).
Color statusIconColor(RwColors c, String status) {
  switch (status) {
    case Statuses.underReview:
    case Statuses.assigned:
      return c.textBlue;
    case Statuses.verified:
      return c.textSuccess;
    case Statuses.rejected:
      return c.textDanger;
    default:
      return c.textPrimary;
  }
}

/// Figma "Status chip" (99:257): one style per report_status, always with the status text.
/// Screen readers hear `Status: <value>`.
class RwStatusChip extends StatelessWidget {
  const RwStatusChip(this.status, {super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    Color bg;
    Color? border;
    switch (status) {
      case Statuses.underReview:
        bg = c.surfaceBlueSubtle;
      case Statuses.additionalInfo:
        bg = c.brandAmber;
      case Statuses.verified:
        bg = c.surfaceSuccessSubtle;
      case Statuses.assigned:
        bg = c.surfaceWhite;
        border = c.brandBlue;
      case Statuses.inProgress:
        bg = c.surfaceAmberSubtle;
        border = c.brandAmber;
      case Statuses.resolved:
        bg = c.brandSuccess;
      case Statuses.rejected:
        bg = c.surfaceDangerSubtle;
      default:
        bg = c.surfaceNavySubtle;
    }
    return Semantics(
      label: 'Status: $status',
      excludeSemantics: true,
      child: Container(
        constraints: const BoxConstraints(minHeight: 32),
        padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: RwRadius.fullAll,
          border: border == null ? null : Border.all(color: border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            RwIcon(statusIconName(status), size: RwSize.iconSm, color: statusIconColor(c, status)),
            const SizedBox(width: RwSpace.s8),
            Flexible(
              child: Text(status, style: RwType.label.copyWith(color: c.textPrimary)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Figma "Record badge" (99:272): navy "Verified record" vs dashed "Public submission".
/// Course rule: public submissions must be clearly distinct from verified records.
class RwRecordBadge extends StatelessWidget {
  const RwRecordBadge({super.key, required this.verified});

  /// Builds from the API `record_type` value.
  const RwRecordBadge.fromRecordType(String? recordType, {super.key})
    : verified = recordType == RecordTypes.verifiedRecord;

  final bool verified;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final label = verified ? 'Verified record' : 'Public submission';
    final content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12, vertical: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          RwIcon(
            verified ? RwIcons.shieldCheck : RwIcons.users,
            size: RwSize.iconSm,
            color: verified ? c.textAccent : c.textPrimary,
          ),
          const SizedBox(width: RwSpace.s8),
          Text(label, style: RwType.label.copyWith(color: verified ? c.textInverse : c.textPrimary)),
        ],
      ),
    );
    return Semantics(
      label: label,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 32),
        child: verified
            ? DecoratedBox(
                decoration: BoxDecoration(color: c.brandNavy, borderRadius: RwRadius.smAll),
                child: content,
              )
            : CustomPaint(
                painter: _DashedBorderPainter(color: c.textPrimary, fill: c.surfaceWhite),
                child: content,
              ),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  _DashedBorderPainter({required this.color, required this.fill});

  final Color color;
  final Color fill;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect.deflate(0.75), const Radius.circular(RwRadius.sm));
    canvas.drawRRect(rrect, Paint()..color = fill);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var d = 0.0;
      while (d < metric.length) {
        canvas.drawPath(metric.extractPath(d, d + 4), paint);
        d += 7;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorderPainter old) => old.color != color || old.fill != fill;
}
