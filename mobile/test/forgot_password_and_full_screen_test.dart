import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:roadwatch_mobile/core/api/api_client.dart';
import 'package:roadwatch_mobile/core/api/api_exception.dart';
import 'package:roadwatch_mobile/core/api/roadwatch_api.dart';
import 'package:roadwatch_mobile/core/api/token_storage.dart';
import 'package:roadwatch_mobile/core/state/auth_provider.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/core/widgets/widgets.dart';
import 'package:roadwatch_mobile/features/auth/forgot_password_screen.dart';
import 'package:roadwatch_mobile/features/auth/login_screen.dart';
import 'package:roadwatch_mobile/routes.dart';

// #37 Forgot password, #45 show/hide password, #46 full-screen photo viewer and map (Figma M0 396:*,
// 406:*), against a fake API.

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

ApiException _badCode() => ApiException.fromResponse(
  Response(
    requestOptions: RequestOptions(path: '/auth/reset-password'),
    statusCode: 400,
    data: {
      'success': false,
      'error': 'This code is wrong or has expired. Send a new code.',
      'details': {
        'reset_code': ['This code is wrong or has expired. Send a new code.'],
      },
    },
  ),
);

class _FakeApi extends RoadWatchApi {
  _FakeApi() : super(ApiClient(tokenStorage: _MemoryTokens()));

  final sentTo = <String>[];
  final resets = <Map<String, String>>[];

  @override
  Future<void> forgotPassword({required String email}) async => sentTo.add(email.trim());

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    resets.add({'email': email, 'code': code, 'password': newPassword});
    if (code.trim().toUpperCase() != 'K7Q2M9XP') throw _badCode();
  }
}

Widget _app(_FakeApi api, Widget home) => MultiProvider(
  providers: [
    Provider<RoadWatchApi>.value(value: api),
    ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider(api)),
  ],
  child: MaterialApp(
    theme: AppTheme.light(),
    home: home,
    onGenerateRoute: (s) => Routes.onGenerateRoute(s, signedIn: false),
  ),
);

