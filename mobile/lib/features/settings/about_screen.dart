import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/roadwatch_api.dart';
import '../../core/config.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// About RoadWatch. Figma (Mobile page 90:4): Settings/About 164:2646.
///
/// Logo and description, then a definition list: version (AppConfig.appVersion), server status
/// (GET /health, as on the web W9 About page), privacy, map data and icon credits.
class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

enum _Server { checking, online, offline }

class _AboutScreenState extends State<AboutScreen> {
  _Server _server = _Server.checking;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    setState(() => _server = _Server.checking);
    bool ok;
    try {
      ok = await context.read<RoadWatchApi>().health();
    } catch (_) {
      ok = false;
    }
    if (mounted) setState(() => _server = ok ? _Server.online : _Server.offline);
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final server = switch (_server) {
      _Server.checking => 'Checking…',
      _Server.online => 'Online',
      _Server.offline => 'Not reachable right now. The server may be waking up.',
    };
    final items = [
      ('Version', '${AppConfig.appVersion} (Oct 2026)'),
      ('Server status', server),
      (
        'Privacy',
        'Your contact details are visible only to administrators and the officer assigned to your report.',
      ),
      ('Map data', '© OpenStreetMap contributors'),
      ('Icons', 'Lucide (ISC licence)'),
    ];

    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'About RoadWatch'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          Container(
            padding: const EdgeInsets.all(RwSpace.s16),
            decoration: BoxDecoration(
              color: c.surfaceWhite,
              borderRadius: RwRadius.mdAll,
              border: Border.all(color: c.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Figma: mark tile plus a navy wordmark on the white card (RwLogo's own wordmark
                // is drawn for navy bars, so only its mark is reused here).
                Semantics(
                  header: true,
                  label: 'RoadWatch',
                  excludeSemantics: true,
                  child: Row(
                    children: [
                      const RwLogo(showWordmark: false, markSize: 32),
                      const SizedBox(width: RwSpace.s12),
                      Text('RoadWatch', style: RwType.h3.copyWith(color: c.textPrimary)),
                    ],
                  ),
                ),
                const SizedBox(height: RwSpace.s12),
                Text(
                  'RoadWatch helps the public report road accidents everywhere and follow each report '
                  'until it is closed. A student project for IT 305 Advanced Web Development, BSIT 3I-G1, '
                  'Bulacan State University. It does not replace official emergency services.',
                  style: RwType.body.copyWith(color: c.textPrimary),
                ),
              ],
            ),
          ),
          const SizedBox(height: RwSpace.s16),
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: c.surfaceWhite,
              borderRadius: RwRadius.mdAll,
              border: Border.all(color: c.borderSubtle),
            ),
            child: Column(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  if (i > 0) Divider(height: 1, thickness: 1, color: c.borderSubtle),
                  _Item(
                    label: items[i].$1,
                    value: items[i].$2,
                    live: items[i].$1 == 'Server status',
                    onRetry: items[i].$1 == 'Server status' && _server == _Server.offline ? _check : null,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({required this.label, required this.value, this.live = false, this.onRetry});

  final String label;
  final String value;
  final bool live;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: RwSpace.s12),
      child: Row(
        children: [
          Expanded(
            child: MergeSemantics(
              child: Semantics(
                liveRegion: live,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: RwType.label.copyWith(color: c.textMuted)),
                    const SizedBox(height: 2),
                    Text(value, style: RwType.body.copyWith(color: c.textPrimary)),
                  ],
                ),
              ),
            ),
          ),
          if (onRetry != null)
            RwIconButton(icon: RwIcons.refresh, semanticLabel: 'Check the server again', onPressed: onRetry),
        ],
      ),
    );
  }
}
