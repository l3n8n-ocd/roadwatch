// Plain data classes for the API responses the mobile app uses (docs/API.md).
// Field names match the database columns so they are easy to trace.

import '../constants.dart';

int _int(Object? v) => v is int ? v : int.tryParse('$v') ?? 0;
int? _intOrNull(Object? v) => v == null ? null : int.tryParse('$v');
double? _double(Object? v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse('$v'));
String? _str(Object? v) => v?.toString();
DateTime? _date(Object? v) => v == null ? null : DateTime.tryParse('$v');
Map<String, dynamic>? _map(Object? v) => v is Map ? Map<String, dynamic>.from(v) : null;
List<Map<String, dynamic>> _list(Object? v) =>
    v is List ? v.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList() : const [];

class AppUser {
  const AppUser({
    required this.userId,
    required this.fullName,
    required this.contactEmail,
    required this.role,
    this.contactPhone,
  });

  final int userId;
  final String fullName;
  final String contactEmail;
  final String? contactPhone;
  final String role;

  bool get isReporter => role == Roles.reporter;

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
    userId: _int(j['user_id']),
    fullName: _str(j['full_name']) ?? '',
    contactEmail: _str(j['contact_email']) ?? '',
    contactPhone: _str(j['contact_phone']),
    // /auth/login returns `role` as a string; other payloads may nest it.
    role: j['role'] is Map ? (_str((j['role'] as Map)['role_name']) ?? '') : (_str(j['role']) ?? ''),
  );

  Map<String, dynamic> toJson() => {
    'user_id': userId,
    'full_name': fullName,
    'contact_email': contactEmail,
    'contact_phone': contactPhone,
    'role': role,
  };
}

class AuthSession {
  const AuthSession({required this.token, required this.user});
  final String token;
  final AppUser user;

  factory AuthSession.fromJson(Map<String, dynamic> j) =>
      AuthSession(token: _str(j['token']) ?? '', user: AppUser.fromJson(_map(j['user']) ?? const {}));
}

class AccidentType {
  const AccidentType({required this.typeId, required this.typeName});
  final int typeId;
  final String typeName;

  factory AccidentType.fromJson(Map<String, dynamic> j) =>
      AccidentType(typeId: _int(j['type_id']), typeName: _str(j['type_name']) ?? '');
}

class ReportPhoto {
  const ReportPhoto({required this.photoId, required this.url, this.uploadedAt});
  final int photoId;
  final String url;
  final DateTime? uploadedAt;

  factory ReportPhoto.fromJson(Map<String, dynamic> j) => ReportPhoto(
    photoId: _int(j['photo_id']),
    url: _str(j['cloudinary_url']) ?? '',
    uploadedAt: _date(j['uploaded_at']),
  );
}

class StatusHistoryEntry {
  const StatusHistoryEntry({
    required this.historyId,
    required this.newStatus,
    this.previousStatus,
    this.changedAt,
    this.changedByName,
  });

  final int historyId;
  final String? previousStatus;
  final String newStatus;
  final DateTime? changedAt;

  /// Staff names are not shown to reporters (Figma M6 note: show the actor's role instead).
  final String? changedByName;

  factory StatusHistoryEntry.fromJson(Map<String, dynamic> j) => StatusHistoryEntry(
    historyId: _int(j['history_id']),
    previousStatus: _str(j['previous_status']),
    newStatus: _str(j['new_status']) ?? '',
    changedAt: _date(j['changed_at']),
    changedByName: _str(_map(j['changedBy'])?['full_name']),
  );
}

class Report {
  const Report({
    required this.reportId,
    required this.status,
    required this.recordType,
    required this.accidentDate,
    required this.accidentTime,
    required this.location,
    required this.description,
    required this.injury,
    this.accidentTypeId,
    this.accidentTypeName,
    this.latitude,
    this.longitude,
    this.vehiclesInvolved,
    this.officialRemarks,
    this.dateSubmitted,
    this.assignedOfficerName,
    this.photos = const [],
    this.statusHistory = const [],
  });

  final int reportId;
  final String status;
  final String recordType;
  final String accidentDate;
  final String accidentTime;
  final String location;
  final String description;
  final String injury;
  final int? accidentTypeId;
  final String? accidentTypeName;
  final double? latitude;
  final double? longitude;
  final String? vehiclesInvolved;
  final String? officialRemarks;
  final DateTime? dateSubmitted;
  final String? assignedOfficerName;
  final List<ReportPhoto> photos;
  final List<StatusHistoryEntry> statusHistory;

