import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:roadwatch_mobile/core/api/api_client.dart';
import 'package:roadwatch_mobile/core/api/api_exception.dart';
import 'package:roadwatch_mobile/core/api/models.dart';
import 'package:roadwatch_mobile/core/api/roadwatch_api.dart';
import 'package:roadwatch_mobile/core/api/token_storage.dart';
import 'package:roadwatch_mobile/core/constants.dart';
import 'package:roadwatch_mobile/core/state/auth_provider.dart';
import 'package:roadwatch_mobile/core/state/notifications_provider.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/core/widgets/widgets.dart';
import 'package:roadwatch_mobile/features/auth/login_screen.dart';
import 'package:roadwatch_mobile/features/auth/register_screen.dart';
import 'package:roadwatch_mobile/features/home/home_screen.dart';
import 'package:roadwatch_mobile/features/report/report_confirmation_screen.dart';
import 'package:roadwatch_mobile/features/report/report_details_screen.dart';
import 'package:roadwatch_mobile/features/report/report_draft.dart';
import 'package:roadwatch_mobile/features/report/report_photos_screen.dart';
import 'package:roadwatch_mobile/routes.dart';

class _MemoryTokens extends TokenStorage {
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

Report _report(int id, String status) => Report.fromJson({
  'report_id': id,
  'report_status': status,
  'record_type': 'public_submission',
  'accident_date': '2026-10-17',
  'accident_time': '08:15:00',
  'accident_location': 'MacArthur Hwy, Malolos',
  'accident_description': 'Two vehicles collided.',
  'injury_information': 'injuries',
  'accidentType': {'type_name': 'Collision'},
});

class _FakeApi extends RoadWatchApi {
  _FakeApi() : super(ApiClient(tokenStorage: _MemoryTokens()));

  ApiException? loginError;
  ApiException? registerError;
  List<Report> reports = [];
  NewReport? created;

  @override
  Future<AuthSession> login({required String email, required String password}) async {
    if (loginError != null) throw loginError!;
    return AuthSession(
      token: 't',
      user: AppUser(userId: 1, fullName: 'Juan Dela Cruz', contactEmail: email, role: Roles.reporter),
    );
  }

  @override
  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    if (registerError != null) throw registerError!;
    return AuthSession(
      token: 't',
      user: AppUser(userId: 1, fullName: fullName, contactEmail: email, role: Roles.reporter),
    );
  }

  @override
  Future<Paged<Report>> myReports({int page = 1, int limit = 20, String? status}) async =>
      Paged(items: reports, pagination: const Pagination());

  @override
  Future<List<AccidentType>> accidentTypes() async => const [
    AccidentType(typeId: 1, typeName: 'Collision'),
    AccidentType(typeId: 2, typeName: 'Hit-and-run'),
  ];

  @override
  Future<Report> createReport(NewReport report) async {
    created = report;
    return _report(128, Statuses.submitted);
  }

  @override
  Future<NotificationList> notifications() async => const NotificationList(items: [], unread: 0);
}

