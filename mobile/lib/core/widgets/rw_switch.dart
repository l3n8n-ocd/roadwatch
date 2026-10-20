import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

/// Figma "Switch" (160:866): 56 × 48 hit area, 52 × 32 track. On = navy track, white knob with a
/// check. Off = white track with control border, grey knob. Always pass [semanticLabel]
/// unless the switch sits inside an RwSettingsRow (which labels it).
class RwSwitch extends StatelessWidget {
  const RwSwitch({super.key, required this.value, required this.onChanged, this.semanticLabel});

  final bool value;
  final ValueChanged<bool>? onChanged;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return RwPressable(
      onTap: onChanged == null ? null : () => onChanged!(!value),
      isButton: false,
      toggled: value,
      semanticLabel: semanticLabel,
      excludeChildSemantics: true,
      borderRadius: RwRadius.fullAll,
      builder: (context, s) => RwSwitchVisual(value: value, enabled: s.enabled),
    );
  }
}

/// The switch drawing only, without its own tap target (used inside RwSettingsRow).
class RwSwitchVisual extends StatelessWidget {
  const RwSwitchVisual({super.key, required this.value, this.enabled = true});

  final bool value;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final duration = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 150);
    return SizedBox(
      width: 56,
      height: RwSize.touch,
      child: Center(
        child: AnimatedContainer(
          duration: duration,
          width: 52,
          height: 32,
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: !enabled ? c.surfaceNavySubtle : (value ? c.brandNavy : c.surfaceWhite),
            borderRadius: RwRadius.fullAll,
            border: value ? null : Border.all(color: enabled ? c.borderControl : c.borderSubtle),
          ),
          child: AnimatedAlign(
            duration: duration,
            alignment: value ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              width: value ? 24 : 20,
              height: value ? 24 : 20,
              decoration: BoxDecoration(
                color: value ? c.surfaceWhite : c.borderControl,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: value ? RwIcon(RwIcons.check, size: RwSize.iconSm, color: c.brandNavy) : null,
            ),
          ),
        ),
      ),
    );
  }
}