  bool get isVerifiedRecord => recordType == RecordTypes.verifiedRecord;
  bool get hasLocation => latitude != null && longitude != null;

  factory Report.fromJson(Map<String, dynamic> j) {
    final history = _list(j['statusHistory']).map(StatusHistoryEntry.fromJson).toList()
      ..sort((a, b) => (b.changedAt ?? DateTime(0)).compareTo(a.changedAt ?? DateTime(0)));
    return Report(
      reportId: _int(j['report_id']),
      status: _str(j['report_status']) ?? Statuses.submitted,
      recordType: _str(j['record_type']) ?? RecordTypes.publicSubmission,
      accidentDate: _str(j['accident_date']) ?? '',
      accidentTime: _str(j['accident_time']) ?? '',
      location: _str(j['accident_location']) ?? '',
      description: _str(j['accident_description']) ?? '',
      injury: _str(j['injury_information']) ?? 'unknown',
      accidentTypeId: _intOrNull(j['accident_type_id']),
      accidentTypeName: _str(_map(j['accidentType'])?['type_name']),
      latitude: _double(j['latitude']),
      longitude: _double(j['longitude']),
      vehiclesInvolved: _str(j['vehicles_involved']),
      officialRemarks: _str(j['official_remarks']),
      dateSubmitted: _date(j['date_submitted']),
      assignedOfficerName: _str(_map(j['assignedOfficer'])?['full_name']),
      photos: _list(j['photos']).map(ReportPhoto.fromJson).toList(),
      // Newest first, so statusHistory.first is the current status.
      statusHistory: history,
    );
  }
}

/// Body for POST /reports. Photos are uploaded afterwards with uploadPhotos().
class NewReport {
  const NewReport({
    required this.accidentTypeId,
    required this.accidentDate,
    required this.accidentTime,
    required this.location,
    required this.description,
    required this.injury,
    this.latitude,
    this.longitude,
    this.vehiclesInvolved,
  });

  final int accidentTypeId;

  /// YYYY-MM-DD
  final String accidentDate;

  /// HH:MM (24 h)
  final String accidentTime;
  final String location;
  final String description;

  /// none | injuries | fatalities | unknown
  final String injury;
  final double? latitude;
  final double? longitude;
  final String? vehiclesInvolved;

  Map<String, dynamic> toJson() => {
    'accident_type_id': accidentTypeId,
    'accident_date': accidentDate,
    'accident_time': accidentTime,
    'accident_location': location,
    'accident_description': description,
    'injury_information': injury,
    // The API needs latitude and longitude together or not at all.
    if (latitude != null && longitude != null) 'latitude': latitude,
    if (latitude != null && longitude != null) 'longitude': longitude,
    if (vehiclesInvolved != null && vehiclesInvolved!.trim().isNotEmpty)
      'vehicles_involved': vehiclesInvolved!.trim(),
  };
}

class AppNotification {
  const AppNotification({
    required this.notificationId,
    required this.message,
    required this.isRead,
    this.reportId,
    this.createdAt,
  });

  final int notificationId;
  final int? reportId;
  final String message;
  final bool isRead;
  final DateTime? createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
    notificationId: _int(j['notification_id']),
    reportId: _intOrNull(j['report_id']),
    message: _str(j['message']) ?? '',
    isRead: j['is_read'] == true || j['is_read'] == 1,
    createdAt: _date(j['created_at']),
  );
}

class NotificationList {
  const NotificationList({required this.items, required this.unread});
  final List<AppNotification> items;
  final int unread;
}

class Pagination {
  const Pagination({this.page = 1, this.limit = 20, this.total = 0, this.pages = 0});
  final int page;
  final int limit;
  final int total;
  final int pages;

  bool get hasMore => page < pages;

  factory Pagination.fromJson(Map<String, dynamic>? j) => j == null
      ? const Pagination()
      : Pagination(
          page: _int(j['page']),
          limit: _int(j['limit']),
          total: _int(j['total']),
          pages: _int(j['pages']),
        );
}

class Paged<T> {
  const Paged({required this.items, required this.pagination});
  final List<T> items;
  final Pagination pagination;
}

class AppInfo {
  const AppInfo({this.demoVideoUrl});

  /// Null until the team publishes the video ("Video coming soon").
  final String? demoVideoUrl;

  factory AppInfo.fromJson(Map<String, dynamic> j) {
    final url = _str(j['demoVideoUrl']);
    return AppInfo(demoVideoUrl: (url == null || url.isEmpty) ? null : url);
  }
}
