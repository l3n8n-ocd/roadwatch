import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Figma "Stepper" (106:1001): report form progress. Step 1 Details (M2), 2 Location (M3),
/// 3 Photos (M4).
class RwStepper extends StatelessWidget {
  const RwStepper({super.key, required this.step, this.labels = const ['Details', 'Location', 'Photos']});

  /// 1-based current step.
  final int step;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final total = labels.length;
    final label = labels[(step - 1).clamp(0, total - 1)];
    return Semantics(
      label: 'Step $step of $total, $label',
      excludeSemantics: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Step $step of $total · $label'.toUpperCase(),
            style: RwType.overline.copyWith(color: c.textBlue),
          ),
          const SizedBox(height: RwSpace.s8),
          Row(
            children: [
              for (var i = 1; i <= total; i++) ...[
                if (i > 1) const SizedBox(width: RwSpace.s4),
                Expanded(
                  child: Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: i <= step ? c.brandNavy : c.surfaceNavySubtle,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
