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
import 'package:roadwatch_mobile/core/widgets/widgets.dart';
import 'package:roadwatch_mobile/features/home/home_shell.dart';
import 'package:roadwatch_mobile/features/officer/assigned_screen.dart';
import 'package:roadwatch_mobile/features/officer/nearby_alerts.dart';
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

Map<String, dynamic> _json(
  int id,
  String status, {
  String type = 'Collision',
  String priority = 'Medium',
  Map<String, dynamic>? dispatch,
  String recordType = 'verified_record',
}) => {
  'report_id': id,
  'priority': priority,
  'priority_source': 'auto',
  'dispatch': ?dispatch,
  'report_status': status,
  'record_type': recordType,
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

  // Nearby on-duty officers (#57).
  bool onDuty = false;
  List<NearbyAlert> alerts = const [];
  String? confirmed;
  String? rejectedWith;

  @override
  Future<bool> duty() async => onDuty;

  @override
  Future<bool> setDuty({required bool onDuty, double? latitude, double? longitude}) async =>
      this.onDuty = onDuty;

  @override
  Future<List<NearbyAlert>> nearbyAlerts() async => alerts;

  @override
  Future<Report> confirmOnScene(int reportId, {String? remarks}) async {
    confirmed = '$reportId';
    return Report.fromJson({
      ...detail!,
      'report_status': Statuses.inProgress,
      'record_type': 'verified_record',
      'dispatch': {
        'state': 'confirmed',
        'responder': {'full_name': 'Rafael Santos'},
      },
    });
  }

  @override
  Future<Report> rejectOnScene(int reportId, {required String reason}) async {
    rejectedWith = reason;
    return Report.fromJson({
      ...detail!,
      'report_status': Statuses.rejected,
      'record_type': 'public_submission',
      'dispatch': {
        'state': 'rejected_on_scene',
        'responder': {'full_name': 'Rafael Santos'},
      },
    });
  }
}

