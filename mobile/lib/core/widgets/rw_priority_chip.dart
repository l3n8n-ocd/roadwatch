import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';

/// Figma "Priority chip" (527:4117, #54): Low, Medium, High or Urgent, always icon + text, never color alone.
/// Screen readers hear `Priority: <level>`. Staff only: reporters never see priority.
class RwPriorityChip extends StatelessWidget {
  const RwPriorityChip(this.priority, {super.key});

  final String priority;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final (String icon, Color bg, Color iconColor) = switch (priority) {
      'Low' => (RwIcons.arrowDown, c.surfaceLightGray, c.textMuted),
      'High' => (RwIcons.arrowUp, c.surfaceAmberSubtle, c.textPrimary),
      'Urgent' => (RwIcons.alertTriangle, c.surfaceDangerSubtle, c.textDanger),
      _ => (RwIcons.equal, c.surfaceBlueSubtle, c.textBlue),
    };
    return Semantics(
      label: 'Priority: $priority',
      excludeSemantics: true,
      child: Container(
        constraints: const BoxConstraints(minHeight: 32),
        padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12, vertical: 6),
        decoration: BoxDecoration(color: bg, borderRadius: RwRadius.fullAll),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            RwIcon(icon, size: RwSize.iconSm, color: iconColor),
            const SizedBox(width: RwSpace.s8),
            Flexible(
              child: Text(priority, style: RwType.label.copyWith(color: c.textPrimary)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Lowest to highest, like the API (`PRIORITIES`). Used to sort Urgent first.
const priorityLevels = ['Low', 'Medium', 'High', 'Urgent'];

int priorityRank(String? p) => priorityLevels.indexOf(p ?? 'Medium');
