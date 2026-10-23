import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:roadwatch_mobile/core/api/api_client.dart';
import 'package:roadwatch_mobile/core/api/models.dart';
import 'package:roadwatch_mobile/core/api/roadwatch_api.dart';
import 'package:roadwatch_mobile/core/api/token_storage.dart';
import 'package:roadwatch_mobile/core/constants.dart';
import 'package:roadwatch_mobile/core/state/auth_provider.dart';
import 'package:roadwatch_mobile/core/state/notifications_provider.dart';
import 'package:roadwatch_mobile/core/state/settings_provider.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/core/widgets/widgets.dart';
import 'package:roadwatch_mobile/features/home/home_shell.dart';
import 'package:roadwatch_mobile/features/officer/assigned_screen.dart';
import 'package:roadwatch_mobile/features/officer/officer_report_screen.dart';
import 'package:roadwatch_mobile/routes.dart';

// Traffic Officer screens (#36, Figma O1-O6) against a fake API.
// Screenshots: RW_SHOTS=/some/dir flutter test test/officer_screens_test.dart --update-goldens
// (light and dark PNGs for comparing with Figma; skipped without RW_SHOTS).

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

const _officer = AppUser(
  userId: 7,
  fullName: 'Rafael Santos',
  contactEmail: 'r.santos@roadwatch.example',
  role: Roles.officer,
);

Map<String, dynamic> _json(int id, String status, {String type = 'Collision'}) => {
  'report_id': id,
  'report_status': status,
  'record_type': 'verified_record',
  'accident_date': '2026-10-17',
  'accident_time': '08:15:00',
  'accident_location': 'MacArthur Hwy, Malolos',
  'accident_description': 'A tricycle and a motorcycle collided at the junction.',
  'injury_information': 'injuries',
  'vehicles_involved': '1 tricycle, 1 motorcycle',
  'latitude': '14.8433000',
  'longitude': '120.8114000',
  'accidentType': {'type_name': type},
  'reporter': {
    'full_name': 'Juan Dela Cruz',
    'contact_phone': '0917 555 0112',
    'contact_email': 'juan@example.com',
  },
  'statusHistory': [
    {
      'history_id': 3,
      'new_status': status,
      'changed_at': '2026-10-17T01:45:00Z',
      'changedBy': {
        'full_name': 'Maria Cruz',
        'role': {'role_name': Roles.admin},
      },
    },
    {
      'history_id': 1,
      'new_status': Statuses.submitted,
      'changed_at': '2026-10-17T00:42:00Z',
      'changedBy': {
        'full_name': 'Juan Dela Cruz',
        'role': {'role_name': Roles.reporter},
      },
    },
  ],
};

class _FakeApi extends RoadWatchApi {
  _FakeApi() : super(ApiClient(tokenStorage: _MemoryTokens()));

  List<Report> assigned = [];
  Map<String, dynamic>? detail;
  ({String? status, String? remarks})? lastUpdate;

  @override
  Future<AppUser> me() async => _officer;

  @override
  Future<Paged<Report>> officerReports({int page = 1, int limit = 100, String? status}) async =>
      Paged(items: assigned, pagination: const Pagination());

  @override
  Future<Report> officerReport(int reportId) async => Report.fromJson(detail!);

  @override
  Future<Report> updateOfficerReport(int reportId, {String? status, String? remarks}) async {
    lastUpdate = (status: status, remarks: remarks);
    return Report.fromJson({...detail!, 'report_status': status ?? detail!['report_status']});
  }

  List<AppNotification> notificationItems = const [];

  @override
  Future<NotificationList> notifications() async =>
      NotificationList(items: notificationItems, unread: notificationItems.where((n) => !n.isRead).length);
}

