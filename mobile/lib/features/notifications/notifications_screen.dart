import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/constants.dart';
import '../../core/state/notifications_provider.dart';
import '../../core/state/settings_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// Notifications (FR-09, in-app). Figma (Mobile page 90:4): Notifications/Default 119:1759,
/// Empty 119:1871.
///
/// NotificationsProvider holds the list (HomeShell refreshes it when this tab opens). Tapping a
/// row marks it read and opens the report's tracking screen. Settings > Notifications (in-app)
/// hides status-change or more-information alerts on this phone.
///
/// Tab body hosted by HomeShell (no back button).
class NotificationsTab extends StatefulWidget {
  const NotificationsTab({super.key});

  @override
  State<NotificationsTab> createState() => _NotificationsTabState();
}

class _NotificationsTabState extends State<NotificationsTab> {
  bool _markingAll = false;

  Future<void> _open(AppNotification n) async {
    final provider = context.read<NotificationsProvider>();
    try {
      await provider.markRead(n);
    } on ApiException {
      // Opening the report matters more than the read flag; it is retried on the next tap.
    }
    if (!mounted || n.reportId == null) return;
    Navigator.of(context).pushNamed(Routes.tracking, arguments: n.reportId);
  }

  Future<void> _markAll() async {
    setState(() => _markingAll = true);
    try {
      await context.read<NotificationsProvider>().markAllRead();
    } on ApiException catch (e) {
      if (mounted) {
        showRwToast(
          context,
          type: RwToastType.error,
          title: "Couldn't mark them as read",
          message: e.message,
        );
      }
    } finally {
      if (mounted) setState(() => _markingAll = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final provider = context.watch<NotificationsProvider>();
    final settings = context.watch<SettingsProvider>();
    final items = provider.items
        .where((n) => _visible(n, settings.alertStatusChanges, settings.alertInfoRequests))
        .toList();
    final unread = items.where((n) => !n.isRead).length;

    final List<Widget> children;
    if (items.isEmpty && provider.loading) {
      children = [const _NotificationsSkeleton()];
    } else if (items.isEmpty && provider.error != null) {
      children = [
        RwEmptyState.error(
          title: "Couldn't load notifications",
          message: provider.error!.kind == ApiErrorKind.network
              ? 'Check your connection, then try again.'
              : provider.error!.message,
          onAction: provider.refresh,
        ),
      ];
    } else if (items.isEmpty) {
      children = [
        const SizedBox(height: RwSpace.s48 - RwSpace.s32),
        const RwEmptyState(
          icon: RwIcons.bell,
          title: 'No notifications yet',
          message: 'Status changes on your reports will show up here.',
        ),
      ];
    } else {
      children = [
        _ListHeader(unread: unread, busy: _markingAll, onMarkAll: unread > 0 ? _markAll : null),
        if (provider.error != null)
          Padding(
            padding: const EdgeInsets.all(RwSpace.s16),
            child: RwToast(
              type: RwToastType.error,
              title: "Couldn't refresh notifications",
              message: provider.error!.message,
            ),
          ),
        for (final n in items)
          RwNotificationItem(
            message: n.message,
            timeLabel: _timeLabel(n.createdAt),
            isRead: n.isRead,
            icon: _iconFor(n.message),
            iconColor: _iconColorFor(c, n.message),
            onTap: () => _open(n),
          ),
      ];
    }

    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Notifications'),
      body: RefreshIndicator(
        color: c.textPrimary,
        backgroundColor: c.surfaceWhite,
        onRefresh: provider.refresh,
        child: ListView(physics: const AlwaysScrollableScrollPhysics(), children: children),
      ),
    );
  }
}

/// "2 unread" and the "Mark all as read" link (Figma List header).
class _ListHeader extends StatelessWidget {
  const _ListHeader({required this.unread, required this.busy, required this.onMarkAll});

