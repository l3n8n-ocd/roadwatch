import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/settings_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Appearance. Figma (Mobile page 90:4): Settings/Appearance 162:2465.
///
/// System default / Light / Dark radio group (#26), stored on this phone by SettingsProvider.
class AppearanceScreen extends StatelessWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final settings = context.watch<SettingsProvider>();
    const options = [
      (ThemeMode.system, RwIcons.sun, 'System default', "Match your phone's light or dark setting"),
      (ThemeMode.light, RwIcons.sun, 'Light', null),
      (ThemeMode.dark, RwIcons.moon, 'Dark', null),
    ];
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Appearance'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Semantics(
            header: true,
            child: Text('THEME', style: RwType.overline.copyWith(color: c.textBlue)),
          ),
          const SizedBox(height: RwSpace.s8),
          RadioGroupCard(
            children: [
              for (final (mode, icon, label, description) in options)
                RadioOptionRow(
                  icon: icon,
                  label: label,
                  description: description,
                  selected: settings.themeMode == mode,
                  onSelected: () => settings.setThemeMode(mode),
                ),
            ],
          ),
          const SizedBox(height: RwSpace.s16),
          Text(
            'Both themes meet WCAG 2.1 AA contrast. Your choice is saved on this phone only.',
            style: RwType.bodySm.copyWith(color: c.textMuted),
          ),
        ],
      ),
    );
  }
}

/// White rounded card that holds [RadioOptionRow]s (Figma "Radio group").
class RadioGroupCard extends StatelessWidget {
  const RadioGroupCard({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Divider(height: 1, thickness: 1, color: c.borderSubtle),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// One radio option (Figma "Option"): icon, label (semibold when selected), optional description
/// and a 24 px radio. Announced as a checked/unchecked item of a mutually exclusive group.
class RadioOptionRow extends StatelessWidget {
  const RadioOptionRow({
    super.key,
    required this.icon,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.description,
  });

  final String icon;
  final String label;
  final String? description;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return MergeSemantics(
      child: Semantics(
        checked: selected,
        inMutuallyExclusiveGroup: true,
        child: RwPressable(
          onTap: onSelected,
          isButton: false,
          semanticLabel: [label, ?description].join(', '),
          excludeChildSemantics: true,
          borderRadius: BorderRadius.zero,
          builder: (context, s) => Container(
            constraints: const BoxConstraints(minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: RwSpace.s12),
            color: s.active ? c.surfaceNavySubtle : c.surfaceWhite,
            child: Row(
              children: [
                RwIcon(icon, size: RwSize.iconLg, color: c.textPrimary),
                const SizedBox(width: RwSpace.s16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: (selected ? RwType.button : RwType.body).copyWith(color: c.textPrimary),
                      ),
                      if (description != null) ...[
                        const SizedBox(height: 2),
                        Text(description!, style: RwType.bodySm.copyWith(color: c.textMuted)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: RwSpace.s16),
                Container(
                  width: 24,
                  height: 24,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: selected ? c.textPrimary : c.borderControl, width: 2),
                  ),
                  child: selected
                      ? Container(
                          width: 12,
                          height: 12,
                          // text/primary keeps 3:1+ against the row in both themes.
                          decoration: BoxDecoration(color: c.textPrimary, shape: BoxShape.circle),
                        )
                      : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
