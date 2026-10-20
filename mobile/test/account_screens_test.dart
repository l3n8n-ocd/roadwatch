// Widget tests for My reports, Tracking, Notifications and the Settings screens.
//
// Screenshots: RW_SHOTS=/some/dir flutter test test/account_screens_test.dart --update-goldens
// writes PNGs (light and dark) into that folder with the real fonts. Goldens are not committed;
// without RW_SHOTS the screenshot tests are skipped.
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
import 'package:roadwatch_mobile/core/state/settings_provider.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/features/my_reports/my_reports_screen.dart';
import 'package:roadwatch_mobile/features/my_reports/tracking_screen.dart';
import 'package:roadwatch_mobile/features/notifications/notifications_screen.dart';
import 'package:roadwatch_mobile/features/settings/about_screen.dart';
import 'package:roadwatch_mobile/features/settings/appearance_screen.dart';
import 'package:roadwatch_mobile/features/settings/change_password_screen.dart';
import 'package:roadwatch_mobile/features/settings/demo_video_screen.dart';
import 'package:roadwatch_mobile/features/settings/edit_profile_screen.dart';
import 'package:roadwatch_mobile/features/settings/hotlines_screen.dart';
import 'package:roadwatch_mobile/features/settings/how_to_report_screen.dart';
import 'package:roadwatch_mobile/features/settings/language_screen.dart';
import 'package:roadwatch_mobile/features/settings/privacy_screen.dart';
import 'package:roadwatch_mobile/features/settings/settings_screen.dart';

class _Tokens extends TokenStorage {
  String? token = 't';
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

const _juan = AppUser(
  userId: 7,
  fullName: 'Juan Dela Cruz',
  contactEmail: 'juan.reporter@example.com',
  contactPhone: '0917 555 0112',
  role: Roles.reporter,
);

Report _report(int id, String type, String status, String location, String date, String time) =>
    Report.fromJson({
      'report_id': id,
      'report_status': status,
      'record_type': RecordTypes.publicSubmission,
      'accident_date': date,
      'accident_time': time,
      'accident_location': location,
      'accident_description': 'A tricycle and a motorcycle collided at the junction. The road was wet.',
      'injury_information': 'injuries',
      'vehicles_involved': '1 tricycle, 1 motorcycle',
      'accidentType': {'type_name': type},
    });

final _reports = [
  _report(128, 'Collision', Statuses.underReview, 'MacArthur Hwy, Malolos', '2026-10-17', '08:15:00'),
  _report(121, 'Hit-and-run', Statuses.additionalInfo, 'DRT Hwy, Baliuag', '2026-10-14', '19:40:00'),
  _report(117, 'Vehicle rollover', Statuses.resolved, 'NLEX Northbound, Guiguinto', '2026-10-09', '06:05:00'),
  _report(
    109,
    'Pedestrian accident',
    Statuses.rejected,
    'Plaridel Bypass, Plaridel',
    '2026-10-02',
    '17:30:00',
  ),
];

final _tracking121 = Report.fromJson({
  'report_id': 121,
  'report_status': Statuses.additionalInfo,
  'record_type': RecordTypes.publicSubmission,
  'accident_date': '2026-10-14',
  'accident_time': '19:40:00',
  'accident_location': 'Doña Remedios Trinidad Hwy, Baliuag',
  'accident_description': 'A car hit a parked tricycle and drove away.',
  'injury_information': 'none',
  'official_remarks':
      "Please add a clear photo of the tricycle's plate number or body number, if you have one.",
  'accidentType': {'type_name': 'Hit-and-run'},
  'statusHistory': [
    {'history_id': 1, 'new_status': 'Submitted', 'changed_at': '2026-10-14T19:52:00'},
    {'history_id': 2, 'new_status': 'Under Review', 'changed_at': '2026-10-15T09:12:00'},
    {'history_id': 3, 'new_status': 'Verified', 'changed_at': '2026-10-15T13:50:00'},
    {
      'history_id': 4,
      'new_status': 'Assigned',
      'changed_at': '2026-10-15T14:05:00',
      'changedBy': {'full_name': 'Admin Person'},
    },
    {
      'history_id': 5,
      'new_status': 'Additional Information Required',
      'changed_at': '2026-10-16T10:20:00',
      'changedBy': {'full_name': 'Officer Rafael Santos'},
    },
  ],
});

class _FakeApi extends RoadWatchApi {
  _FakeApi({this.reports}) : super(ApiClient(tokenStorage: _Tokens()));

