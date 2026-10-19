import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Keeps the JWT and the last known user in the platform keystore (never in plain prefs).
class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage]) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _tokenKey = 'rw.token';
  static const _userKey = 'rw.user';

  String? _cachedToken;

  Future<String?> readToken() async => _cachedToken ??= await _storage.read(key: _tokenKey);

  Future<void> writeToken(String token) async {
    _cachedToken = token;
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> readUserJson() => _storage.read(key: _userKey);

  Future<void> writeUserJson(String json) => _storage.write(key: _userKey, value: json);

  Future<void> clear() async {
    _cachedToken = null;
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}
