import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_icon_button.dart';

/// Building blocks of the report detail screens (Figma M6 tracking and O2 officer details):
/// white cards, section titles, icon + text meta rows, label/value pairs and a full-size photo viewer.

/// White card with the subtle border (Figma Summary card, timeline, details).
class RwCard extends StatelessWidget {
  const RwCard({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(RwSpace.s16),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: child,
    );
  }
}

/// H3 section title, announced as a heading.
class RwSectionTitle extends StatelessWidget {
  const RwSectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: Text(text, style: RwType.h3.copyWith(color: RwColors.of(context).textPrimary)),
  );
}

/// 16 px icon + muted small text (location, date and time).
class RwMetaRow extends StatelessWidget {
  const RwMetaRow({super.key, required this.icon, required this.text});
  final String icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: RwIcon(icon, size: RwSize.iconSm, color: c.textMuted),
        ),
        const SizedBox(width: RwSpace.s8),
        Expanded(
          child: Text(text, style: RwType.bodySm.copyWith(color: c.textMuted)),
        ),
      ],
    );
  }
}

/// Figma "Detail": muted label over a body-size value, read as one item.
class RwDetailItem extends StatelessWidget {
  const RwDetailItem({super.key, required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return MergeSemantics(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: RwType.label.copyWith(color: c.textMuted)),
          const SizedBox(height: 2),
          Text(value, style: RwType.body.copyWith(color: c.textPrimary)),
        ],
      ),
    );
  }
}

/// Full-size photo with pinch zoom and a labelled close button. Open with [show].
class RwPhotoViewer extends StatelessWidget {
  const RwPhotoViewer({super.key, required this.url, required this.label});
  final String url;
  final String label;

  static Future<void> show(BuildContext context, {required String url, required String label}) =>
      showDialog<void>(
        context: context,
        builder: (_) => RwPhotoViewer(url: url, label: label),
      );

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Dialog.fullscreen(
      backgroundColor: c.surfaceLightGray,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: RwSpace.s8, vertical: RwSpace.s8),
              child: Row(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: RwSpace.s8),
                      child: Semantics(
                        header: true,
                        child: Text(label, style: RwType.h3.copyWith(color: c.textPrimary)),
                      ),
                    ),
                  ),
                  RwIconButton(
                    icon: RwIcons.x,
                    semanticLabel: 'Close photo',
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            Expanded(
              child: InteractiveViewer(
                maxScale: 4,
                child: Center(
                  child: Image.network(
                    url,
                    semanticLabel: 'Accident photo, $label',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) =>
                        Text("Couldn't load this photo.", style: RwType.body.copyWith(color: c.textMuted)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
