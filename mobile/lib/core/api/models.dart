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
  bool get isOfficer => role == Roles.officer;

  /// The roles this app serves (#36); Administrators use the website.
  bool get usesMobileApp => isReporter || isOfficer;

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
    this.changedByRole,
  });

  final int historyId;
  final String? previousStatus;
  final String newStatus;
  final DateTime? changedAt;

  /// Staff names are not shown to reporters (Figma M6 note: show the actor's role instead).
  final String? changedByName;

  /// Role of the person who made the change (Reporter, Administrator or Traffic Officer).
  final String? changedByRole;

  factory StatusHistoryEntry.fromJson(Map<String, dynamic> j) => StatusHistoryEntry(
    historyId: _int(j['history_id']),
    previousStatus: _str(j['previous_status']),
    newStatus: _str(j['new_status']) ?? '',
    changedAt: _date(j['changed_at']),
    changedByName: _str(_map(j['changedBy'])?['full_name']),
    changedByRole: _str(_map(_map(j['changedBy'])?['role'])?['role_name']),
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
    this.reporterName,
    this.reporterPhone,
    this.reporterEmail,
    this.photos = const [],
    this.statusHistory = const [],
    this.priority,
    this.prioritySource,
    this.dispatch,
    this.assignedOfficerId,
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

  /// Reporter contact: only sent to the reporter, administrators and the assigned officer.
  final String? reporterName;
  final String? reporterPhone;
  final String? reporterEmail;
  final List<ReportPhoto> photos;
  final List<StatusHistoryEntry> statusHistory;
  final int? assignedOfficerId;

  /// Low, Medium, High or Urgent (#54). Staff only: the API never sends it to reporters.
  final String? priority;

  /// 'auto' or 'admin'.
  final String? prioritySource;

  /// The nearby-officer path (#57), staff only; null when no officer was alerted.
  final DispatchInfo? dispatch;

  /// This officer took the report from a nearby alert and must confirm it on scene or reject it.
  bool get awaitingOnSceneConfirmation => dispatch?.state == DispatchInfo.responding;

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
      reporterName: _str(_map(j['reporter'])?['full_name']),
      reporterPhone: _str(_map(j['reporter'])?['contact_phone']),
      reporterEmail: _str(_map(j['reporter'])?['contact_email']),
      photos: _list(j['photos']).map(ReportPhoto.fromJson).toList(),
      // Newest first, so statusHistory.first is the current status.
      statusHistory: history,
      priority: _str(j['priority']),
      prioritySource: _str(j['priority_source']),
      dispatch: _map(j['dispatch']) == null ? null : DispatchInfo.fromJson(_map(j['dispatch'])!),
      assignedOfficerId: _intOrNull(j['assigned_officer_id']),
    );
  }
}

/// What staff see about a report's nearby-officer path (#57): alerting, no_response (nobody answered in
/// 10 minutes), responding, confirmed or rejected_on_scene.
class DispatchInfo {
  const DispatchInfo({required this.state, this.responderName, this.respondedAt, this.distanceKm});

  static const responding = 'responding';
  static const confirmed = 'confirmed';
  static const rejectedOnScene = 'rejected_on_scene';

  final String state;
  final String? responderName;
  final DateTime? respondedAt;
  final double? distanceKm;

  factory DispatchInfo.fromJson(Map<String, dynamic> j) => DispatchInfo(
    state: _str(j['state']) ?? '',
    responderName: _str(_map(j['responder'])?['full_name']),
    respondedAt: _date(j['responded_at']),
    distanceKm: _double(j['distance_km']),
  );
}

/// An open "Accident reported near you" alert (#57, GET /officer/nearby).
class NearbyAlert {
  const NearbyAlert({
    required this.reportId,
    required this.location,
    required this.distanceKm,
    this.priority,
    this.accidentType,
    this.dateSubmitted,
  });

  final int reportId;
  final String? priority;
  final String? accidentType;
  final String location;
  final double distanceKm;
  final DateTime? dateSubmitted;

  factory NearbyAlert.fromJson(Map<String, dynamic> j) => NearbyAlert(
    reportId: _int(j['report_id']),
    priority: _str(j['priority']),
    accidentType: _str(j['accident_type']),
    location: _str(j['accident_location']) ?? '',
    distanceKm: _double(j['distance_km']) ?? 0,
    dateSubmitted: _date(j['date_submitted']),
  );
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

/// One video from GET /app-info (#48): a Cloudinary URL and its transcript, both null until published.
class VideoClip {
  const VideoClip({this.url, this.transcript});

  final String? url;
  final String? transcript;

  factory VideoClip.fromJson(Object? j) {
    final m = j is Map ? j : const {};
    final url = _str(m['url']);
    final transcript = _str(m['transcript']);
    return VideoClip(
      url: (url == null || url.isEmpty) ? null : url,
      transcript: (transcript == null || transcript.isEmpty) ? null : transcript,
    );
  }
}

class AppInfo {
  const AppInfo({
    this.demoVideoUrl,
    this.reporterClip = const VideoClip(),
    this.officerClip = const VideoClip(),
  });

  /// The promotional video (older API: the one demo video). Null until the team publishes it.
  final String? demoVideoUrl;

  /// The 30-second demo clips the app shows (#48): Reporter for everyone, Traffic Officer for officers.
  final VideoClip reporterClip;
  final VideoClip officerClip;

  factory AppInfo.fromJson(Map<String, dynamic> j) {
    final url = _str(j['demoVideoUrl']);
    final clips = j['demoVideos'] is Map ? j['demoVideos'] as Map : const {};
    return AppInfo(
      demoVideoUrl: (url == null || url.isEmpty) ? null : url,
      reporterClip: VideoClip.fromJson(clips['reporter']),
      officerClip: VideoClip.fromJson(clips['officer']),
    );
  }
}
