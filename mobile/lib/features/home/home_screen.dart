import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/state/auth_provider.dart';
import '../../core/state/notifications_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import 'home_shell.dart';

/// Home. Figma (Mobile page 90:4): M1/Home/Default 112:263, Empty 112:415, Loading 112:495, Dark 164:2704.
///
/// Tab body hosted by HomeShell: navy top bar with the bell, a greeting band with the prominent
/// "Report an Accident" card and the 911 shortcut, then the 3 newest reports (GET /reports).
class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

enum _Load { loading, ready, error }

class _HomeTabState extends State<HomeTab> {
  static const _recentCount = 3;

  _Load _state = _Load.loading;
  List<Report> _reports = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<RoadWatchApi?>();
    if (api == null) {
      setState(() => _state = _Load.ready);
      return;
    }
    if (_state != _Load.ready) setState(() => _state = _Load.loading);
    try {
      final page = await api.myReports(limit: _recentCount);
      if (!mounted) return;
      setState(() {
        _reports = page.items.take(_recentCount).toList();
        _state = _Load.ready;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _state = _Load.error;
      });
    }
  }

  Future<void> _startReport() async {
    await Navigator.of(context).pushNamed(Routes.reportDetails);
    // Back from the form (cancelled or sent): the list may have a new report.
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final unread = context.watch<NotificationsProvider?>()?.unread ?? 0;
    final name = context.select<AuthProvider?, String?>((a) => a?.user?.fullName);

    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: RwTopBar.home(
        unreadCount: unread,
        onNotifications: () => HomeShell.selectTab(context, RwTab.notifications),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: c.textPrimary,
        backgroundColor: c.surfaceWhite,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            _GreetingBand(name: name, onReport: _startReport),
            Padding(
              padding: const EdgeInsets.fromLTRB(RwSpace.s16, 20, RwSpace.s16, 20),
              child: _recent(context, c),
            ),
          ],
        ),
      ),
    );
  }

  Widget _recent(BuildContext context, RwColors c) {
    final hasReports = _state == _Load.ready && _reports.isNotEmpty;
    final header = ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 44),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text('Your recent reports', style: RwType.h3.copyWith(color: c.textPrimary)),
            ),
          ),
          if (hasReports)
            _TextLink(
              label: 'See all',
              semanticLabel: 'See all reports',
              onTap: () => HomeShell.selectTab(context, RwTab.myReports),
            ),
        ],
      ),
    );

    final Widget body = switch (_state) {
      _Load.loading => const RwSkeletonGroup(
        label: 'Loading your reports',
        child: Column(
          children: [
            RwSkeletonReportCard(),
            SizedBox(height: RwSpace.s12),
            RwSkeletonReportCard(),
          ],
        ),
      ),
      _Load.error => RwEmptyState.error(
        message: _error ?? 'Check your connection, then try again.',
        onAction: _load,
      ),
      _Load.ready when _reports.isEmpty => const RwEmptyState(
        icon: RwIcons.inbox,
        title: 'No reports yet',
        message: 'Reports you send appear here so you can follow their status.',
      ),
      _Load.ready => Column(
        children: [
          for (final r in _reports) ...[
            RwReportCard.fromReport(
              r,
              onTap: () => Navigator.of(context).pushNamed(Routes.tracking, arguments: r.reportId),
            ),
            if (r != _reports.last) const SizedBox(height: RwSpace.s12),
          ],
        ],
      ),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        header,
        const SizedBox(height: RwSpace.s12),
        body,
      ],
    );
  }
}

/// Navy band (street photo at 15 %): greeting, "Report an Accident" card, emergency shortcut.
class _GreetingBand extends StatelessWidget {
  const _GreetingBand({required this.name, required this.onReport});

  final String? name;
  final VoidCallback onReport;

