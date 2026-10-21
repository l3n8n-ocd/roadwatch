import 'package:dio/dio.dart';

import 'api_client.dart';
import 'models.dart';

/// One method per endpoint the mobile app uses (contract: docs/API.md).
/// Screens catch the ApiException and show the designed error state.
class RoadWatchApi {
  RoadWatchApi(this.client);

  final ApiClient client;

  // ----- public -----

  /// GET /health -> true when `{"status":"ok"}`.
  Future<bool> health() async {
    final body = await client.get('/health');
    return body.json['status'] == 'ok';
  }

  /// GET /app-info -> demo video URL (null = "Video coming soon").
  Future<AppInfo> appInfo() async => AppInfo.fromJson((await client.get('/app-info')).json);

  // ----- auth -----

  /// POST /auth/register. Always creates a Reporter; returns the token and user.
  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final body = await client.post(
      '/auth/register',
      body: {
        'full_name': fullName.trim(),
        'contact_email': email.trim(),
        'password': password,
        if (phone != null && phone.trim().isNotEmpty) 'contact_phone': phone.trim(),
      },
    );
    return AuthSession.fromJson(body.dataMap);
  }

  /// POST /auth/login. The app always signs in as `mobile`; the API refuses Administrators here (#36).
  Future<AuthSession> login({required String email, required String password}) async {
    final body = await client.post(
      '/auth/login',
      body: {'contact_email': email.trim(), 'password': password, 'platform': 'mobile'},
    );
    return AuthSession.fromJson(body.dataMap);
  }

  /// GET /auth/me.
  Future<AppUser> me() async {
    final data = (await client.get('/auth/me')).dataMap;
    return AppUser.fromJson(data['user'] is Map ? Map<String, dynamic>.from(data['user']) : data);
  }

  /// PATCH /auth/me (name and phone, #25). Email and role cannot be changed.
  Future<AppUser> updateMe({required String fullName, String? phone}) async {
    final data = (await client.patch(
      '/auth/me',
      body: {
        'full_name': fullName.trim(),
        'contact_phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      },
    )).dataMap;
    return AppUser.fromJson(data['user'] is Map ? Map<String, dynamic>.from(data['user']) : data);
  }

  /// PATCH /auth/me/password (#25). A wrong current password is a 400 with a `current_password` field error.
  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    await client.patch(
      '/auth/me/password',
      body: {'current_password': currentPassword, 'new_password': newPassword},
    );
  }

  // ----- reference data -----

  /// GET /accident-types for the report form dropdown.
  Future<List<AccidentType>> accidentTypes() async =>
      (await client.get('/accident-types')).dataList.map(AccidentType.fromJson).toList();

  // ----- reports (reporter) -----

  /// POST /reports. Returns the new report (Report ID = reportId).
  Future<Report> createReport(NewReport report) async =>
      Report.fromJson((await client.post('/reports', body: report.toJson())).dataMap);

  /// GET /reports: only my reports, newest first.
  Future<Paged<Report>> myReports({int page = 1, int limit = 20, String? status}) async {
    final body = await client.get('/reports', query: {'page': page, 'limit': limit, 'status': status});
    final pagination = body.json['pagination'];
    return Paged(
      items: body.dataList.map(Report.fromJson).toList(),
      pagination: Pagination.fromJson(pagination is Map ? Map<String, dynamic>.from(pagination) : null),
    );
  }

  /// GET /reports/:id with photos and statusHistory (tracking, FR-06).
  Future<Report> getReport(int reportId) async =>
      Report.fromJson((await client.get('/reports/$reportId')).dataMap);

  /// POST /reports/:id/photos, multipart field "photos" (max 5 per call, JPG/PNG/WEBP, 5 MB each).
  Future<List<ReportPhoto>> uploadPhotos(
    int reportId,
    List<String> filePaths, {
    ProgressCallback? onSendProgress,
  }) async {
    final files = <MultipartFile>[];
    for (final path in filePaths) {
      files.add(
        await MultipartFile.fromFile(
          path,
          filename: path.split(RegExp(r'[/\\]')).last,
          contentType: DioMediaType.parse(_imageMimeType(path)),
        ),
      );
    }
    final form = FormData.fromMap({'photos': files});
    final body = await client.post('/reports/$reportId/photos', body: form, onSendProgress: onSendProgress);
    return body.dataList.map(ReportPhoto.fromJson).toList();
  }

  // ----- notifications -----

  /// GET /notifications: newest 100 plus the unread count.
  Future<NotificationList> notifications() async {
    final body = await client.get('/notifications');
    final unread = body.json['unread'];
    final items = body.dataList.map(AppNotification.fromJson).toList();
    return NotificationList(
      items: items,
      unread: unread is int ? unread : items.where((n) => !n.isRead).length,
    );
  }

  /// PATCH /notifications/:id/read
  Future<void> markNotificationRead(int notificationId) async {
    await client.patch('/notifications/$notificationId/read');
  }

  /// PATCH /notifications/read-all
  Future<void> markAllNotificationsRead() async {
    await client.patch('/notifications/read-all');
  }

  static String _imageMimeType(String path) {
    final ext = path.split('.').last.toLowerCase();
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}
