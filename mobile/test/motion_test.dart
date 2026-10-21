import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:roadwatch_mobile/core/widgets/rw_motion.dart';

// Motion helpers (#41): content always ends fully visible, nothing loops forever, and Reduce motion
// turns entrances into a short fade with no movement.
Widget _host(Widget child, {bool reduce = false}) => MediaQuery(
  data: MediaQueryData(disableAnimations: reduce),
  child: Directionality(textDirection: TextDirection.ltr, child: child),
);

double _opacity(WidgetTester tester) => tester
    .widget<Opacity>(find.ancestor(of: find.text('Hello'), matching: find.byType(Opacity)).first)
    .opacity;

void main() {
  testWidgets('RwEntrance fades in after its delay and ends fully visible', (tester) async {
    await tester.pumpWidget(
      _host(const RwEntrance(delay: Duration(milliseconds: 300), child: Text('Hello'))),
    );
    expect(_opacity(tester), 0);
    await tester.pump(const Duration(milliseconds: 200));
    expect(_opacity(tester), 0, reason: 'still waiting for its delay');
    await tester.pumpAndSettle();
    expect(_opacity(tester), 1);
  });

  testWidgets('with Reduce motion RwEntrance is a 200 ms fade with no delay or movement', (tester) async {
    await tester.pumpWidget(
      _host(const RwEntrance(delay: Duration(seconds: 2), child: Text('Hello')), reduce: true),
    );
    expect(find.byType(Transform), findsNothing);
    await tester.pump(const Duration(milliseconds: 200));
    expect(_opacity(tester), 1);
  });

  testWidgets('RwPulse stops after its pulses (no endless animation)', (tester) async {
    await tester.pumpWidget(_host(const RwPulse(child: Text('Hello'))));
    await tester.pumpAndSettle();
    expect(find.text('Hello'), findsOneWidget);
    expect(tester.hasRunningAnimations, isFalse);
  });

  test('stagger caps at 8 items', () {
    expect(RwMotion.stagger(0), Duration.zero);
    expect(RwMotion.stagger(3), const Duration(milliseconds: 120));
    expect(RwMotion.stagger(20), const Duration(milliseconds: 280));
  });
}
