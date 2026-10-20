import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Emergency hotlines. Figma (Mobile page 90:4): Settings/Emergency hotlines 252:2763.
///
/// 911, PNP and BFP (docs/ui-design/hotlines.md, #31). Every number is a tel: link with an
/// accessible name such as "Call PNP, 117"; the seals carry alt text.
class HotlinesScreen extends StatelessWidget {
  const HotlinesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Emergency hotlines'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Text(
            'Get help first, then report. Tap a number to call.',
            style: RwType.body.copyWith(color: c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s16),
          _HotlineCard(
            badge: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: c.surfaceDangerSubtle, borderRadius: RwRadius.smAll),
              child: RwIcon(RwIcons.alertTriangle, size: RwSize.iconLg, color: c.textPrimary),
            ),
            title: Hotlines.emergency.number,
            subtitle: 'Philippine National Emergency Hotline',
            callName: 'emergency hotline',
            numbers: const [Hotlines.emergency],
          ),
          const SizedBox(height: RwSpace.s16),
          _HotlineCard(
            badge: _Seal(asset: RwImages.pnpSeal, alt: 'Philippine National Police seal'),
            title: 'PNP',
            subtitle: 'Philippine National Police',
            callName: 'PNP',
            numbers: Hotlines.pnp,
          ),
          const SizedBox(height: RwSpace.s16),
          _HotlineCard(
            badge: _Seal(asset: RwImages.bfpSeal, alt: 'Bureau of Fire Protection seal'),
            title: 'BFP',
            subtitle: 'Bureau of Fire Protection',
            callName: 'BFP',
            numbers: Hotlines.bfp,
          ),
          const SizedBox(height: RwSpace.s16),
        ],
      ),
    );
  }
}

class _Seal extends StatelessWidget {
  const _Seal({required this.asset, required this.alt});
  final String asset;
  final String alt;

  @override
  Widget build(BuildContext context) =>
      Image.asset(asset, width: 40, height: 40, fit: BoxFit.contain, semanticLabel: alt);
}

class _HotlineCard extends StatelessWidget {
  const _HotlineCard({
    required this.badge,
    required this.title,
    required this.subtitle,
    required this.callName,
    required this.numbers,
  });

  final Widget badge;
  final String title;
  final String subtitle;

  /// Used in the accessible name: "Call PNP, 117".
  final String callName;
  final List<Hotline> numbers;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      padding: const EdgeInsets.all(RwSpace.s16),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              badge,
              const SizedBox(width: RwSpace.s12),
              Expanded(
                child: Semantics(
                  header: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: RwType.button.copyWith(color: c.textPrimary)),
                      Text(subtitle, style: RwType.bodySm.copyWith(color: c.textMuted)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          for (final h in numbers) ...[
            const SizedBox(height: RwSpace.s8),
            _CallRow(hotline: h, semanticLabel: 'Call $callName, ${h.number}'),
          ],
        ],
      ),
    );
  }
}

/// Figma "Call … (link: tel)": light-gray 48 px row, phone icon, number, chevron.
class _CallRow extends StatelessWidget {
  const _CallRow({required this.hotline, required this.semanticLabel});

  final Hotline hotline;
  final String semanticLabel;

  Future<void> _call(BuildContext context) async {
    var ok = false;
    try {
      ok = await launchUrl(Uri.parse(hotline.tel));
    } catch (_) {
      ok = false;
    }
    if (!ok && context.mounted) {
      showRwToast(
        context,
        type: RwToastType.error,
        title: "Couldn't open the phone app",
        message: 'Dial ${hotline.number} yourself.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: () => _call(context),
      semanticLabel: semanticLabel,
      excludeChildSemantics: true,
      borderRadius: RwRadius.smAll,
      builder: (context, s) => Container(
        constraints: const BoxConstraints(minHeight: RwSize.touch),
        padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12, vertical: RwSpace.s8),
        decoration: BoxDecoration(
          color: s.active ? c.surfaceNavySubtle : c.surfaceLightGray,
          borderRadius: RwRadius.smAll,
        ),
        child: Row(
          children: [
            RwIcon(RwIcons.phone, size: RwSize.iconMd, color: c.textPrimary),
            const SizedBox(width: RwSpace.s12),
            Expanded(
              child: Text(hotline.number, style: RwType.label.copyWith(color: c.textPrimary)),
            ),
            const SizedBox(width: RwSpace.s12),
            RwIcon(RwIcons.chevronRight, size: RwSize.iconMd, color: c.textPrimary),
          ],
        ),
      ),
    );
  }
}