void main() {
  testWidgets('RwPasswordField: the eye shows and hides the password (#45)', (tester) async {
    final controller = TextEditingController(text: 'secret123');
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: RwPasswordField(label: 'Password', controller: controller),
        ),
      ),
    );
    TextField field() => tester.widget<TextField>(find.byType(TextField));
    expect(field().obscureText, isTrue);
    await tester.tap(find.bySemanticsLabel('Show password'));
    await tester.pump();
    expect(field().obscureText, isFalse);
    expect(find.bySemanticsLabel('Hide password'), findsOneWidget);
    await tester.pump(const Duration(seconds: 10));
    expect(field().obscureText, isFalse, reason: 'no auto-hide');
    await tester.tap(find.bySemanticsLabel('Hide password'));
    await tester.pump();
    expect(field().obscureText, isTrue);
  });

  testWidgets('Forgot password: email, wrong code, new code, success back on Log in (#37)', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final api = _FakeApi();
    await tester.pumpWidget(_app(api, const LoginScreen()));

    await tester.enterText(find.byType(TextField).first, 'juan@example.com');
    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();
    expect(find.text('Forgot password'), findsOneWidget, reason: 'top bar title');
    expect(find.text('juan@example.com'), findsOneWidget, reason: 'email carried over from Log in');

    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle();
    expect(api.sentTo, ['juan@example.com']);
    expect(find.textContaining('If juan@example.com has a RoadWatch account'), findsOneWidget);

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'AAAAAAAA');
    await tester.enterText(fields.at(1), 'newpass123');
    await tester.enterText(fields.at(2), 'newpass123');
    await tester.tap(find.text('Change password'));
    await tester.pumpAndSettle();
    expect(find.text('This code is wrong or has expired. Send a new code.'), findsOneWidget);

    await tester.tap(find.text("Didn't get the code? Send a new one"));
    await tester.pumpAndSettle();
    expect(api.sentTo.length, 2);
    expect(find.text('New code sent'), findsOneWidget);
    expect(tester.widget<TextField>(fields.at(0)).controller!.text, isEmpty, reason: 'code field cleared');

    await tester.enterText(fields.at(0), 'k7q2m9xp');
    await tester.tap(find.text('Change password'));
    await tester.pumpAndSettle();
    expect(api.resets.last['password'], 'newpass123');
    expect(find.text('Log in'), findsWidgets, reason: 'back on Log in');
    expect(find.text('Password changed'), findsOneWidget);
    expect(find.text('Log in with your new password.'), findsOneWidget);
  });

  testWidgets('Forgot password: client checks before calling the API (#37)', (tester) async {
    final api = _FakeApi();
    await tester.pumpWidget(_app(api, const LoginScreen()));
    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle();
    expect(find.text('Enter your email.'), findsOneWidget);
    expect(api.sentTo, isEmpty);
  });

  testWidgets('Photo viewer: Photo 1 of 3, next and previous wrap around (#46)', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: ElevatedButton(
                onPressed: () => RwPhotoViewer.show(
                  context,
                  urls: const [
                    'https://example.test/1.jpg',
                    'https://example.test/2.jpg',
                    'https://example.test/3.jpg',
                  ],
                  captions: const ['Added Oct 17, 2026 · 08:42', null, null],
                ),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.text('Photo 1 of 3'), findsOneWidget);
    expect(find.text('Added Oct 17, 2026 · 08:42'), findsOneWidget);
    expect(find.text('Download'), findsNothing);
    await tester.tap(find.bySemanticsLabel('Next photo'));
    await tester.pumpAndSettle();
    expect(find.text('Photo 2 of 3'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('Previous photo'));
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Previous photo'));
    await tester.pumpAndSettle();
    expect(find.text('Photo 3 of 3'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('Close photo viewer'));
    await tester.pumpAndSettle();
    expect(find.text('Open'), findsOneWidget);
  });

  testWidgets('Expand map opens the full-screen map; Move the pin returns the point (#46)', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    LatLng? picked;
    const start = LatLng(14.8433, 120.8114);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Builder(
          builder: (context) => Scaffold(
            body: Column(
              children: [
                RwMap(
                  pin: start,
                  height: 240,
                  onExpand: () => RwFullScreenMap.show(
                    context,
                    title: 'Accident location',
                    pin: start,
                    address: 'MacArthur Hwy',
                  ),
                ),
                ElevatedButton(
                  onPressed: () async => picked = await RwFullScreenMap.pick(context, initial: start),
                  child: const Text('Move'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.bySemanticsLabel('Show the map full screen'));
    await tester.pumpAndSettle();
    expect(find.text('Accident location'), findsOneWidget);
    expect(find.text('MacArthur Hwy'), findsOneWidget);
    expect(find.text('Lat 14.8433 · Long 120.8114'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Show the map full screen'),
      findsNothing,
      reason: 'no Expand inside the full view',
    );
    await tester.tap(find.bySemanticsLabel('Back'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Move'));
    await tester.pumpAndSettle();
    expect(find.text('Drag the map so the pin sits on the accident spot.'), findsOneWidget);
    await tester.tap(find.text('Use this location'));
    await tester.pumpAndSettle();
    expect(picked, isNotNull);
    expect(picked!.latitude, closeTo(14.8433, 0.0001));
  });

  // Screenshots for comparing with Figma: RW_SHOTS=/some/dir flutter test <this file> --plain-name screenshots --update-goldens
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

    Future<void> shot(WidgetTester tester, String name) async {
      await tester.pumpAndSettle();
      await expectLater(find.byType(MaterialApp), matchesGoldenFile(Uri.file('$dir/$name.png')));
    }

    testWidgets('forgot password and full-screen views', skip: skip, (tester) async {
      tester.view.physicalSize = const Size(360 * 2, 800 * 2);
      tester.view.devicePixelRatio = 2;
      addTearDown(tester.view.reset);
      final api = _FakeApi();
      await tester.pumpWidget(_app(api, const LoginScreen()));
      await shot(tester, 'm0_login');
      await tester.pumpWidget(_app(api, const ForgotPasswordScreen(initialEmail: 'juan@example.com')));
      await shot(tester, 'm0_forgot_email');
      await tester.tap(find.text('Send code'));
      await tester.pumpAndSettle();
      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'K7Q2M9XB');
      await tester.enterText(fields.at(1), 'roadwatch2026');
      await tester.enterText(fields.at(2), 'roadwatch2026');
      await tester.tap(find.bySemanticsLabel('Show password').first);
      await tester.tap(find.text('Change password'));
      await shot(tester, 'm0_forgot_code_wrong');

      const pin = LatLng(14.8433, 120.8114);
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: RwFullScreenMap(
            title: 'RW-000128 location',
            pin: pin,
            address: 'MacArthur Hwy cor. Paseo del Congreso, Malolos',
            onOpenInMaps: () {},
          ),
        ),
      );
      await shot(tester, 'o2_map_full');
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: RwFullScreenMap(
            title: 'Move the pin',
            pin: pin,
            address: 'MacArthur Hwy cor. Paseo del Congreso, Malolos',
            pickPin: true,
            onOpenInMaps: null,
          ),
        ),
      );
      await shot(tester, 'm3_move_pin');
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const RwPhotoViewer(
            urls: ['https://example.test/1.jpg', 'https://example.test/2.jpg', 'https://example.test/3.jpg'],
            initialIndex: 1,
            captions: [null, 'Added Oct 17, 2026 · 08:42', null],
          ),
        ),
      );
      await shot(tester, 'photo_viewer');
    });
  });
}
