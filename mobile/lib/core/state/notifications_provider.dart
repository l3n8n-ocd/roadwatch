import 'package:flutter/foundation.dart';

import '../api/api_exception.dart';
import '../api/models.dart';
import '../api/roadwatch_api.dart';

/// In-app notifications (GET /notifications) and the unread count shown on the bell and the
/// Notifications tab. Screens call [refresh] on open and on pull-to-refresh.
class NotificationsProvider extends ChangeNotifier {
  NotificationsProvider(this.api);

  final RoadWatchApi api;

  List<AppNotification> _items = const [];
  int _unread = 0;
  bool _loading = false;
  ApiException? _error;

  List<AppNotification> get items => _items;
  int get unread => _unread;
  bool get loading => _loading;
  ApiException? get error => _error;

  Future<void> refresh() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final list = await api.notifications();
      _items = list.items;
      _unread = list.unread;
    } on ApiException catch (e) {
      _error = e;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(AppNotification n) async {
    if (n.isRead) return;
    await api.markNotificationRead(n.notificationId);
    _items = [
      for (final item in _items)
        item.notificationId == n.notificationId
            ? AppNotification(
                notificationId: item.notificationId,
                reportId: item.reportId,
                message: item.message,
                isRead: true,
                createdAt: item.createdAt,
              )
            : item,
    ];
    _unread = _items.where((i) => !i.isRead).length;
    notifyListeners();
  }

  Future<void> markAllRead() async {
    await api.markAllNotificationsRead();
    await refresh();
  }

  /// Called on logout so the next account does not see old data.
  void clear() {
    _items = const [];
    _unread = 0;
    _error = null;
    notifyListeners();
  }
}