const _alert = NearbyAlert(
  reportId: 132,
  priority: 'Urgent',
  accidentType: 'Pedestrian accident',
  location: 'Paseo del Congreso, Malolos',
  distanceKm: 1.2,
);

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
    expect(find.text('2 open reports · Urgent first'), findsOneWidget);
    expect(find.text('RW-000101'), findsNothing);
    expect(find.text('RW-000099'), findsNothing);

    await tester.tap(find.text('All open'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('All assigned to me').last);
    await tester.pumpAndSettle();
    expect(find.text('4 reports · Urgent first'), findsOneWidget);
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

  testWidgets('O1 sorts by priority (Urgent first) and shows the Priority chip (#54)', (tester) async {
    final api = _FakeApi()
      ..assigned = [
        Report.fromJson(_json(128, Statuses.assigned, priority: 'Low')),
        Report.fromJson(_json(124, Statuses.inProgress, type: 'Hit-and-run', priority: 'High')),
        Report.fromJson(_json(119, Statuses.assigned, type: 'Pedestrian accident', priority: 'Urgent')),
      ];
    await _pump(tester, const Scaffold(body: AssignedTab()), api);
    final codes = tester.widgetList<Text>(find.textContaining(RegExp(r'^RW-0'))).map((t) => t.data).toList();
    expect(codes, ['RW-000119', 'RW-000124', 'RW-000128']);
    expect(find.byWidgetPredicate((w) => w is RwPriorityChip && w.priority == 'Urgent'), findsOneWidget);
    expect(
      find.bySemanticsLabel(
        RegExp(r'Report RW-000119, Pedestrian accident, status Assigned, priority Urgent'),
      ),
      findsOneWidget,
    );

    await tester.tap(find.text('Priority (Urgent first)'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Newest first').last);
    await tester.pumpAndSettle();
    final newest = tester.widgetList<Text>(find.textContaining(RegExp(r'^RW-0'))).map((t) => t.data).toList();
    expect(newest, ['RW-000128', 'RW-000124', 'RW-000119']);
    expect(find.text('3 open reports · newest first'), findsOneWidget);
  });

  testWidgets('O1 shows the On duty switch (#57); off by default', (tester) async {
    final api = _FakeApi()..assigned = [Report.fromJson(_json(128, Statuses.assigned))];
    await _pump(tester, const Scaffold(body: AssignedTab()), api);
    expect(find.text('On duty'), findsOneWidget);
    expect(
      find.text('Nearby reports reach you. Your location is shared only while this is on.'),
      findsOneWidget,
    );
    expect(find.byType(RwOnDutyCard), findsOneWidget);
    expect(tester.widget<RwOnDutyCard>(find.byType(RwOnDutyCard)).onDuty, isFalse);
  });

  testWidgets('Nearby alert sheet: Respond or Not now; Already taken names who responded (#57)', (
    tester,
  ) async {
    bool? answer;
    await _pump(
      tester,
      Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: RwButton(
              label: 'Open',
              onPressed: () async => answer = await showNearbyAlertSheet(context, _alert),
            ),
          ),
        ),
      ),
      _FakeApi(),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.text('Accident reported near you'), findsOneWidget);
    expect(find.bySemanticsLabel('Priority: Urgent'), findsOneWidget);
    expect(find.text('Not yet verified'), findsOneWidget);
    expect(find.textContaining('1.2 km from you'), findsOneWidget);
    await tester.tap(find.widgetWithText(RwButton, 'Respond'));
    await tester.pumpAndSettle();
    expect(answer, isTrue);

    final context = tester.element(find.text('Open'));
    showAlreadyTakenSheet(context, _alert, 'Liza Manalo');
    await tester.pumpAndSettle();
    expect(find.text('Already taken'), findsOneWidget);
    expect(
      find.text(
        'Liza Manalo responded first to RW-000132 (Pedestrian accident, 1.2 km away). It’s no longer waiting for you.',
      ),
      findsOneWidget,
    );
    await tester.tap(find.widgetWithText(RwButton, 'OK'));
    await tester.pumpAndSettle();
    expect(find.text('Already taken'), findsNothing);
  });

  testWidgets('O2 responding: Confirm on scene makes it a verified record (#57)', (tester) async {
    final api = _FakeApi()
      ..detail = _json(
        132,
        Statuses.submitted,
        type: 'Pedestrian accident',
        priority: 'Urgent',
        recordType: 'public_submission',
        dispatch: {
          'state': 'responding',
          'responded_at': '2026-10-30T01:14:00Z',
          'distance_km': 1.2,
          'responder': {'full_name': 'Rafael Santos'},
        },
      );
    await _pump(tester, const OfficerReportScreen(reportId: 132), api);
    expect(find.text('You’re responding'), findsOneWidget);
    expect(find.byWidgetPredicate((w) => w is RwPriorityChip && w.priority == 'Urgent'), findsOneWidget);
    expect(find.widgetWithText(RwButton, 'Update status'), findsNothing, reason: 'confirm or reject first');

    await tester.tap(find.widgetWithText(RwButton, 'Confirm on scene'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(RwButton, 'Confirm on scene').last);
    await tester.pumpAndSettle();
    expect(api.confirmed, '132');
    expect(find.text('Confirmed on scene'), findsOneWidget);
    expect(find.text('You’re responding'), findsNothing);
    expect(find.widgetWithText(RwButton, 'Update status'), findsOneWidget);
  });

  testWidgets('O2 responding: Reject report needs a reason (#57)', (tester) async {
    final api = _FakeApi()
      ..detail = _json(
        132,
        Statuses.submitted,
        recordType: 'public_submission',
        dispatch: {
          'state': 'responding',
          'responder': {'full_name': 'Rafael Santos'},
        },
      );
    await _pump(tester, const OfficerReportScreen(reportId: 132), api);
    await tester.tap(find.widgetWithText(RwButton, 'Reject report'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(RwButton, 'Reject report').last);
    await tester.pumpAndSettle();
    expect(find.text('Give a reason (3 characters or more).'), findsOneWidget);
    expect(api.rejectedWith, isNull);
    await tester.enterText(find.byType(TextField).last, 'No accident at this spot.');
    await tester.tap(find.widgetWithText(RwButton, 'Reject report').last);
    await tester.pumpAndSettle();
    expect(api.rejectedWith, 'No accident at this spot.');
    expect(find.text('Report rejected'), findsOneWidget);
  });

  testWidgets('The ApiException flags ALREADY_TAKEN and carries the responder name', (tester) async {
    const e = ApiException(
      kind: ApiErrorKind.conflict,
      message: 'Liza Manalo responded first.',
      code: 'ALREADY_TAKEN',
      fieldErrors: {
        'responder_name': ['Liza Manalo'],
      },
    );
    expect(e.isAlreadyTaken, isTrue);
    expect(e.fieldError('responder_name'), 'Liza Manalo');
  });

  testWidgets('Assigned has a Guide button that starts a text tour (#56)', (tester) async {
    final api = _FakeApi()..assigned = [Report.fromJson(_json(128, Statuses.assigned))];
    await _pump(tester, const Scaffold(body: AssignedTab()), api);
    await tester.tap(find.bySemanticsLabel('Guide'));
    await tester.pumpAndSettle();
    expect(find.text('STEP 1 OF 4'), findsOneWidget);
    expect(find.text('On duty'), findsNWidgets(2));
    await tester.tap(find.widgetWithText(RwButton, 'Next'));
    await tester.pumpAndSettle();
    expect(find.text('STEP 2 OF 4'), findsOneWidget);
    expect(find.text('Filter by status'), findsNWidgets(2));
    await tester.tap(find.widgetWithText(RwButton, 'Back'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(RwButton, 'Close'));
    await tester.pumpAndSettle();
    expect(find.textContaining('STEP '), findsNothing);
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
      // v1.2.0 (#54, #56, #57; Figma 537:4741, 537:4936, 537:5070, 543:32820)
      _FakeApi v12() => _FakeApi()
        ..onDuty = true
        ..assigned = [
          Report.fromJson(_json(128, Statuses.assigned, priority: 'High')),
          Report.fromJson(
            _json(119, Statuses.additionalInfo, type: 'Pedestrian accident', priority: 'Urgent'),
          ),
          Report.fromJson(_json(124, Statuses.inProgress, type: 'Hit-and-run', priority: 'Medium')),
        ]
        ..detail = _json(
          132,
          Statuses.submitted,
          type: 'Collision',
          priority: 'Urgent',
          recordType: 'public_submission',
          dispatch: {
            'state': 'responding',
            'responded_at': '2026-10-30T01:14:00Z',
            'distance_km': 1.2,
            'responder': {'full_name': 'Rafael Santos'},
          },
        );
      testWidgets('v12 O1 duty priority $mode', skip: skip, (tester) async {
        await _pump(tester, const HomeShell(), v12(), size: const Size(360, 800), theme: theme());
        await shot(tester, 'v12_o1_duty_priority');
      });
      testWidgets('v12 alert sheet $mode', skip: skip, (tester) async {
        await _pump(tester, const HomeShell(), v12(), size: const Size(360, 800), theme: theme());
        showNearbyAlertSheet(tester.element(find.byType(AssignedTab)), _alert);
        await tester.pumpAndSettle();
        await shot(tester, 'v12_alert_sheet');
      });
      testWidgets('v12 O2 responding $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const OfficerReportScreen(reportId: 132),
          v12(),
          size: const Size(360, 1000),
          theme: theme(),
        );
        await shot(tester, 'v12_o2_responding');
      });
      testWidgets('v12 guide $mode', skip: skip, (tester) async {
        await _pump(tester, const HomeShell(), v12(), size: const Size(360, 800), theme: theme());
        await tester.tap(find.bySemanticsLabel('Guide'));
        await tester.pumpAndSettle();
        await shot(tester, 'v12_guide');
      });
      testWidgets('v12 accessibility $mode', skip: skip, (tester) async {
        await _pump(
          tester,
          const HomeShell(initialTab: RwTab.settings),
          v12(),
          size: const Size(360, 800),
          theme: theme(),
        );
        await tester.scrollUntilVisible(find.text('Guide, Read aloud and captions'), 300);
        await tester.tap(find.text('Guide, Read aloud and captions'));
        await tester.pumpAndSettle();
        await shot(tester, 'v12_accessibility');
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