Future<void> _pump(
  WidgetTester tester,
  Widget home,
  _FakeApi api, {
  Size size = const Size(360, 1600),
  ThemeData? theme,
  List<AppNotification> notifications = const [],
}) async {
  api.notificationItems = notifications;
  tester.view.physicalSize = size * 3;
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  final auth = AuthProvider(api);
  await api.client.tokens.writeToken('t');
  await auth.restore();
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<RoadWatchApi>.value(value: api),
        ChangeNotifierProvider<AuthProvider>.value(value: auth),
        ChangeNotifierProvider(create: (_) => NotificationsProvider(api)),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: theme ?? AppTheme.light(),
        home: home,
        onGenerateRoute: (s) => Routes.onGenerateRoute(s, signedIn: true),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  // flutter_map's tile cache asks path_provider for a folder; tests have no plugin, so answer with temp.
  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (call) async => Directory.systemTemp.path,
    );
  });

  testWidgets('An officer gets the 3 officer tabs and lands on Assigned (O1)', (tester) async {
    final api = _FakeApi()..assigned = [Report.fromJson(_json(128, Statuses.assigned))];
    await _pump(tester, const HomeShell(), api);
    expect(find.text('Assigned to me'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp(r'^Assigned, tab 1 of 3')), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp(r'^Settings, tab 3 of 3')), findsOneWidget);
    expect(find.text('Home'), findsNothing);
    expect(find.text('My reports'), findsNothing);
  });

  testWidgets('O1 hides Resolved/Closed and Rejected under "All open"; the filter shows them', (
    tester,
  ) async {
    final api = _FakeApi()
      ..assigned = [
        Report.fromJson(_json(128, Statuses.assigned)),
        Report.fromJson(_json(124, Statuses.inProgress, type: 'Hit-and-run')),
        Report.fromJson(_json(101, Statuses.resolved, type: 'Vehicle rollover')),
        Report.fromJson(_json(99, Statuses.rejected, type: 'Other')),
      ];
    await _pump(tester, const Scaffold(body: AssignedTab()), api);
    expect(find.text('2 open reports, newest first'), findsOneWidget);
    expect(find.text('RW-000101'), findsNothing);
    expect(find.text('RW-000099'), findsNothing);

    await tester.tap(find.text('All open'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('All assigned to me').last);
    await tester.pumpAndSettle();
    expect(find.text('4 reports, newest first'), findsOneWidget);
    expect(find.text('RW-000101'), findsOneWidget);
    expect(find.text('RW-000099'), findsOneWidget);
  });

  testWidgets('O1 empty state when nothing is assigned', (tester) async {
    await _pump(tester, const Scaffold(body: AssignedTab()), _FakeApi());
    expect(find.text('No reports assigned to you'), findsOneWidget);
    expect(find.widgetWithText(RwButton, 'Refresh'), findsOneWidget);
    expect(find.text('Filter by status'), findsNothing);
  });

  testWidgets('O2 shows the reporter contact, Open in Maps and who changed each status', (tester) async {
    final api = _FakeApi()..detail = _json(128, Statuses.assigned);
    await _pump(tester, const OfficerReportScreen(reportId: 128), api);
    expect(find.text('Report RW-000128'), findsOneWidget);
    expect(find.text('Juan Dela Cruz'), findsOneWidget);
    expect(find.text('0917 555 0112'), findsOneWidget);
    expect(find.widgetWithText(RwButton, 'Call reporter'), findsOneWidget);
    expect(find.widgetWithText(RwButton, 'Open in Maps'), findsOneWidget);
    expect(find.text('14.8433, 120.8114'), findsWidgets); // map chip + Coordinates detail
    await tester.scrollUntilVisible(
      find.textContaining('Maria Cruz (Admin)'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Maria Cruz (Admin)'), findsOneWidget);
    expect(find.textContaining('· Reporter'), findsOneWidget);
    expect(find.widgetWithText(RwButton, 'Update status'), findsOneWidget);
  });

  testWidgets('O3 saves a new status and O4 confirms it', (tester) async {
    final api = _FakeApi()..detail = _json(128, Statuses.assigned);
    await _pump(tester, const OfficerReportScreen(reportId: 128), api);

    await tester.tap(find.widgetWithText(RwButton, 'Update status'));
    await tester.pumpAndSettle();
    expect(find.text('New status'), findsOneWidget);
    expect(find.text('Official remarks'), findsOneWidget);

    await tester.enterText(find.byType(TextField).last, 'Spoke with both drivers on site.');
    await tester.tap(find.widgetWithText(RwButton, 'Save update'));
    await tester.pumpAndSettle();

    expect(api.lastUpdate?.status, Statuses.inProgress);
    expect(api.lastUpdate?.remarks, 'Spoke with both drivers on site.');
    expect(find.text('Update saved'), findsOneWidget);
    expect(find.text('Status is now In Progress. The reporter was notified.'), findsOneWidget);
    expect(find.text('New status'), findsNothing, reason: 'the sheet closed');
  });

  testWidgets('A Rejected report has no Update status button (issue #44)', (tester) async {
    final api = _FakeApi()..detail = _json(99, Statuses.rejected);
    await _pump(tester, const OfficerReportScreen(reportId: 99), api);
    expect(find.widgetWithText(RwButton, 'Update status'), findsNothing);
    expect(find.textContaining('An administrator rejected this report'), findsOneWidget);
  });

  testWidgets('O3 asks for a change before saving', (tester) async {
    final api = _FakeApi()..detail = _json(124, Statuses.inProgress);
    await _pump(tester, const OfficerReportScreen(reportId: 124), api);
    await tester.tap(find.widgetWithText(RwButton, 'Update status'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(RwButton, 'Save update'));
    await tester.pumpAndSettle();
    expect(find.text('Choose a new status or add official remarks.'), findsOneWidget);
    expect(api.lastUpdate, isNull);
  });

  testWidgets('O6 Settings shows the officer rows', (tester) async {
    final api = _FakeApi();
    await _pump(tester, const HomeShell(initialTab: RwTab.settings), api);
    expect(find.text('New assignments'), findsOneWidget);
    expect(find.text('How reporter contact details are protected'), findsOneWidget);
    expect(find.text('Traffic Officer'), findsOneWidget);
    expect(find.text('Status changes'), findsNothing);
    expect(find.text('How to report'), findsNothing);
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

    _FakeApi api() => _FakeApi()
      ..assigned = [
        Report.fromJson(_json(128, Statuses.assigned)),
        Report.fromJson(_json(124, Statuses.inProgress, type: 'Hit-and-run')),
        Report.fromJson(_json(119, Statuses.additionalInfo, type: 'Pedestrian accident')),
      ]
      ..detail = _json(128, Statuses.assigned);
    final alerts = [
      AppNotification(
        notificationId: 2,
        reportId: 128,
        message: 'Report #128 was assigned to you.',
        isRead: false,
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      AppNotification(
        notificationId: 1,
        reportId: 124,
        message: 'Report #124 was assigned to you.',
        isRead: true,
        createdAt: DateTime(2026, 10, 15, 17, 45),
      ),
    ];

    for (final dark in [false, true]) {
      final mode = dark ? 'dark' : 'light';
      ThemeData theme() => dark ? AppTheme.dark() : AppTheme.light();
      Future<void> shot(WidgetTester tester, String name) => expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile(Uri.file('$dir/officer_${name}_$mode.png')),
      );

      testWidgets('O1 assigned $mode', skip: skip, (tester) async {
        await _pump(tester, const HomeShell(), api(), size: const Size(360, 800), theme: theme());
        await shot(tester, 'o1_assigned');
      });
      testWidgets('O1 empty $mode', skip: skip, (tester) async {
        await _pump(tester, const HomeShell(), _FakeApi(), size: const Size(360, 800), theme: theme());
        await shot(tester, 'o1_empty');
      });
      testWidgets('O2 details $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const OfficerReportScreen(reportId: 128),
          api(),
          size: const Size(360, 2200),
          theme: theme(),
        );
        await shot(tester, 'o2_details');
      });
      testWidgets('O3 update sheet $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const OfficerReportScreen(reportId: 128),
          api(),
          size: const Size(360, 800),
          theme: theme(),
        );
        await tester.tap(find.widgetWithText(RwButton, 'Update status'));
        await tester.pumpAndSettle();
        await shot(tester, 'o3_update');
      });
      testWidgets('O4 saved $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const OfficerReportScreen(reportId: 128),
          api(),
          size: const Size(360, 800),
          theme: theme(),
        );
        await tester.tap(find.widgetWithText(RwButton, 'Update status'));
        await tester.pumpAndSettle();
        await tester.tap(find.widgetWithText(RwButton, 'Save update'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 600));
        await shot(tester, 'o4_saved');
      });
      testWidgets('O5 notifications $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const HomeShell(initialTab: RwTab.notifications),
          api(),
          size: const Size(360, 800),
          theme: theme(),
          notifications: alerts,
        );
        await shot(tester, 'o5_notifications');
      });
      testWidgets('O6 settings $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const HomeShell(initialTab: RwTab.settings),
          api(),
          size: const Size(360, 1400),
          theme: theme(),
        );
        await shot(tester, 'o6_settings');
      });
    }
  });
}
