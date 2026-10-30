import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App language choices (Settings > Language). Translations are not built yet; the choice is
/// stored so screens can switch strings later.
enum AppLanguage {
  english('en', 'English'),
  filipino('fil', 'Filipino');

  const AppLanguage(this.code, this.label);
  final String code;
  final String label;
}

/// Device-only preferences (docs/DECISIONS.md #25, #26). No account or schema change.
class SettingsProvider extends ChangeNotifier {
  SettingsProvider([SharedPreferencesAsync? prefs]) : _prefsOverride = prefs;

  final SharedPreferencesAsync? _prefsOverride;
  SharedPreferencesAsync? _prefsLazy;

  // Created on first use so tests without the platform plugin can still build the app.
  SharedPreferencesAsync get _prefs => _prefsOverride ?? (_prefsLazy ??= SharedPreferencesAsync());

  static const _kTheme = 'rw.themeMode';
  static const _kLanguage = 'rw.language';
  static const _kReduceMotion = 'rw.reduceMotion';
  static const _kAlertStatus = 'rw.alerts.statusChanges';
  static const _kAlertInfo = 'rw.alerts.infoRequests';
  static const _kAlertAssignments = 'rw.alerts.newAssignments';
  static const _kReadAloud = 'rw.guide.readAloud';
  static const _kReadingSpeed = 'rw.guide.readingSpeed';

  /// Reading speeds for the guide's Read aloud (#56), shown as "0.75×", "1×", "1.25×".
  static const readingSpeeds = [0.75, 1.0, 1.25];

  ThemeMode _themeMode = ThemeMode.system;
  AppLanguage _language = AppLanguage.english;
  bool? _reduceMotion;
  bool _alertStatusChanges = true;
  bool _alertInfoRequests = true;
  bool _alertNewAssignments = true;
  bool _readAloud = false;
  double _readingSpeed = 1.0;

  /// System (default), Light or Dark.
  ThemeMode get themeMode => _themeMode;
  AppLanguage get language => _language;

  /// null = follow Android's "Remove animations" setting.
  bool? get reduceMotionOverride => _reduceMotion;
  bool get alertStatusChanges => _alertStatusChanges;
  bool get alertInfoRequests => _alertInfoRequests;

  /// Officers: show "assigned to you" alerts (O6).
  bool get alertNewAssignments => _alertNewAssignments;

  /// Accessibility guide (#56): speak each step as the officer or reporter moves through it. Off by default.
  bool get readAloud => _readAloud;
  double get readingSpeed => _readingSpeed;

  /// Whether animations should be reduced, combining the stored choice with the OS setting.
  bool reduceMotion(BuildContext context) =>
      _reduceMotion ?? MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  /// Reads stored values. Missing or unreadable values keep the defaults.
  Future<void> load() async {
    try {
      final theme = await _prefs.getString(_kTheme);
      _themeMode = ThemeMode.values.firstWhere((m) => m.name == theme, orElse: () => ThemeMode.system);
      final lang = await _prefs.getString(_kLanguage);
      _language = AppLanguage.values.firstWhere((l) => l.code == lang, orElse: () => AppLanguage.english);
      _reduceMotion = await _prefs.getBool(_kReduceMotion);
      _alertStatusChanges = await _prefs.getBool(_kAlertStatus) ?? true;
      _alertInfoRequests = await _prefs.getBool(_kAlertInfo) ?? true;
      _alertNewAssignments = await _prefs.getBool(_kAlertAssignments) ?? true;
      _readAloud = await _prefs.getBool(_kReadAloud) ?? false;
      final speed = await _prefs.getDouble(_kReadingSpeed);
      _readingSpeed = readingSpeeds.contains(speed) ? speed! : 1.0;
    } catch (_) {
      // Storage unavailable: keep defaults.
    }
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    await _save(() => _prefs.setString(_kTheme, mode.name));
  }

  Future<void> setLanguage(AppLanguage language) async {
    _language = language;
    notifyListeners();
    await _save(() => _prefs.setString(_kLanguage, language.code));
  }

  Future<void> setReduceMotion(bool value) async {
    _reduceMotion = value;
    notifyListeners();
    await _save(() => _prefs.setBool(_kReduceMotion, value));
  }

  Future<void> setAlertStatusChanges(bool value) async {
    _alertStatusChanges = value;
    notifyListeners();
    await _save(() => _prefs.setBool(_kAlertStatus, value));
  }

  Future<void> setAlertInfoRequests(bool value) async {
    _alertInfoRequests = value;
    notifyListeners();
    await _save(() => _prefs.setBool(_kAlertInfo, value));
  }

  Future<void> setAlertNewAssignments(bool value) async {
    _alertNewAssignments = value;
    notifyListeners();
    await _save(() => _prefs.setBool(_kAlertAssignments, value));
  }

  Future<void> setReadAloud(bool value) async {
    _readAloud = value;
    notifyListeners();
    await _save(() => _prefs.setBool(_kReadAloud, value));
  }

  Future<void> setReadingSpeed(double value) async {
    _readingSpeed = value;
    notifyListeners();
    await _save(() => _prefs.setDouble(_kReadingSpeed, value));
  }

  Future<void> _save(Future<void> Function() write) async {
    try {
      await write();
    } catch (_) {
      // Preference still applies for this session.
    }
  }
}
