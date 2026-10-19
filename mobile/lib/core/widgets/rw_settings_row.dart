import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';
import 'rw_switch.dart';

enum RwSettingsRowType { navigation, toggle, info, destructive }

/// Figma "Settings row" (160:904): at least 56 px, the whole row is the target.
/// - navigation: opens a sub-screen (chevron, optional value text)
/// - toggle: device-stored preference switch ("Switch" variant)
/// - info: read-only
/// - destructive: Log out (text/danger; confirm before acting)
class RwSettingsRow extends StatelessWidget {
  const RwSettingsRow({
    super.key,
    required this.type,
    required this.icon,
    required this.label,
    this.description,
    this.value,
    this.switchValue = false,
    this.onTap,
    this.onSwitchChanged,
  });

  const RwSettingsRow.navigation({
    super.key,
    required this.icon,
    required this.label,
    this.description,
    this.value,
    required this.onTap,
  }) : type = RwSettingsRowType.navigation,
       switchValue = false,
       onSwitchChanged = null;

  const RwSettingsRow.toggle({
    super.key,
    required this.icon,
    required this.label,
    this.description,
    required this.switchValue,
    required this.onSwitchChanged,
  }) : type = RwSettingsRowType.toggle,
       value = null,
       onTap = null;

  const RwSettingsRow.info({super.key, required this.icon, required this.label, this.description})
    : type = RwSettingsRowType.info,
      value = null,
      switchValue = false,
      onTap = null,
      onSwitchChanged = null;

  const RwSettingsRow.destructive({
    super.key,
    required this.icon,
    required this.label,
    this.description,
    required this.onTap,
  }) : type = RwSettingsRowType.destructive,
       value = null,
       switchValue = false,
       onSwitchChanged = null;

  final RwSettingsRowType type;

  /// Icon name from [RwIcons].
  final String icon;
  final String label;
  final String? description;

  /// Current choice shown before the chevron (e.g. "System", "English").
  final String? value;
  final bool switchValue;
  final VoidCallback? onTap;
  final ValueChanged<bool>? onSwitchChanged;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final destructive = type == RwSettingsRowType.destructive;
    final toggle = type == RwSettingsRowType.toggle;
    final VoidCallback? tap = toggle
        ? (onSwitchChanged == null ? null : () => onSwitchChanged!(!switchValue))
        : onTap;
    final semantic = [label, ?description, ?value].join(', ');

    Widget row(RwPressState s) => Container(
      constraints: const BoxConstraints(minHeight: 56),
      padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: RwSpace.s12),
      decoration: BoxDecoration(
        color: s.active ? c.surfaceNavySubtle : c.surfaceWhite,
        border: Border(bottom: BorderSide(color: c.borderSubtle)),
      ),
      child: Row(
        children: [
          RwIcon(icon, size: RwSize.iconLg, color: destructive ? c.textDanger : c.textPrimary),
          const SizedBox(width: RwSpace.s16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: RwType.body.copyWith(color: destructive ? c.textDanger : c.textPrimary)),
                if (description != null) ...[
                  const SizedBox(height: 2),
                  Text(description!, style: RwType.bodySm.copyWith(color: c.textMuted)),
                ],
              ],
            ),
          ),
          if (type == RwSettingsRowType.navigation) ...[
            if (value != null) ...[
              const SizedBox(width: RwSpace.s16),
              Text(value!, style: RwType.bodySm.copyWith(color: c.textMuted)),
            ],
            const SizedBox(width: RwSpace.s16),
            RwIcon(RwIcons.chevronRight, size: RwSize.iconMd, color: c.textPrimary),
          ],
          if (toggle) ...[
            const SizedBox(width: RwSpace.s16),
            RwSwitchVisual(value: switchValue, enabled: onSwitchChanged != null),
          ],
        ],
      ),
    );

    if (type == RwSettingsRowType.info) {
      return Semantics(
        label: semantic,
        excludeSemantics: true,
        child: row(const RwPressState(pressed: false, hovered: false, focused: false, enabled: false)),
      );
    }
    return RwPressable(
      onTap: tap,
      isButton: !toggle,
      toggled: toggle ? switchValue : null,
      semanticLabel: semantic,
      excludeChildSemantics: true,
      borderRadius: BorderRadius.zero,
      builder: (context, s) => row(s),
    );
  }
}
