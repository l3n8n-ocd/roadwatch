import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// Traffic Officer home (#36). Figma (Mobile page 90:4): O1/Assigned/Default 323:2817, Empty 323:3010.
///
/// GET /officer/reports returns only the reports assigned to this officer. They are few, so the
/// app loads them in one request and filters by status on the phone. "All open" (the default) hides
/// Resolved/Closed. Tab body hosted by HomeShell (no back button).
class AssignedTab extends StatefulWidget {
  const AssignedTab({super.key});

  @override
  State<AssignedTab> createState() => _AssignedTabState();
}

/// Filter values besides the statuses themselves.
const _allOpen = 'open';
const _all = '';

class _AssignedTabState extends State<AssignedTab> {
  String _filter = _allOpen;
  List<Report> _items = const [];
  bool _loading = true;
  ApiException? _error;
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool showSkeleton = true}) async {
    final id = ++_requestId;
    setState(() {
      if (showSkeleton) _loading = true;
      _error = null;
    });
    try {
      final page = await context.read<RoadWatchApi>().officerReports();
      if (!mounted || id != _requestId) return;
      setState(() {
        _items = page.items;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted || id != _requestId) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  List<Report> get _visible => switch (_filter) {
    _allOpen => _items.where((r) => r.status != Statuses.resolved).toList(),
    _all => _items,
    _ => _items.where((r) => r.status == _filter).toList(),
  };

  Future<void> _open(Report r) async {
    await Navigator.of(context).pushNamed(Routes.officerReport, arguments: r.reportId);
    // The officer may have changed the status on the details screen.
    if (mounted) _load(showSkeleton: false);
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Assigned to me'),
      body: RefreshIndicator(
        color: c.textPrimary,
        backgroundColor: c.surfaceWhite,
        onRefresh: () => _load(showSkeleton: false),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(RwSpace.s16),
          children: _children(c),
        ),
      ),
    );
  }

  List<Widget> _children(RwColors c) {
    const gap = SizedBox(height: RwSpace.s12);
    final filter = RwSelect<String>(
      label: 'Filter by status',
      value: _filter,
      items: [
        const RwSelectItem(_allOpen, 'All open'),
        const RwSelectItem(Statuses.assigned, Statuses.assigned),
        for (final s in Statuses.officerChoices) RwSelectItem(s, s),
        const RwSelectItem(_all, 'All assigned to me'),
      ],
      onChanged: (v) => setState(() => _filter = v),
    );

    if (_loading) {
      return [
        filter,
        gap,
        RwSkeletonGroup(
          label: 'Loading your assigned reports',
          child: Column(
            children: [
              for (var i = 0; i < 3; i++) ...[if (i > 0) gap, const RwSkeletonReportCard()],
            ],
          ),
        ),
      ];
    }

    if (_error != null && _items.isEmpty) {
      return [
        RwEmptyState.error(
          title: "Couldn't load your assigned reports",
          message: _error!.kind == ApiErrorKind.network
              ? 'Check your connection, then try again.'
              : _error!.message,
          onAction: _load,
        ),
      ];
    }

    if (_items.isEmpty) {
      // Figma O1/Assigned/Empty: no filter while nothing is assigned.
      return [
        const SizedBox(height: RwSpace.s48),
        RwEmptyState(
          icon: RwIcons.inbox,
          title: 'No reports assigned to you',
          message:
              'When an administrator verifies a report and assigns it to you, it shows up here and in '
              'Notifications.',
          actionLabel: 'Refresh',
          actionIcon: RwIcons.refresh,
          secondaryAction: true,
          onAction: _load,
        ),
      ];
    }

    final visible = _visible;
    if (visible.isEmpty) {
      return [
        filter,
        gap,
        RwEmptyState(
          icon: RwIcons.search,
          title: _filter == _allOpen ? 'No open reports' : 'No reports with this status',
          message: _filter == _allOpen
              ? 'Every report assigned to you is Resolved/Closed.'
              : 'Choose another status to see the rest of your reports.',
          actionLabel: 'Show all assigned to me',
          secondaryAction: true,
          onAction: () => setState(() => _filter = _all),
        ),
      ];
    }

    final n = visible.length;
    final what = switch (_filter) {
      _allOpen => n == 1 ? 'open report' : 'open reports',
      _all => n == 1 ? 'report' : 'reports',
      _ => '${n == 1 ? 'report' : 'reports'} with status $_filter',
    };
    return [
      filter,
      gap,
      Semantics(
        liveRegion: true,
        child: Text('$n $what, newest first', style: RwType.label.copyWith(color: c.textMuted)),
      ),
      // #41, M2: cards fade and rise one after another on first load (max 8 staggered).
      for (var i = 0; i < n; i++) ...[
        gap,
        RwEntrance.listItem(
          key: ValueKey(visible[i].reportId),
          index: i,
          child: RwReportCard.fromReport(visible[i], onTap: () => _open(visible[i])),
        ),
      ],
      const SizedBox(height: RwSpace.s16),
    ];
  }
}
