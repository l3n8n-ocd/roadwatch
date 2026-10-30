// "Built with" logos on About (#49): every tile names its tool, every logo file is bundled, and one-color
// logos switch to their white version in dark mode.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:roadwatch_mobile/core/theme/app_theme.dart';
import 'package:roadwatch_mobile/core/widgets/widgets.dart';

void main() {
  final tools = [for (final (_, list) in rwBuiltWith) ...list];

  test('29 tools, each logo bundled in both themes', () async {
    expect(tools, hasLength(29));
    for (final t in tools) {
      for (final b in Brightness.values) {
        final data = await rootBundle.load(t.assetFor(b));
        expect(data.lengthInBytes, greaterThan(0), reason: t.assetFor(b));
      }
    }
    expect(
      const RwTool('Express', 'express.svg', dark: true).assetFor(Brightness.dark),
      'assets/logos/express-dark.svg',
    );
    expect(const RwTool('React', 'react.svg').assetFor(Brightness.dark), 'assets/logos/react.svg');
  });

  testWidgets('tiles show the tool names and group headings; logos are hidden from screen readers', (
    tester,
  ) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: const Scaffold(body: SingleChildScrollView(child: RwBuiltWith())),
      ),
    );
    await tester.pumpAndSettle();
    for (final name in ['Figma', 'Recharts', 'PDFKit', 'Nominatim', 'Aiven', 'GitHub Actions', 'Namecheap']) {
      expect(find.text(name), findsOneWidget, reason: name);
    }
    for (final group in [
      'Design',
      'Website',
      'Android app',
      'API',
      'Data and services',
      'Hosting and delivery',
    ]) {
      expect(find.bySemanticsLabel(group), findsOneWidget, reason: group);
    }
    handle.dispose();
  });
}
