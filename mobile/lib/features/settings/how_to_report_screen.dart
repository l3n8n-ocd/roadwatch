import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// How to report. Figma (Mobile page 90:4): Settings/How to report 164:2576.
///
/// Amber safety banner and four numbered tips (static content).
class HowToReportScreen extends StatelessWidget {
  const HowToReportScreen({super.key});

  static const _tips = [
    (
      'Say what happened',
      'Pick the accident type, date and time, injuries, and describe it in a few sentences: '
          'vehicles, direction, road condition.',
    ),
    (
      'Mark the place',
      'Use your current location or tap the map. Always add a street, landmark or barangay in words.',
    ),
    (
      'Add photos if safe',
      'Up to 5 clear photos (JPG, PNG or WebP, 5 MB each). Plate numbers and road damage help most.',
    ),
    (
      'Follow the status',
      'Watch the timeline in My reports. If an officer asks for more information, reply as soon as you can.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'How to report'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          // Amber is a fill with navy text on it (contrast rule, root CLAUDE.md section 10).
          Container(
            padding: const EdgeInsets.all(RwSpace.s16),
            decoration: BoxDecoration(color: c.brandAmber, borderRadius: RwRadius.mdAll),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RwIcon(RwIcons.alertTriangle, size: RwSize.iconLg, color: c.textPrimary),
                const SizedBox(width: RwSpace.s12),
                Expanded(
                  child: Text(
                    'Safety first: if anyone is hurt, call ${Hotlines.emergency.number} before reporting. '
                    'Never stop in live traffic.',
                    style: RwType.label.copyWith(color: c.textPrimary),
                  ),
                ),
              ],
            ),
          ),
          for (var i = 0; i < _tips.length; i++) ...[
            const SizedBox(height: RwSpace.s16),
            _Tip(number: i + 1, title: _tips[i].$1, body: _tips[i].$2),
          ],
        ],
      ),
    );
  }
}

class _Tip extends StatelessWidget {
  const _Tip({required this.number, required this.title, required this.body});

  final int number;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return MergeSemantics(
      child: Container(
        padding: const EdgeInsets.all(RwSpace.s16),
        decoration: BoxDecoration(
          color: c.surfaceWhite,
          borderRadius: RwRadius.mdAll,
          border: Border.all(color: c.borderSubtle),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: c.brandNavy, shape: BoxShape.circle),
              child: Text(
                '$number',
                semanticsLabel: 'Step $number:',
                style: RwType.label.copyWith(color: c.textInverse),
              ),
            ),
            const SizedBox(width: RwSpace.s16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: RwType.h3.copyWith(color: c.textPrimary)),
                  const SizedBox(height: RwSpace.s4),
                  Text(body, style: RwType.bodySm.copyWith(color: c.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
