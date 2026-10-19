import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

/// The 4 tabs (docs/DECISIONS.md #25).
enum RwTab {
  home('Home', RwIcons.home),
  myReports('My reports', RwIcons.fileText),
  notifications('Notifications', RwIcons.bell),
  settings('Settings', RwIcons.settings);

  const RwTab(this.label, this.icon);
  final String label;
  final String icon;
}

/// Figma "Bottom nav" (105:617): 80 px bar, 4 equal items. The active item has a 64 × 32 navy
/// indicator with a white icon and a text/primary label; inactive labels are text/muted.
class RwBottomNav extends StatelessWidget {
  const RwBottomNav({super.key, required this.current, required this.onSelected, this.unreadCount = 0});

  final RwTab current;
  final ValueChanged<RwTab> onSelected;

  /// Read out on the Notifications tab ("Notifications, 3 unread").
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        border: Border(top: BorderSide(color: c.borderSubtle)),
        boxShadow: RwShadow.md,
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 80,
          child: Row(
            children: [
              for (final (i, tab) in RwTab.values.indexed)
                Expanded(
                  child: _NavItem(
                    tab: tab,
                    active: tab == current,
                    position: '${i + 1} of ${RwTab.values.length}',
                    unread: tab == RwTab.notifications ? unreadCount : 0,
                    onTap: () => onSelected(tab),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.tab,
    required this.active,
    required this.position,
    required this.unread,
    required this.onTap,
  });

  final RwTab tab;
  final bool active;
  final String position;
  final int unread;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final label = unread > 0 ? '${tab.label}, $unread unread' : tab.label;
    return RwPressable(
      onTap: onTap,
      selected: active,
      semanticLabel: '$label, tab $position',
      excludeChildSemantics: true,
      borderRadius: RwRadius.smAll,
      builder: (context, s) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 32,
            decoration: BoxDecoration(
              color: active ? c.brandNavy : (s.active ? c.surfaceNavySubtle : null),
              borderRadius: RwRadius.fullAll,
            ),
            alignment: Alignment.center,
            child: RwIcon(tab.icon, size: RwSize.iconLg, color: active ? c.textInverse : c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s4),
          Text(
            tab.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: RwType.nav.copyWith(color: active ? c.textPrimary : c.textMuted),
          ),
        ],
      ),
    );
  }
}
