import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api/roadwatch_api.dart';
import 'core/state/auth_provider.dart';
import 'core/state/notifications_provider.dart';
import 'core/state/settings_provider.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/tokens.dart';
import 'core/widgets/widgets.dart';
import 'features/report/report_draft.dart';
import 'routes.dart';

/// Root widget: providers, light/dark themes (#26), reduced motion, and the named routes.
class RoadWatchApp extends StatelessWidget {
  const RoadWatchApp({super.key, required this.api, required this.auth, required this.settings});

  final RoadWatchApi api;
  final AuthProvider auth;
  final SettingsProvider settings;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<RoadWatchApi>.value(value: api),
        ChangeNotifierProvider<AuthProvider>.value(value: auth),
        ChangeNotifierProvider<SettingsProvider>.value(value: settings),
        ChangeNotifierProvider(create: (_) => NotificationsProvider(api)),
        ChangeNotifierProvider(create: (_) => ReportDraft()),
      ],
      child: const _App(),
    );
  }
}

class _App extends StatefulWidget {
  const _App();

  @override
  State<_App> createState() => _AppState();
}

class _AppState extends State<_App> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  AuthStatus? _lastStatus;

  /// Resets the navigation stack whenever the user signs in or out.
  void _onAuthChanged(AuthStatus status) {
    if (_lastStatus == status) return;
    final previous = _lastStatus;
    _lastStatus = status;
    if (previous == null || status == AuthStatus.unknown) return;
    if (status == AuthStatus.signedOut) {
      context.read<NotificationsProvider>().clear();
      context.read<ReportDraft>().reset();
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _navigatorKey.currentState?.pushNamedAndRemoveUntil(
        status == AuthStatus.signedIn ? Routes.home : Routes.login,
        (_) => false,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final status = context.select<AuthProvider, AuthStatus>((a) => a.status);
    _onAuthChanged(status);

    return MaterialApp(
      title: 'RoadWatch',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: settings.themeMode,
      builder: (context, child) {
        // Settings > Reduce motion (follows Android by default): no animations, fades for pages.
        final reduce = settings.reduceMotion(context);
        final theme = Theme.of(context);
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: reduce),
          child: Theme(
            data: reduce
                ? theme.copyWith(
                    pageTransitionsTheme: const PageTransitionsTheme(
                      builders: {
                        TargetPlatform.android: _FadePageTransitionsBuilder(),
                        TargetPlatform.iOS: _FadePageTransitionsBuilder(),
                      },
                    ),
                  )
                : theme,
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
      // The splash shows until AuthProvider.restore() finishes; _onAuthChanged then replaces
      // the stack with /home or /login.
      home: const _Splash(),
      onGenerateRoute: (s) => Routes.onGenerateRoute(s, signedIn: context.read<AuthProvider>().isSignedIn),
    );
  }
}

class _FadePageTransitionsBuilder extends PageTransitionsBuilder {
  const _FadePageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) => FadeTransition(opacity: animation, child: child);
}

/// Shown while AuthProvider.restore() checks the stored session.
class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.brandNavy,
      body: Semantics(
        label: 'Loading RoadWatch',
        liveRegion: true,
        child: const Center(child: RwLogo()),
      ),
    );
  }
}
