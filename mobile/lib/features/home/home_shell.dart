import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/auth_provider.dart';
import '../../core/state/notifications_provider.dart';
import '../../core/widgets/widgets.dart';
import '../my_reports/my_reports_screen.dart';
import '../notifications/notifications_screen.dart';
import '../officer/assigned_screen.dart';
import '../settings/settings_screen.dart';
import 'home_screen.dart';

/// Signed-in root: RwBottomNav with the tabs for the signed-in role. Reporters: Home, My reports,
/// Notifications, Settings (#25). Traffic Officers: Assigned, Notifications, Settings (#36).
/// Each tab keeps its state (IndexedStack).
class HomeShell extends StatefulWidget {
  const HomeShell({super.key, this.initialTab = RwTab.home});

  /// [RwTab.home] opens the role's first tab (Assigned for officers).
  final RwTab initialTab;

  /// Switches tab from anywhere inside the shell (e.g. the Home bell opens Notifications).
  /// Returns false when called outside a HomeShell.
  static bool selectTab(BuildContext context, RwTab tab) {
    final state = context.findAncestorStateOfType<_HomeShellState>();
    state?._select(tab);
    return state != null;
  }

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late RwTab _tab = widget.initialTab;

  @override
  void initState() {
    super.initState();
    // Unread count for the bell and the Notifications tab.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<NotificationsProvider>().refresh();
    });
    rwGuideRequests.addListener(_guideRequested);
  }

  @override
  void dispose() {
    rwGuideRequests.removeListener(_guideRequested);
    super.dispose();
  }

  // Start the guide (#56): show the first tab (Home or Assigned), then let it start its tour.
  void _guideRequested() {
    if (!mounted) return;
    final officer = context.read<AuthProvider>().user?.isOfficer ?? false;
    setState(() => _tab = officer ? RwTab.assigned : RwTab.home);
    WidgetsBinding.instance.addPostFrameCallback((_) => rwGuideStart.value++);
  }

  void _select(RwTab tab) {
    if (tab == _tab) return;
    setState(() => _tab = tab);
    if (tab == RwTab.notifications) context.read<NotificationsProvider>().refresh();
  }

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<NotificationsProvider>().unread;
    final officer = context.select<AuthProvider, bool>((a) => a.user?.isOfficer ?? false);
    final tabs = officer ? RwTab.officerTabs : RwTab.reporterTabs;
    final current = tabs.contains(_tab) ? _tab : tabs.first;
    final pages = officer
        ? const [AssignedTab(), NotificationsTab(), SettingsTab()]
        : const [HomeTab(), MyReportsTab(), NotificationsTab(), SettingsTab()];
    return Scaffold(
      body: IndexedStack(index: tabs.indexOf(current), children: pages),
      bottomNavigationBar: RwBottomNav(
        current: current,
        tabs: tabs,
        onSelected: _select,
        unreadCount: unread,
      ),
    );
  }
}
