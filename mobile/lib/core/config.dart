/// Build-time configuration. Pass values with --dart-define, for example:
///
///   flutter run --dart-define=API_URL=https://your-api.onrender.com/api
///
/// The default reaches a local API from the Android emulator (10.0.2.2 is the host machine).
abstract final class AppConfig {
  static const String apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:5000/api');

  /// Shown on Settings > About.
  static const String appVersion = '1.1.0';

  /// Render's free tier sleeps when idle, so the first request can take up to a minute.
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);
}