  List<Report>? reports;
  final notifs = <AppNotification>[
    AppNotification(
      notificationId: 1,
      reportId: 128,
      message: 'RW-000128 is now Under Review.',
      isRead: false,
      createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
    ),
    AppNotification(
      notificationId: 2,
      reportId: 121,
      message: 'RW-000121: the officer asked for more information.',
      isRead: false,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    AppNotification(
      notificationId: 3,
      reportId: 117,
      message: 'RW-000117 is Resolved/Closed.',
      isRead: true,
      createdAt: DateTime(2026, 10, 11, 16, 20),
    ),
  ];

  @override
  Future<Paged<Report>> myReports({int page = 1, int limit = 20, String? status}) async {
    if (reports == null) {
      throw const ApiException(kind: ApiErrorKind.network, message: "Can't reach RoadWatch.");
    }
    final items = reports!.where((r) => status == null || r.status == status).toList();
    return Paged(
      items: items,
      pagination: Pagination(page: 1, limit: limit, total: items.length, pages: 1),
    );
  }

  @override
  Future<Report> getReport(int reportId) async =>
      reportId == 121 ? _tracking121 : _reports.firstWhere((r) => r.reportId == reportId);

  @override
  Future<NotificationList> notifications() async =>
      NotificationList(items: List.of(notifs), unread: notifs.where((n) => !n.isRead).length);

  @override
  Future<void> markAllNotificationsRead() async {
    for (var i = 0; i < notifs.length; i++) {
      final n = notifs[i];
      notifs[i] = AppNotification(
        notificationId: n.notificationId,
        reportId: n.reportId,
        message: n.message,
        isRead: true,
        createdAt: n.createdAt,
      );
    }
  }

  @override
  Future<AppInfo> appInfo() async => const AppInfo();

  @override
  Future<bool> health() async => true;

  @override
  Future<AppUser> me() async => _juan;

  @override
  Future<AppUser> updateMe({required String fullName, String? phone}) async =>
      throw const ApiException(kind: ApiErrorKind.notFound, message: 'Not found.', statusCode: 404);

  @override
  Future<void> changePassword({required String currentPassword, required String newPassword}) async =>
      throw const ApiException(kind: ApiErrorKind.notFound, message: 'Not found.', statusCode: 404);
}

Future<AuthProvider> _signedIn(_FakeApi api) async {
  final auth = AuthProvider(api);
  await auth.restore();
  return auth;
}

Widget _app(
  Widget home, {
  required _FakeApi api,
  required AuthProvider auth,
  SettingsProvider? settings,
  NotificationsProvider? notifications,
  ThemeMode mode = ThemeMode.light,
}) {
  return MultiProvider(
    providers: [
      Provider<RoadWatchApi>.value(value: api),
      ChangeNotifierProvider<AuthProvider>.value(value: auth),
      ChangeNotifierProvider<SettingsProvider>.value(value: settings ?? SettingsProvider()),
      ChangeNotifierProvider<NotificationsProvider>.value(value: notifications ?? NotificationsProvider(api)),
    ],
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: mode,
      home: home,
      onGenerateRoute: (s) => MaterialPageRoute<void>(
        settings: s,
        builder: (_) => s.name == '/tracking'
            ? TrackingScreen(reportId: s.arguments as int)
            : Scaffold(body: Text('route ${s.name}')),
      ),
    ),
  );
}

void main() {
  testWidgets('My reports lists cards, filters by status and opens tracking', (tester) async {
    final api = _FakeApi(reports: _reports);
    await tester.pumpWidget(_app(const MyReportsTab(), api: api, auth: await _signedIn(api)));
    await tester.pumpAndSettle();
    expect(find.text('4 reports, newest first'), findsOneWidget);
    expect(find.text('Collision'), findsOneWidget);

    await tester.tap(find.text('All statuses'));
    await tester.pumpAndSettle();
    await tester.tap(
      find.descendant(of: find.byType(BottomSheet), matching: find.text(Statuses.underReview)),
    );
    await tester.pumpAndSettle();
    expect(find.text('1 report with status Under Review, newest first'), findsOneWidget);

    await tester.tap(find.bySemanticsLabel(RegExp(r'^Report RW-000128')));
    await tester.pumpAndSettle();
    expect(find.text('Report RW-000128'), findsOneWidget);
  });

  testWidgets('My reports shows the empty and error states', (tester) async {
    final api = _FakeApi(reports: const []);
    await tester.pumpWidget(_app(const MyReportsTab(), api: api, auth: await _signedIn(api)));
    await tester.pumpAndSettle();
    expect(find.text('No reports yet'), findsOneWidget);

    final failing = _FakeApi();
    await tester.pumpWidget(
      _app(
        const MyReportsTab(key: ValueKey(2)),
        api: failing,
        auth: await _signedIn(failing),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text("Couldn't load your reports"), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('Tracking shows remarks, roles (never staff names) and the timeline', (tester) async {
    final api = _FakeApi(reports: _reports);
    await tester.pumpWidget(_app(const TrackingScreen(reportId: 121), api: api, auth: await _signedIn(api)));
    await tester.pumpAndSettle();
    expect(find.text('Report RW-000121'), findsOneWidget);
    expect(find.text('The officer needs more information'), findsOneWidget);
    expect(find.text('Add photos'), findsOneWidget);
    expect(find.text('Public submission'), findsOneWidget);
    expect(find.textContaining('Traffic Officer'), findsOneWidget);
    expect(find.textContaining('Officer Rafael Santos'), findsNothing);
    expect(find.textContaining('Admin Person'), findsNothing);
    expect(find.text('CURRENT STATUS'), findsOneWidget);
  });

  testWidgets('Notifications: unread header, mark all as read, tap opens tracking', (tester) async {
    final api = _FakeApi(reports: _reports);
    final notifications = NotificationsProvider(api);
    await notifications.refresh();
    await tester.pumpWidget(
      _app(const NotificationsTab(), api: api, auth: await _signedIn(api), notifications: notifications),
    );
    await tester.pumpAndSettle();
    expect(find.text('2 unread'), findsOneWidget);
    expect(find.textContaining('Yesterday · '), findsOneWidget);

    await tester.tap(find.text('Mark all as read'));
    await tester.pumpAndSettle();
    expect(find.text('All caught up'), findsOneWidget);

    await tester.tap(find.text('RW-000128 is now Under Review.'));
    await tester.pumpAndSettle();
    expect(find.text('Report RW-000128'), findsOneWidget);
  });

  testWidgets('Settings shows the profile and confirms before logging out', (tester) async {
    final api = _FakeApi(reports: _reports);
    final auth = await _signedIn(api);
    await tester.pumpWidget(_app(const SettingsTab(), api: api, auth: auth));
    await tester.pumpAndSettle();
    expect(find.text('Juan Dela Cruz'), findsOneWidget);
    expect(find.text('JD'), findsOneWidget);

    await tester.scrollUntilVisible(find.text('Log out'), 200);
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    expect(find.text('Log out?'), findsOneWidget);
    // Cancel keeps the session.
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(auth.isSignedIn, isTrue);
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log out').last);
    await tester.pumpAndSettle();
    expect(auth.isSignedIn, isFalse);
  });

  testWidgets('Appearance switches the theme mode', (tester) async {
    final api = _FakeApi();
    final settings = SettingsProvider();
    await tester.pumpWidget(
      _app(const AppearanceScreen(), api: api, auth: await _signedIn(api), settings: settings),
    );
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();
    expect(settings.themeMode, ThemeMode.dark);
  });

  testWidgets('Change password validates, then shows the not-built-yet error', (tester) async {
    final api = _FakeApi();
    await tester.pumpWidget(_app(const ChangePasswordScreen(), api: api, auth: await _signedIn(api)));
    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'oldpassword');
    await tester.enterText(fields.at(1), 'abcdef');
    await tester.enterText(fields.at(2), 'abcde');
    await tester.pump();
    expect(find.text('Use at least 8 characters (6 so far).'), findsOneWidget);
    expect(find.text("Passwords don't match."), findsOneWidget);

    await tester.enterText(fields.at(1), 'abcdefgh');
    await tester.enterText(fields.at(2), 'abcdefgh');
    await tester.tap(find.text('Update password'));
    await tester.pumpAndSettle();
    expect(find.text("Couldn't update your password"), findsOneWidget);
  });

  testWidgets('Edit profile shows the not-built-yet error', (tester) async {
    final api = _FakeApi();
    await tester.pumpWidget(_app(const EditProfileScreen(), api: api, auth: await _signedIn(api)));
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();
    expect(find.text("Couldn't save your changes"), findsOneWidget);
  });

  testWidgets('Hotlines label every number for screen readers', (tester) async {
    final api = _FakeApi();
    await tester.pumpWidget(_app(const HotlinesScreen(), api: api, auth: await _signedIn(api)));
    expect(find.bySemanticsLabel('Call PNP, 117'), findsOneWidget);
    expect(find.bySemanticsLabel('Call emergency hotline, 911'), findsOneWidget);
    expect(find.bySemanticsLabel('Bureau of Fire Protection seal'), findsOneWidget);
  });

  testWidgets('Demo video without a URL says it is coming soon', (tester) async {
    final api = _FakeApi();
    await tester.pumpWidget(_app(const DemoVideoScreen(), api: api, auth: await _signedIn(api)));
    await tester.pumpAndSettle();
    expect(find.text('Video coming soon'), findsOneWidget);
  });

  group('screenshots', () {
    final dir = Platform.environment['RW_SHOTS'];
    final skip = dir == null || dir.isEmpty;

    setUpAll(() async {
      if (skip) return;
      Future<void> load(String family, List<String> files) async {
        final loader = FontLoader(family);
        for (final f in files) {
          loader.addFont(rootBundle.load('assets/fonts/$f'));
        }
        await loader.load();
      }

      await load('Inter', ['Inter-Regular.ttf', 'Inter-Medium.ttf', 'Inter-SemiBold.ttf']);
      await load('Poppins', ['Poppins-Bold.ttf']);
    });

    final screens = <String, Widget Function()>{
      'my_reports': () => const MyReportsTab(),
      'tracking_121': () => const TrackingScreen(reportId: 121),
      'tracking_128': () => const TrackingScreen(reportId: 128),
      'notifications': () => const NotificationsTab(),
      'settings': () => const SettingsTab(),
      'edit_profile': () => const EditProfileScreen(),
      'change_password': () => const ChangePasswordScreen(),
      'appearance': () => const AppearanceScreen(),
      'language': () => const LanguageScreen(),
      'how_to_report': () => const HowToReportScreen(),
      'about': () => const AboutScreen(),
      'privacy': () => const PrivacyScreen(),
      'hotlines': () => const HotlinesScreen(),
      'demo_video': () => const DemoVideoScreen(),
    };

    for (final mode in [ThemeMode.light, ThemeMode.dark]) {
      for (final entry in screens.entries) {
        testWidgets('${entry.key} ${mode.name}', skip: skip, (tester) async {
          tester.view.physicalSize = const Size(360 * 2, 800 * 2);
          tester.view.devicePixelRatio = 2;
          addTearDown(tester.view.reset);
          final api = _FakeApi(reports: _reports);
          final notifications = NotificationsProvider(api);
          await notifications.refresh();
          await tester.pumpWidget(
            _app(
              entry.value(),
              api: api,
              auth: await _signedIn(api),
              notifications: notifications,
              mode: mode,
            ),
          );
          await tester.pumpAndSettle();
          await expectLater(
            find.byType(MaterialApp),
            matchesGoldenFile(Uri.file('$dir/${entry.key}_${mode.name}.png')),
          );
        });
      }
    }
  });
}
