import 'package:flutter/material.dart';

import '../core/theme/tokens.dart';
import '../core/widgets/widgets.dart';

/// Temporary body for screens that are not built yet. Shows which Figma frames to build from
/// and, for development, buttons to the routes this screen leads to.
///
/// TODO: delete this file once every screen under lib/features is implemented.
class TodoPlaceholder extends StatelessWidget {
  const TodoPlaceholder({
    super.key,
    required this.screen,
    required this.figmaFrames,
    this.notes,
    this.links = const {},
  });

  final String screen;

  /// Node IDs from docs/ui-design/figma-index.md, e.g. "M1/Home/Default 112:263".
  final String figmaFrames;
  final String? notes;

  /// Button label -> route name.
  final Map<String, String> links;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return ListView(
      padding: const EdgeInsets.all(RwSpace.s16),
      children: [
        RwToast(
          type: RwToastType.info,
          title: '$screen: not built yet',
          message: 'Figma: $figmaFrames${notes == null ? '' : '\n$notes'}',
        ),
        for (final entry in links.entries) ...[
          const SizedBox(height: RwSpace.s12),
          RwButton.secondary(label: entry.key, onPressed: () => Navigator.of(context).pushNamed(entry.value)),
        ],
        const SizedBox(height: RwSpace.s16),
        Text(
          'Placeholder screen (lib/features). See mobile/CLAUDE.md.',
          style: RwType.caption.copyWith(color: c.textMuted),
        ),
      ],
    );
  }
}
