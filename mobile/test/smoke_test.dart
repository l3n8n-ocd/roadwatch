import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:roadwatch_mobile/core/api/api_client.dart';
import 'package:roadwatch_mobile/core/api/api_exception.dart';
import 'package:roadwatch_mobile/core/api/models.dart';
import 'package:roadwatch_mobile/core/api/roadwatch_api.dart';
import 'package:roadwatch_mobile/core/api/token_storage.dart';
import 'package:roadwatch_mobile/core/constants.dart';
import 'package:roadwatch_mobile/core/format.dart';
import 'package:roadwatch_mobile/core/state/auth_provider.dart';
import 'package:roadwatch_mobile/core/state/notifications_provider.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/core/widgets/widgets.dart';
import 'package:roadwatch_mobile/features/home/home_shell.dart';

/// In-memory token storage (the keystore plugin is not available in unit tests).
class MemoryTokens extends TokenStorage {
  String? token;
  String? user;

  @override
  Future<String?> readToken() async => token;
  @override
  Future<void> writeToken(String t) async => token = t;
  @override
  Future<String?> readUserJson() async => user;
  @override
  Future<void> writeUserJson(String json) async => user = json;
  @override
  Future<void> clear() async => token = user = null;
}

/// API double: login answers with [loginRole], or fails with [loginError].
class FakeApi extends RoadWatchApi {
  FakeApi({this.loginRole = Roles.reporter, this.loginError})
    : super(ApiClient(tokenStorage: MemoryTokens()));

  final String loginRole;
  final ApiException? loginError;

  @override
  Future<AuthSession> login({required String email, required String password}) async {
    if (loginError != null) throw loginError!;
    return AuthSession(
      token: 'test-token',
      user: AppUser(userId: 7, fullName: 'Juan Dela Cruz', contactEmail: email, role: loginRole),
    );
  }

  @override
  Future<NotificationList> notifications() async => const NotificationList(items: [], unread: 3);
}

Widget themed(Widget child) => MaterialApp(
  theme: AppTheme.light(),
  home: Scaffold(body: child),
);

void main() {
  test('reportCode pads report_id like the web app', () {
    expect(reportCode(128), 'RW-000128');
    expect(formatAccidentDateTime('2026-10-17', '08:15:00'), 'Oct 17, 2026 · 08:15');
  });

  test('NewReport sends latitude and longitude only together', () {
    const withPin = NewReport(
      accidentTypeId: 1,
      accidentDate: '2026-10-17',
      accidentTime: '08:15',
      location: 'MacArthur Hwy',
      description: 'Two cars collided.',
      injury: 'none',
      latitude: 14.8,
      longitude: 120.8,
    );
    expect(withPin.toJson()['latitude'], 14.8);
    const noPin = NewReport(
      accidentTypeId: 1,
      accidentDate: '2026-10-17',
      accidentTime: '08:15',
      location: 'MacArthur Hwy',
      description: 'Two cars collided.',
      injury: 'none',
      latitude: 14.8,
    );
    expect(noPin.toJson().containsKey('latitude'), isFalse);
  });

  group('AuthProvider', () {
    test('signs in a Reporter and stores the token', () async {
      final api = FakeApi();
      final auth = AuthProvider(api);
      await auth.login(email: 'juan@example.com', password: 'secret123');
      expect(auth.isSignedIn, isTrue);
      expect(await api.client.tokens.readToken(), 'test-token');
    });

    test('rejects staff accounts on mobile and keeps no token', () async {
      final api = FakeApi(loginRole: Roles.officer);
      final auth = AuthProvider(api);
      await expectLater(
        auth.login(email: 'officer@example.com', password: 'secret123'),
        throwsA(isA<AuthFailure>().having((f) => f.kind, 'kind', AuthFailureKind.staffAccount)),
      );
      expect(auth.isSignedIn, isFalse);
      expect(await api.client.tokens.readToken(), isNull);
    });

    test('maps 401 to the Figma "Couldn\'t log in" message', () async {
      final auth = AuthProvider(
        FakeApi(
          loginError: const ApiException(
            kind: ApiErrorKind.unauthorized,
            message: 'Invalid email or password',
            statusCode: 401,
          ),
        ),
      );
      await expectLater(
        auth.login(email: 'juan@example.com', password: 'wrong-pass'),
        throwsA(isA<AuthFailure>().having((f) => f.title, 'title', "Couldn't log in")),
      );
    });
  });

  testWidgets('StatusChip shows the text for all 8 statuses', (tester) async {
    await tester.pumpWidget(
      themed(SingleChildScrollView(child: Column(children: [for (final s in Statuses.all) RwStatusChip(s)]))),
    );
    for (final s in Statuses.all) {
      expect(find.text(s), findsOneWidget);
    }
    expect(find.bySemanticsLabel('Status: Rejected'), findsOneWidget);
  });

  testWidgets('HomeShell switches tabs from the bottom nav', (tester) async {
    final api = FakeApi();
    await tester.pumpWidget(
      MultiProvider(
        providers: [ChangeNotifierProvider(create: (_) => NotificationsProvider(api))],
        child: MaterialApp(theme: AppTheme.light(), home: const HomeShell()),
      ),
    );
    await tester.pumpAndSettle();

    // Unread count from GET /notifications reaches the nav label for screen readers.
    expect(find.bySemanticsLabel(RegExp(r'^Notifications, 3 unread, tab 3 of 4')), findsOneWidget);

    await tester.tap(find.bySemanticsLabel(RegExp(r'^Settings, tab 4 of 4')));
    await tester.pumpAndSettle();
    expect(find.text('Settings: not built yet'), findsOneWidget);
  });
}
