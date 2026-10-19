import 'package:flutter/material.dart';

import 'app.dart';
import 'core/api/api_client.dart';
import 'core/api/roadwatch_api.dart';
import 'core/state/auth_provider.dart';
import 'core/state/settings_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final settings = SettingsProvider();
  await settings.load();

  final api = RoadWatchApi(ApiClient());
  final auth = AuthProvider(api);

  runApp(RoadWatchApp(api: api, auth: auth, settings: settings));

  // Checks the stored token (GET /auth/me); the splash shows until it finishes.
  await auth.restore();
}
