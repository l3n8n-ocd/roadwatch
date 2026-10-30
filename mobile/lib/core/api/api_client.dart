import 'package:dio/dio.dart';

import '../config.dart';
import 'api_exception.dart';
import 'token_storage.dart';

/// Thin wrapper around dio for the RoadWatch REST API (docs/API.md).
///
/// - Base URL from `--dart-define=API_URL=...` (see [AppConfig.apiUrl]).
/// - Sends `Authorization: Bearer <token>` when a token is stored.
/// - Unwraps `{ success, data }` and returns the whole body as [ApiBody].
/// - Throws [ApiException] with a friendly message for every failure.
class ApiClient {
  ApiClient({TokenStorage? tokenStorage, String? baseUrl, Dio? dio})
    : tokens = tokenStorage ?? TokenStorage(),
      _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: baseUrl ?? AppConfig.apiUrl,
              connectTimeout: AppConfig.connectTimeout,
              receiveTimeout: AppConfig.receiveTimeout,
              headers: {'Accept': 'application/json'},
            ),
          ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokens.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStorage tokens;

  /// Called when an authenticated request returns 401 (expired token or deactivated account).
  /// AuthProvider uses it to sign the user out.
  void Function(ApiException error)? onUnauthorized;

  String get baseUrl => _dio.options.baseUrl;

  Future<ApiBody> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get<dynamic>(path, queryParameters: _clean(query)));

  Future<ApiBody> post(String path, {Object? body, ProgressCallback? onSendProgress}) =>
      _send(() => _dio.post<dynamic>(path, data: body, onSendProgress: onSendProgress));

  Future<ApiBody> patch(String path, {Object? body}) => _send(() => _dio.patch<dynamic>(path, data: body));

  Future<ApiBody> put(String path, {Object? body}) => _send(() => _dio.put<dynamic>(path, data: body));

  Future<ApiBody> _send(Future<Response<dynamic>> Function() call) async {
    try {
      final res = await call();
      final body = res.data;
      if (body is Map && body['success'] == false) {
        throw ApiException.fromResponse(res);
      }
      return ApiBody(body is Map ? Map<String, dynamic>.from(body) : {'data': body});
    } on DioException catch (e) {
      final error = ApiException.fromDio(e);
      final hadToken = e.requestOptions.headers.containsKey('Authorization');
      if (error.kind == ApiErrorKind.unauthorized && hadToken) {
        onUnauthorized?.call(error);
      }
      throw error;
    }
  }

  static Map<String, dynamic>? _clean(Map<String, dynamic>? query) {
    if (query == null) return null;
    return Map.of(query)..removeWhere((_, v) => v == null || v == '');
  }
}

/// A decoded JSON response body.
class ApiBody {
  const ApiBody(this.json);

  final Map<String, dynamic> json;

  /// `data` when present, otherwise the whole body (health and app-info have no wrapper).
  dynamic get data => json.containsKey('data') ? json['data'] : json;

  Map<String, dynamic> get dataMap {
    final d = data;
    return d is Map ? Map<String, dynamic>.from(d) : <String, dynamic>{};
  }

  List<Map<String, dynamic>> get dataList {
    final d = data;
    if (d is! List) return const [];
    return d.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }
}
