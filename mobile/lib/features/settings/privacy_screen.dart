import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Privacy. Figma (Mobile page 90:4): Settings/Privacy 177:2752.
///
/// Read-only summary of who can see the reporter's details (root CLAUDE.md section 11).
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  static const _items = [
    (
      RwIcons.lock,
      'Your phone number and email',
      'Only you, RoadWatch administrators, and the traffic officer assigned to your report. '
          'Never shown on the public website.',
    ),
    (
      RwIcons.users,
      'Your reports',
      'Administrators and the assigned officer can see them. The public website only shows verified '
          'accident records: type, area, date and status, never your name.',
    ),
    (
      RwIcons.shieldCheck,
      'Your password',
      'Stored as a secure hash. Nobody, including administrators, can read it.',
    ),
    (
      RwIcons.eye,
      'Your app settings',
      'Theme, language, notifications and reduce motion are saved on this phone only.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Privacy'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Semantics(
            header: true,
            child: Text('Who can see your details', style: RwType.h2.copyWith(color: c.textPrimary)),
          ),
          for (final (icon, title, body) in _items) ...[
            const SizedBox(height: RwSpace.s16),
            MergeSemantics(
              child: Container(
                padding: const EdgeInsets.all(RwSpace.s16),
                decoration: BoxDecoration(
                  color: c.surfaceWhite,
                  borderRadius: RwRadius.mdAll,
                  border: Border.all(color: c.borderSubtle),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RwIcon(icon, size: RwSize.iconLg, color: c.textPrimary),
                    const SizedBox(width: RwSpace.s16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: RwType.h3.copyWith(color: c.textPrimary)),
                          const SizedBox(height: RwSpace.s4),
                          Text(body, style: RwType.bodySm.copyWith(color: c.textPrimary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: RwSpace.s16),
          Text(
            'Questions? Use "Contact the administrator" in Settings.',
            style: RwType.bodySm.copyWith(color: c.textMuted),
          ),
        ],
      ),
    );
  }
}
