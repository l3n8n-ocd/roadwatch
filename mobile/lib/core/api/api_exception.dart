import 'package:dio/dio.dart';

enum ApiErrorKind {
  network,
  timeout,
  unauthorized,
  forbidden,
  notFound,
  validation,
  conflict,
  tooLarge,
  server,
  unknown,
}

/// Every failed API call surfaces as an [ApiException] with a message that is safe to show.
class ApiException implements Exception {
  const ApiException({
    required this.kind,
    required this.message,
    this.statusCode,
    this.serverMessage,
    this.fieldErrors = const {},
    this.code,
  });

  final ApiErrorKind kind;

  /// Friendly text for the UI (Toast or inline error).
  final String message;
  final int? statusCode;

  /// The API's own `error` string, when there was one.
  final String? serverMessage;

  /// `details` from a 400 validation error: field name -> messages.
  final Map<String, List<String>> fieldErrors;

  /// `details.code` when the API sends one, e.g. 'WRONG_PLATFORM'.
  final String? code;

  /// 403 from POST /auth/login: the account signs in on the web dashboard, not here (#36).
  bool get isWrongPlatform => code == 'WRONG_PLATFORM';

  /// 409 from POST /officer/nearby/:id/respond: another nearby officer responded first (#57).
  bool get isAlreadyTaken => code == 'ALREADY_TAKEN';

  /// First validation message for a field (e.g. 'contact_email'), if any.
  String? fieldError(String field) {
    final list = fieldErrors[field];
    return (list == null || list.isEmpty) ? null : list.first;
  }

  /// The API answers 401 "Account is unavailable" when a signed-in account was deactivated.
  bool get isDeactivated =>
      kind == ApiErrorKind.unauthorized && (serverMessage ?? '').toLowerCase().contains('unavailable');

  @override
  String toString() => 'ApiException($statusCode, $kind): $message';

  factory ApiException.fromDio(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const ApiException(
          kind: ApiErrorKind.timeout,
          message:
              'RoadWatch is taking too long to answer. The server may be waking up; '
              'try again in a minute.',
        );
      case DioExceptionType.connectionError:
        return const ApiException(
          kind: ApiErrorKind.network,
          message: "Can't reach RoadWatch. Check your connection, then try again.",
        );
      case DioExceptionType.badResponse:
        return ApiException.fromResponse(e.response);
      default:
        return const ApiException(kind: ApiErrorKind.unknown, message: 'Something went wrong. Try again.');
    }
  }

  factory ApiException.fromResponse(Response<dynamic>? response) {
    final status = response?.statusCode;
    final body = response?.data;
    String? server;
    String? code;
    final fields = <String, List<String>>{};
    if (body is Map) {
      final err = body['error'];
      if (err is String && err.isNotEmpty) server = err;
      final details = body['details'];
      if (details is Map) {
        if (details['code'] is String) code = details['code'] as String;
        details.forEach((k, v) {
          if (v is List) fields['$k'] = v.map((m) => '$m').toList();
          if (v is String) fields['$k'] = [v];
        });
      }
    }
    ApiErrorKind kind;
    String message;
    switch (status) {
      case 400:
        kind = ApiErrorKind.validation;
        message = server ?? 'Check the highlighted fields and try again.';
      case 401:
        kind = ApiErrorKind.unauthorized;
        message = server ?? 'Please log in again.';
      case 403:
        kind = ApiErrorKind.forbidden;
        message = "Your account can't do this.";
      case 404:
        kind = ApiErrorKind.notFound;
        message = server ?? 'Not found.';
      case 409:
        kind = ApiErrorKind.conflict;
        message = server ?? 'This already exists.';
      case 413:
        kind = ApiErrorKind.tooLarge;
        message = 'A photo is too large. Each photo must be 5 MB or less.';
      default:
        kind = (status != null && status >= 500) ? ApiErrorKind.server : ApiErrorKind.unknown;
        message = 'Something went wrong on the server. Try again.';
    }
    return ApiException(
      kind: kind,
      message: message,
      statusCode: status,
      serverMessage: server,
      fieldErrors: fields,
      code: code,
    );
  }
}
