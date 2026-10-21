import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

/// Bottom-nav tabs. Reporters see [reporterTabs] (#25), Traffic Officers [officerTabs] (#36).
enum RwTab {
  home('Home', RwIcons.home),
  myReports('My reports', RwIcons.fileText),
  assigned('Assigned', RwIcons.userCheck),
  notifications('Notifications', RwIcons.bell),
  settings('Settings', RwIcons.settings);

  const RwTab(this.label, this.icon);
  final String label;
  final String icon;

  static const reporterTabs = [home, myReports, notifications, settings];
  static const officerTabs = [assigned, notifications, settings];
}

/// Figma "Bottom nav" (105:617): 80 px bar, equal items (Role=Reporter: 4, Role=Officer: 3). The
/// active item has a 64 × 32 navy indicator with a white icon and a text/primary label; inactive
/// labels are text/muted.
class RwBottomNav extends StatelessWidget {
  const RwBottomNav({
    super.key,
    required this.current,
    required this.onSelected,
    this.unreadCount = 0,
    this.tabs = RwTab.reporterTabs,
  });

  final RwTab current;

  /// [RwTab.reporterTabs] or [RwTab.officerTabs].
  final List<RwTab> tabs;
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
              for (final (i, tab) in tabs.indexed)
                Expanded(
                  child: _NavItem(
                    tab: tab,
                    active: tab == current,
                    position: '${i + 1} of ${tabs.length}',
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
