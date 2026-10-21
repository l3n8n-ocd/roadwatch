import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_motion.dart';
import 'rw_status_chip.dart';

/// Figma "Timeline item" (99:388): one status history row. Put several in a Column, newest
/// first; mark the newest [current] and the oldest [last] (no connector line below it).
/// Show the actor's role ("Administrator"), never staff names (Figma M6 note).
class RwTimelineItem extends StatelessWidget {
  const RwTimelineItem({
    super.key,
    required this.status,
    required this.meta,
    this.remarks,
    this.current = false,
    this.last = false,
    this.icon,
  });

  /// new_status, e.g. "Under Review".
  final String status;

  /// "Oct 17, 2026 · 09:02 · Administrator".
  final String meta;

  /// official_remarks for this change, if any.
  final String? remarks;
  final bool current;
  final bool last;

  /// Defaults to the status icon.
  final String? icon;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final iconName = icon ?? statusIconName(status);
    final semantic = [
      if (current) 'Current status',
      status,
      meta,
      if (remarks != null && remarks!.isNotEmpty) remarks!,
    ].join('. ');

    return Semantics(
      label: semantic,
      excludeSemantics: true,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Column(
              children: [
                // The current status dot pulses twice, then stops (#41, M6).
                RwPulse(
                  times: current ? 2 : 0,
                  delay: const Duration(milliseconds: 300),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: current ? c.brandNavy : c.surfaceNavySubtle,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: RwIcon(
                      iconName,
                      size: RwSize.iconSm,
                      color: current ? c.textInverse : c.textPrimary,
                    ),
                  ),
                ),
                if (!last) Expanded(child: Container(width: 2, color: c.borderSubtle)),
              ],
            ),
            const SizedBox(width: RwSpace.s16),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: RwSpace.s24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (current) ...[
                      Text('CURRENT STATUS', style: RwType.overline.copyWith(color: c.textBlue)),
                      const SizedBox(height: RwSpace.s4),
                    ],
                    Text(status, style: RwType.h3.copyWith(color: c.textPrimary)),
                    const SizedBox(height: RwSpace.s4),
                    Text(meta, style: RwType.bodySm.copyWith(color: c.textMuted)),
                    if (remarks != null && remarks!.isNotEmpty) ...[
                      const SizedBox(height: RwSpace.s4),
                      Text(remarks!, style: RwType.bodySm.copyWith(color: c.textPrimary)),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
