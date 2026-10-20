import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/settings_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import 'appearance_screen.dart' show RadioGroupCard, RadioOptionRow;

/// Language. Figma (Mobile page 90:4): Settings/Language 162:2516.
///
/// SettingsProvider.setLanguage(English / Filipino), stored on this phone. Translations are not
/// built yet, so the screen says the app stays in English for now.
class LanguageScreen extends StatelessWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final settings = context.watch<SettingsProvider>();
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Language'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Semantics(
            header: true,
            child: Text('APP LANGUAGE', style: RwType.overline.copyWith(color: c.textBlue)),
          ),
          const SizedBox(height: RwSpace.s8),
          RadioGroupCard(
            children: [
              for (final lang in AppLanguage.values)
                RadioOptionRow(
                  icon: RwIcons.globe,
                  label: lang.label,
                  description: lang == AppLanguage.filipino ? 'Tagalog' : null,
                  selected: settings.language == lang,
                  onSelected: () => settings.setLanguage(lang),
                ),
            ],
          ),
          const SizedBox(height: RwSpace.s16),
          Text(
            'Changes menus, buttons and messages. Reports you already sent stay in the language you '
            'wrote them in. Saved on this phone only.',
            style: RwType.bodySm.copyWith(color: c.textMuted),
          ),
          if (settings.language != AppLanguage.english) ...[
            const SizedBox(height: RwSpace.s16),
            const RwToast(
              type: RwToastType.info,
              title: 'Filipino is coming soon',
              message: 'Your choice is saved. The app stays in English until the translation is ready.',
            ),
          ],
        ],
      ),
    );
  }
}