  final int unread;
  final bool busy;
  final VoidCallback? onMarkAll;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      padding: const EdgeInsets.only(left: RwSpace.s16, right: RwSpace.s4),
      constraints: const BoxConstraints(minHeight: 56),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        border: Border(bottom: BorderSide(color: c.borderSubtle)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              liveRegion: true,
              child: Text(
                unread == 0 ? 'All caught up' : '$unread unread',
                style: RwType.label.copyWith(color: c.textPrimary),
              ),
            ),
          ),
          if (onMarkAll != null || busy)
            RwPressable(
              onTap: busy ? null : onMarkAll,
              semanticLabel: 'Mark all notifications as read',
              excludeChildSemantics: true,
              borderRadius: RwRadius.smAll,
              builder: (context, s) => Container(
                constraints: const BoxConstraints(minHeight: RwSize.touch),
                padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12),
                alignment: Alignment.center,
                child: Text(
                  busy ? 'Marking…' : 'Mark all as read',
                  style: RwType.label.copyWith(
                    color: busy ? c.textMuted : c.textBlue,
                    decoration: TextDecoration.underline,
                    decorationColor: busy ? c.textMuted : c.textBlue,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _NotificationsSkeleton extends StatelessWidget {
  const _NotificationsSkeleton();

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwSkeletonGroup(
      label: 'Loading notifications',
      child: Column(
        children: [
          for (var i = 0; i < 4; i++)
            Container(
              padding: const EdgeInsets.all(RwSpace.s16),
              decoration: BoxDecoration(
                color: c.surfaceWhite,
                border: Border(bottom: BorderSide(color: c.borderSubtle)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RwSkeleton(width: 40, height: 40),
                  SizedBox(width: RwSpace.s12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RwSkeleton(width: 220, height: 16),
                        SizedBox(height: RwSpace.s8),
                        RwSkeleton(width: 80),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

bool _isInfoRequest(String message) {
  final m = message.toLowerCase();
  return m.contains('more information') || m.contains(Statuses.additionalInfo.toLowerCase());
}

/// The status named in the message, if any (the API words them like "RW-000128 is now Under Review").
String? _statusIn(String message) {
  final m = message.toLowerCase();
  for (final s in Statuses.all) {
    if (s != Statuses.submitted && m.contains(s.toLowerCase())) return s;
  }
  if (m.contains('assigned')) return Statuses.assigned;
  if (m.contains('received') || m.contains('submitted')) return Statuses.submitted;
  return null;
}

/// Applies the device-only alert preferences (Settings > Notifications (in-app), #25).
/// Submission confirmations are always shown.
bool _visible(AppNotification n, bool statusChanges, bool infoRequests) {
  if (_isInfoRequest(n.message)) return infoRequests;
  final status = _statusIn(n.message);
  if (status == null || status == Statuses.submitted) return true;
  return statusChanges;
}

String _iconFor(String message) {
  if (_isInfoRequest(message)) return RwIcons.alertTriangle;
  final status = _statusIn(message);
  return status == null ? RwIcons.bell : statusIconName(status);
}

Color _iconColorFor(RwColors c, String message) {
  if (_isInfoRequest(message)) return c.textPrimary;
  final status = _statusIn(message);
  if (status == null || status == Statuses.submitted || status == Statuses.assigned) return c.textBlue;
  if (status == Statuses.resolved) return c.textSuccess;
  return statusIconColor(c, status);
}

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/// Figma wording: "5 min ago", "Today · 08:42", "Yesterday · 10:20", "Oct 15 · 14:05".
String _timeLabel(DateTime? value, {DateTime? now}) {
  if (value == null) return '';
  final d = value.toLocal();
  final n = now ?? DateTime.now();
  final diff = n.difference(d);
  String two(int v) => v.toString().padLeft(2, '0');
  final time = '${two(d.hour)}:${two(d.minute)}';
  if (!diff.isNegative && diff.inMinutes < 1) return 'Just now';
  if (!diff.isNegative && diff.inMinutes < 60) return '${diff.inMinutes} min ago';
  final today = DateTime(n.year, n.month, n.day);
  final day = DateTime(d.year, d.month, d.day);
  final days = today.difference(day).inDays;
  if (days == 0) return 'Today · $time';
  if (days == 1) return 'Yesterday · $time';
  final date = '${_months[d.month - 1]} ${d.day}';
  return d.year == n.year ? '$date · $time' : '$date, ${d.year} · $time';
}
