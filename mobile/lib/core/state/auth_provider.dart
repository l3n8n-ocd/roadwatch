import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_exception.dart';
import '../api/models.dart';
import '../api/roadwatch_api.dart';

enum AuthStatus { unknown, signedOut, signedIn }

enum AuthFailureKind { invalidCredentials, deactivated, staffAccount, emailTaken, validation, network, other }

/// A sign-in or registration problem with the Figma M0 wording (title + message for the
/// error banner, frames 109:79 and 109:164).
class AuthFailure implements Exception {
  const AuthFailure(this.kind, this.title, this.message, {this.fieldErrors = const {}});

  final AuthFailureKind kind;
  final String title;
  final String message;
  final Map<String, List<String>> fieldErrors;

  String? fieldError(String field) {
    final list = fieldErrors[field];
    return (list == null || list.isEmpty) ? null : list.first;
  }

  static const invalidCredentials = AuthFailure(
    AuthFailureKind.invalidCredentials,
    "Couldn't log in",
    'Email or password is incorrect. Check both and try again.',
  );

  static const deactivated = AuthFailure(
    AuthFailureKind.deactivated,
    'Account deactivated',
    'This account can no longer log in. Contact the RoadWatch admin.',
  );

  /// The mobile app is for reporters only. Not drawn in Figma; follows the web wrong-role
  /// pattern (#28): the token is discarded and the user is pointed to the right place.
  static const staffAccount = AuthFailure(
    AuthFailureKind.staffAccount,
    'Use the RoadWatch website',
    'This app is for reporters. Administrators and traffic officers sign in on the RoadWatch website.',
  );

  static const sessionExpired = AuthFailure(
    AuthFailureKind.other,
    'Signed out',
    'Your session ended. Log in again to continue.',
  );

  @override
  String toString() => 'AuthFailure($kind): $message';
}

/// Holds the signed-in reporter. Screens read it with `context.watch<AuthProvider>()`.
class AuthProvider extends ChangeNotifier {
  AuthProvider(this.api) {
    api.client.onUnauthorized = _onUnauthorized;
  }

  final RoadWatchApi api;

  AuthStatus _status = AuthStatus.unknown;
  AppUser? _user;
  AuthFailure? _notice;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  bool get isSignedIn => _status == AuthStatus.signedIn;

  /// A banner the login screen should show once (deactivated, session ended).
  AuthFailure? get notice => _notice;

  void clearNotice() {
    if (_notice == null) return;
    _notice = null;
    notifyListeners();
  }

  /// Called once at start-up: reuses a stored token if the API still accepts it.
  Future<void> restore() async {
    final token = await api.client.tokens.readToken();
    if (token == null || token.isEmpty) {
      _setSignedOut();
      return;
    }
    try {
      final me = await api.me();
      if (!me.isReporter) {
        await api.client.tokens.clear();
        _setSignedOut(notice: AuthFailure.staffAccount);
        return;
      }
      await _saveUser(me);
      _user = me;
      _status = AuthStatus.signedIn;
      notifyListeners();
    } on ApiException catch (e) {
      if (e.kind == ApiErrorKind.unauthorized) {
        await api.client.tokens.clear();
        _setSignedOut(notice: e.isDeactivated ? AuthFailure.deactivated : null);
        return;
      }
      // Offline or server asleep: keep the session with the last known user.
      final cached = await _readCachedUser();
      if (cached != null) {
        _user = cached;
        _status = AuthStatus.signedIn;
        notifyListeners();
      } else {
        _setSignedOut();
      }
    }
  }

  /// Throws [AuthFailure] with the Figma wording when it fails.
  Future<void> login({required String email, required String password}) async {
    try {
      final session = await api.login(email: email, password: password);
      if (!session.user.isReporter) throw AuthFailure.staffAccount;
      await _startSession(session);
    } on ApiException catch (e) {
      if (e.kind == ApiErrorKind.unauthorized) {
        // The API uses one message for wrong password and deactivated accounts on purpose.
        throw AuthFailure.invalidCredentials;
      }
      throw _fromApi(e);
    }
  }

  /// Registers a Reporter account and signs in. Throws [AuthFailure].
  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final session = await api.register(fullName: fullName, email: email, password: password, phone: phone);
      await _startSession(session);
    } on ApiException catch (e) {
      if (e.kind == ApiErrorKind.conflict) {
        throw AuthFailure(
          AuthFailureKind.emailTaken,
          "Couldn't create the account",
          'This email is already registered. Log in instead.',
          fieldErrors: {
            'contact_email': ['This email is already registered.'],
          },
        );
      }
      throw _fromApi(e);
    }
  }

  /// Re-reads GET /auth/me (Settings profile header).
  Future<void> refreshUser() async {
    final me = await api.me();
    _user = me;
    await _saveUser(me);
    notifyListeners();
  }

  /// PATCH /auth/me. Not built on the API yet (#25): callers show the ApiException message.
  Future<void> updateProfile({required String fullName, String? phone}) async {
    final updated = await api.updateMe(fullName: fullName, phone: phone);
    _user = updated;
    await _saveUser(updated);
    notifyListeners();
  }

  Future<void> logout() async {
    await api.client.tokens.clear();
    _setSignedOut();
  }

  Future<void> _startSession(AuthSession session) async {
    await api.client.tokens.writeToken(session.token);
    await _saveUser(session.user);
    _user = session.user;
    _notice = null;
    _status = AuthStatus.signedIn;
    notifyListeners();
  }

  void _onUnauthorized(ApiException e) {
    if (_status != AuthStatus.signedIn) return;
    unawaited(api.client.tokens.clear());
    _setSignedOut(notice: e.isDeactivated ? AuthFailure.deactivated : AuthFailure.sessionExpired);
  }

  void _setSignedOut({AuthFailure? notice}) {
    _user = null;
    _status = AuthStatus.signedOut;
    _notice = notice;
    notifyListeners();
  }

  AuthFailure _fromApi(ApiException e) {
    switch (e.kind) {
      case ApiErrorKind.network:
      case ApiErrorKind.timeout:
        return AuthFailure(AuthFailureKind.network, "Couldn't reach RoadWatch", e.message);
      case ApiErrorKind.validation:
        return AuthFailure(
          AuthFailureKind.validation,
          'Check your details',
          e.message,
          fieldErrors: e.fieldErrors,
        );
      default:
        return AuthFailure(AuthFailureKind.other, 'Something went wrong', e.message);
    }
  }

  Future<void> _saveUser(AppUser user) => api.client.tokens.writeUserJson(jsonEncode(user.toJson()));

  Future<AppUser?> _readCachedUser() async {
    try {
      final raw = await api.client.tokens.readUserJson();
      if (raw == null) return null;
      return AppUser.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
    } catch (_) {
      return null;
    }
  }
}