Future<void> _pump(
  WidgetTester tester,
  Widget home, {
  _FakeApi? api,
  ReportDraft? draft,
  AuthProvider? auth,
  ThemeData? theme,
}) async {
  final a = api ?? _FakeApi();
  // A tall phone (360 dp wide) so the whole form is built.
  tester.view.physicalSize = const Size(1080, 4800);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<RoadWatchApi>.value(value: a),
        ChangeNotifierProvider<AuthProvider>.value(value: auth ?? AuthProvider(a)),
        ChangeNotifierProvider(create: (_) => NotificationsProvider(a)),
        ChangeNotifierProvider<ReportDraft>.value(value: draft ?? ReportDraft()),
      ],
      child: MaterialApp(
        theme: theme ?? AppTheme.light(),
        home: home,
        onGenerateRoute: (s) => Routes.onGenerateRoute(s, signedIn: true),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

/// Real Inter/Poppins metrics instead of the test font, so layout checks are meaningful.
Future<void> _loadFonts() async {
  Future<ByteData> bytes(String f) async => ByteData.sublistView(await File('assets/fonts/$f').readAsBytes());
  await (FontLoader('Inter')
        ..addFont(bytes('Inter-Regular.ttf'))
        ..addFont(bytes('Inter-Medium.ttf'))
        ..addFont(bytes('Inter-SemiBold.ttf')))
      .load();
  await (FontLoader('Poppins')..addFont(bytes('Poppins-Bold.ttf'))).load();
}

void main() {
  setUpAll(_loadFonts);

  testWidgets('Login: 401 shows the "Couldn\'t log in" banner', (tester) async {
    final api = _FakeApi()
      ..loginError = const ApiException(kind: ApiErrorKind.unauthorized, message: 'x', statusCode: 401);
    await _pump(tester, const LoginScreen(), api: api);

    await tester.tap(find.widgetWithText(RwButton, 'Log in'));
    await tester.pump();
    expect(find.text('Enter your email.'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'juan@example.com');
    await tester.enterText(find.byType(TextField).at(1), 'wrong-pass');
    await tester.tap(find.widgetWithText(RwButton, 'Log in'));
    await tester.pumpAndSettle();
    expect(find.text("Couldn't log in"), findsOneWidget);
    expect(find.text('Email or password is incorrect. Check both and try again.'), findsOneWidget);
  });

  testWidgets('Register: password length and taken email show inline errors', (tester) async {
    final api = _FakeApi()
      ..registerError = const ApiException(kind: ApiErrorKind.conflict, message: 'x', statusCode: 409);
    await _pump(tester, const RegisterScreen(), api: api);

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'Juan Dela Cruz');
    await tester.enterText(fields.at(1), 'juan.reporter@example.com');
    await tester.enterText(fields.at(3), '123456');
    await tester.tap(find.widgetWithText(RwButton, 'Create account'));
    await tester.pump();
    expect(find.text('Use at least 8 characters (6 so far).'), findsOneWidget);

    await tester.enterText(fields.at(3), '12345678');
    await tester.tap(find.widgetWithText(RwButton, 'Create account'));
    await tester.pumpAndSettle();
    expect(find.text('An account with this email already exists. Log in instead.'), findsOneWidget);
  });

  testWidgets('Home: recent reports, then the empty state', (tester) async {
    final api = _FakeApi()..reports = [_report(128, Statuses.underReview)];
    await _pump(tester, const Scaffold(body: HomeTab()), api: api);
    expect(find.text('Report an Accident'), findsOneWidget);
    expect(find.text('RW-000128'), findsOneWidget);
    expect(find.text('See all'), findsOneWidget);

    await _pump(
      tester,
      const Scaffold(body: HomeTab(key: ValueKey('empty'))),
      api: _FakeApi(),
    );
    expect(find.text('No reports yet'), findsOneWidget);
    expect(find.text('See all'), findsNothing);
  });

  testWidgets('Details: Next with empty fields shows the error summary', (tester) async {
    await _pump(tester, const ReportDetailsScreen());
    await tester.tap(find.text('Next: Location'));
    await tester.pumpAndSettle();
    expect(find.text('Fix 4 fields to continue'), findsOneWidget);
    expect(find.text('Choose an accident type.'), findsOneWidget);
    expect(find.text('Describe what happened in at least 10 characters.'), findsOneWidget);
  });

  testWidgets('Photos: submit creates the report and opens the confirmation', (tester) async {
    final api = _FakeApi();
    final draft = ReportDraft()
      ..accidentTypeId = 1
      ..accidentDate = DateTime(2026, 10, 17)
      ..accidentTime = '08:15'
      ..injury = 'injuries'
      ..location = 'MacArthur Hwy, Malolos'
      ..description = 'Two vehicles collided at the junction.';
    await _pump(tester, const ReportPhotosScreen(), api: api, draft: draft);
    expect(find.text('0 of 5 photos added'), findsOneWidget);

    await tester.tap(find.text('Submit report'));
    await tester.pumpAndSettle();
    expect(api.created?.accidentDate, '2026-10-17');
    expect(api.created?.location, 'MacArthur Hwy, Malolos');
    expect(find.text('Report sent'), findsOneWidget);
    expect(find.text('RW-000128'), findsOneWidget);
    expect(draft.accidentTypeId, isNull, reason: 'draft is reset after a successful submit');
  });

  testWidgets('Confirmation: photo upload failure banner', (tester) async {
    await _pump(
      tester,
      const ReportConfirmationScreen(
        args: ReportConfirmationArgs(reportId: 128, photoUploadFailed: true, failedPhotoCount: 1),
      ),
    );
    expect(find.text("1 photo didn't upload"), findsOneWidget);
    expect(find.text('Public submission'), findsOneWidget);
    expect(find.text('Submitted'), findsOneWidget);
  });
}
