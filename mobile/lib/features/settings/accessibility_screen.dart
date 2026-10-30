import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/settings_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import 'appearance_screen.dart';

/// Settings/Accessibility (#56, Figma Mobile 543:32820). Start the guide (a text tour of the first tab), Read aloud
/// for the guide, the reading speed, and a note that every video has captions and a transcript.
/// Stored on this phone by SettingsProvider.
class AccessibilityScreen extends StatelessWidget {
  const AccessibilityScreen({super.key});

  static String speedLabel(double speed) => '${speed.toString().replaceAll(RegExp(r'\.0$'), '')}×';

  Future<void> _pickSpeed(BuildContext context, SettingsProvider settings) async {
    final c = RwColors.of(context);
    await showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      backgroundColor: c.surfaceLightGray,
      barrierColor: c.brandNavy.withValues(alpha: 0.55),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (sheet) => Padding(
        padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s24, RwSpace.s16, RwSpace.s24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Semantics(
              header: true,
              child: Text('Reading speed', style: RwType.h3.copyWith(color: c.textPrimary)),
            ),
            const SizedBox(height: RwSpace.s16),
            RadioGroupCard(
              children: [
                for (final speed in SettingsProvider.readingSpeeds)
                  RadioOptionRow(
                    icon: RwIcons.volume,
                    label: speedLabel(speed),
                    description: speed == 1.0 ? 'Normal' : (speed < 1 ? 'Slower' : 'Faster'),
                    selected: settings.readingSpeed == speed,
                    onSelected: () {
                      settings.setReadingSpeed(speed);
                      Navigator.of(sheet).pop();
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final settings = context.watch<SettingsProvider>();
    Widget group(String title, List<Widget> rows) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          header: true,
          child: Text(title, style: RwType.overline.copyWith(color: c.textMuted)),
        ),
        const SizedBox(height: RwSpace.s8),
        Container(
          decoration: BoxDecoration(
            color: c.surfaceWhite,
            borderRadius: RwRadius.mdAll,
            border: Border.all(color: c.borderSubtle),
          ),
          child: Column(children: rows),
        ),
      ],
    );
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Accessibility'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          group('GUIDE', [
            RwSettingsRow.navigation(
              icon: RwIcons.accessibility,
              label: 'Start the guide',
              description: 'Step-by-step tour of this screen, all in text',
              onTap: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
                rwGuideRequests.value++;
              },
            ),
            RwSettingsRow.toggle(
              icon: RwIcons.volume,
              label: 'Read aloud',
              description: 'Speaks the guide text as you move through the steps',
              switchValue: settings.readAloud,
              onSwitchChanged: settings.setReadAloud,
            ),
          ]),
          const SizedBox(height: RwSpace.s16),
          group('READING', [
            RwSettingsRow.navigation(
              icon: RwIcons.volume,
              label: 'Reading speed',
              value: speedLabel(settings.readingSpeed),
              onTap: () => _pickSpeed(context, settings),
            ),
            const RwSettingsRow.info(
              icon: RwIcons.playCircle,
              label: 'Videos',
              description: 'Captions and a full transcript are always available',
            ),
          ]),
          const SizedBox(height: RwSpace.s16),
          Text(
            'Nothing in RoadWatch depends on sound: every alert is shown on screen, and every video has captions '
            'and a transcript.',
            style: RwType.bodySm.copyWith(color: c.textMuted),
          ),
        ],
      ),
    );
  }
}