  String _greeting() {
    final h = DateTime.now().hour;
    final part = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
    final first = (name ?? '').trim().split(RegExp(r'\s+')).first;
    return first.isEmpty ? part : '$part, $first';
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      color: c.brandNavy,
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.15,
              child: Image.asset(RwImages.heroStreet, fit: BoxFit.cover, excludeFromSemantics: true),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s8, RwSpace.s16, RwSpace.s24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  header: true,
                  child: Text(_greeting(), style: RwType.h2.copyWith(color: c.textInverse)),
                ),
                const SizedBox(height: RwSpace.s4),
                Text(
                  'Saw an accident? Report it while details are fresh.',
                  style: RwType.bodySm.copyWith(color: c.textInverseMuted),
                ),
                const SizedBox(height: RwSpace.s16),
                _ReportCta(onTap: onReport),
                const SizedBox(height: RwSpace.s16),
                const _EmergencyShortcut(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// CTA/Report an Accident (112:297): white card, amber icon tile, H2 title, chevron.
class _ReportCta extends StatelessWidget {
  const _ReportCta({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      onDark: true,
      semanticLabel: 'Report an Accident. About 2 minutes. GPS and photos optional.',
      excludeChildSemantics: true,
      builder: (context, s) => Container(
        constraints: const BoxConstraints(minHeight: 112),
        padding: const EdgeInsets.all(RwSpace.s16),
        decoration: BoxDecoration(
          color: s.active ? c.surfaceNavySubtle : c.surfaceWhite,
          borderRadius: RwRadius.mdAll,
          boxShadow: RwShadow.md,
        ),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(color: c.brandAmber, borderRadius: RwRadius.mdAll),
              alignment: Alignment.center,
              child: RwIcon(RwIcons.alertTriangle, size: 32, color: c.textPrimary),
            ),
            const SizedBox(width: RwSpace.s16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Report an Accident', style: RwType.h2.copyWith(color: c.textPrimary)),
                  const SizedBox(height: RwSpace.s4),
                  Text(
                    'About 2 minutes. GPS and photos optional.',
                    style: RwType.bodySm.copyWith(color: c.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(width: RwSpace.s16),
            RwIcon(RwIcons.chevronRight, size: RwSize.iconLg, color: c.textPrimary),
          ],
        ),
      ),
    );
  }
}

/// "Emergency? Call 911 first" (tel:911) + "Hotlines" (Settings > Emergency hotlines).
class _EmergencyShortcut extends StatelessWidget {
  const _EmergencyShortcut();

  Future<void> _call(BuildContext context) async {
    var ok = false;
    try {
      ok = await launchUrl(Uri.parse(Hotlines.emergency.tel));
    } catch (_) {
      ok = false;
    }
    if (!ok && context.mounted) {
      showRwToast(
        context,
        type: RwToastType.error,
        title: "Couldn't open the phone app",
        message: 'Dial 911 on your phone.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final style = RwType.label.copyWith(color: c.textDanger);
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceDangerSubtle,
        borderRadius: const BorderRadius.all(Radius.circular(RwSpace.s12)),
      ),
      child: Row(
        children: [
          Expanded(
            child: RwPressable(
              onTap: () => _call(context),
              onDark: true,
              borderRadius: const BorderRadius.all(Radius.circular(RwSpace.s12)),
              semanticLabel: 'Emergency? Call 911 first',
              excludeChildSemantics: true,
              builder: (context, s) => Container(
                constraints: const BoxConstraints(minHeight: RwSize.touch),
                padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s12, RwSpace.s8, RwSpace.s12),
                child: Row(
                  children: [
                    RwIcon(RwIcons.phone, size: RwSize.iconMd, color: c.textDanger),
                    const SizedBox(width: RwSpace.s12),
                    Expanded(child: Text('Emergency? Call 911 first', style: style)),
                  ],
                ),
              ),
            ),
          ),
          RwPressable(
            onTap: () => Navigator.of(context).pushNamed(Routes.hotlines),
            onDark: true,
            borderRadius: const BorderRadius.all(Radius.circular(RwSpace.s12)),
            semanticLabel: 'Emergency hotlines',
            excludeChildSemantics: true,
            builder: (context, s) => Container(
              constraints: const BoxConstraints(minHeight: RwSize.touch, minWidth: RwSize.touch),
              padding: const EdgeInsets.only(left: RwSpace.s8, right: RwSpace.s16),
              alignment: Alignment.center,
              child: Text(
                'Hotlines',
                style: style.copyWith(decoration: TextDecoration.underline, decorationColor: c.textDanger),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Underlined text/blue link with a 48 px touch target.
class _TextLink extends StatelessWidget {
  const _TextLink({required this.label, required this.onTap, this.semanticLabel});

  final String label;
  final String? semanticLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      semanticLabel: semanticLabel,
      excludeChildSemantics: semanticLabel != null,
      borderRadius: RwRadius.smAll,
      builder: (context, s) => Container(
        constraints: const BoxConstraints(minHeight: RwSize.touch, minWidth: RwSize.touch),
        alignment: Alignment.center,
        child: Text(
          label,
          style: RwType.label.copyWith(
            color: c.textBlue,
            decoration: TextDecoration.underline,
            decorationColor: c.textBlue,
          ),
        ),
      ),
    );
  }
}
