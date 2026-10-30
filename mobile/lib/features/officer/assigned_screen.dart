import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/services/location_service.dart';
import '../../core/state/settings_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import 'nearby_alerts.dart';

/// Traffic Officer home (#36). Figma (Mobile page 90:4): O1/Assigned/Default 323:2817, Empty 323:3010.
///
/// GET /officer/reports returns only the reports assigned to this officer. They are few, so the
/// app loads them in one request and filters by status on the phone. "All open" (the default) hides
/// Resolved/Closed and Rejected (issue #44). Tab body hosted by HomeShell (no back button).
///
/// v1.2.0 (Figma 537:4741): Sort by, Priority (Urgent first) by default (#54); the On duty switch (#57). While
/// On duty the app sends the latest location and checks for nearby alerts every 30 seconds (the tab stays alive
/// in HomeShell's IndexedStack); a new alert opens the "Accident reported near you" sheet.
class AssignedTab extends StatefulWidget {
  const AssignedTab({super.key});

  @override
  State<AssignedTab> createState() => _AssignedTabState();
}

/// Filter values besides the statuses themselves.
const _allOpen = 'open';
const _all = '';

const _sortPriority = 'priority';
const _sortNewest = 'newest';
const _checkEvery = Duration(seconds: 30);

class _AssignedTabState extends State<AssignedTab> {
  String _filter = _allOpen;
  String _sort = _sortPriority;
  List<Report> _items = const [];
  bool _loading = true;
  ApiException? _error;
  int _requestId = 0;

  bool _onDuty = false;
  bool _dutyBusy = false;
  String? _dutyError;
  Timer? _timer;
  bool _sheetOpen = false;
  final _seenAlerts = <int>{};

  // Parts the accessibility guide points at (#56).
  final _dutyKey = GlobalKey();
  final _filterKey = GlobalKey();
  final _sortKey = GlobalKey();
  final _listKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _load();
    _loadDuty();
    rwGuideStart.addListener(_guideRequested);
  }

  @override
  void dispose() {
    _timer?.cancel();
    rwGuideStart.removeListener(_guideRequested);
    super.dispose();
  }

  void _guideRequested() {
    if (mounted && TickerMode.valuesOf(context).enabled) _startGuide();
  }

  void _startGuide() {
    final settings = context.read<SettingsProvider?>();
    showRwGuideTour(
      context,
      readAloud: settings?.readAloud ?? false,
      readingSpeed: settings?.readingSpeed ?? 1.0,
      steps: [
        RwGuideStep(
          target: _dutyKey,
          title: 'On duty',
          text:
              'Switch it on to get reports near you. Your location is shared only while it is on. When an accident '
              'is reported near you, Respond takes it; the first officer to respond gets it.',
        ),
        RwGuideStep(
          target: _filterKey,
          title: 'Filter by status',
          text: 'All open hides Resolved/Closed and Rejected reports. Choose a status to see only those.',
        ),
        RwGuideStep(
          target: _sortKey,
          title: 'Sort by',
          text: 'Priority puts Urgent reports first. Newest first shows the latest reports on top.',
        ),
        RwGuideStep(
          target: _listKey,
          title: 'Your reports',
          text:
              'Only reports assigned to you, with their priority and status in words. Tap one to see the place, '
              'photos and reporter, and to update the investigation.',
        ),
      ],
    );
  }

  Future<void> _loadDuty() async {
    try {
      final onDuty = await context.read<RoadWatchApi>().duty();
      if (!mounted) return;
      setState(() => _onDuty = onDuty);
      if (onDuty) _startChecks();
    } catch (_) {
      // Off duty until the officer switches it on.
    }
  }

  Future<void> _setDuty(bool on) async {
    final api = context.read<RoadWatchApi>();
    setState(() {
      _dutyBusy = true;
      _dutyError = null;
    });
    try {
      if (on) {
        final where = await const LocationService().current();
        if (!where.ok) {
          setState(() {
            _dutyBusy = false;
            _dutyError = 'Allow location to go on duty: nearby alerts need to know where you are.';
          });
          return;
        }
        await api.setDuty(
          onDuty: true,
          latitude: where.position!.latitude,
          longitude: where.position!.longitude,
        );
      } else {
        await api.setDuty(onDuty: false);
      }
      if (!mounted) return;
      setState(() {
        _onDuty = on;
        _dutyBusy = false;
      });
      if (on) {
        _startChecks();
      } else {
        _timer?.cancel();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _dutyBusy = false;
        _dutyError = e.message;
      });
    }
  }

  void _startChecks() {
    _timer?.cancel();
    _check();
    _timer = Timer.periodic(_checkEvery, (_) => _check());
  }

  /// Sends the latest location, then asks for open nearby alerts.
  Future<void> _check() async {
    if (!mounted || !_onDuty) return;
    final api = context.read<RoadWatchApi>();
    try {
      final where = await const LocationService().current();
      if (where.ok) {
        await api.setDuty(
          onDuty: true,
          latitude: where.position!.latitude,
          longitude: where.position!.longitude,
        );
      }
      final alerts = await api.nearbyAlerts();
      if (!mounted || _sheetOpen) return;
      final next = alerts.where((a) => !_seenAlerts.contains(a.reportId)).firstOrNull;
      if (next != null) await _showAlert(next);
    } catch (_) {
      // Tried again on the next check.
    }
  }

  Future<void> _showAlert(NearbyAlert alert) async {
    _seenAlerts.add(alert.reportId);
    _sheetOpen = true;
    final respond = await showNearbyAlertSheet(context, alert);
    _sheetOpen = false;
    if (!mounted) return;
    final api = context.read<RoadWatchApi>();
    if (respond != true) {
      api.declineAlert(alert.reportId).catchError((_) {});
      return;
    }
    try {
      await api.respondToAlert(alert.reportId);
      if (!mounted) return;
      await Navigator.of(context).pushNamed(Routes.officerReport, arguments: alert.reportId);
      if (mounted) _load(showSkeleton: false);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isAlreadyTaken) {
        await showAlreadyTakenSheet(context, alert, e.fieldError('responder_name') ?? 'Another officer');
      } else {
        showRwToast(context, type: RwToastType.error, title: "Couldn't respond", message: e.message);
      }
    }
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

  List<Report> get _visible {
    final list = switch (_filter) {
      _allOpen =>
        _items.where((r) => r.status != Statuses.resolved && r.status != Statuses.rejected).toList(),
      _all => _items.toList(),
      _ => _items.where((r) => r.status == _filter).toList(),
    };
    // The API sends newest first; Priority puts Urgent first and keeps newest first within a level.
    if (_sort == _sortPriority) {
      final order = {for (var i = 0; i < list.length; i++) list[i].reportId: i};
      list.sort((a, b) {
        final byPriority = priorityRank(b.priority).compareTo(priorityRank(a.priority));
        return byPriority != 0 ? byPriority : order[a.reportId]!.compareTo(order[b.reportId]!);
      });
    }
    return list;
  }

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
      appBar: RwTopBar.inner(
        title: 'Assigned to me',
        action: RwTopBarAction(icon: RwIcons.accessibility, semanticLabel: 'Guide', onPressed: _startGuide),
      ),
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
    final duty = RwOnDutyCard(
      key: _dutyKey,
      onDuty: _onDuty,
      busy: _dutyBusy,
      error: _dutyError,
      onChanged: _setDuty,
    );
    final sort = RwSelect<String>(
      label: 'Sort by',
      value: _sort,
      items: const [
        RwSelectItem(_sortPriority, 'Priority (Urgent first)'),
        RwSelectItem(_sortNewest, 'Newest first'),
      ],
      onChanged: (v) => setState(() => _sort = v),
    );
    final filterSelect = RwSelect<String>(
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
    final filter = Column(
      children: [
        duty,
        gap,
        KeyedSubtree(key: _filterKey, child: filterSelect),
        gap,
        KeyedSubtree(key: _sortKey, child: sort),
      ],
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
      // Figma O1/Assigned/Empty: no filter while nothing is assigned (the On duty switch stays).
      return [
        duty,
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
              ? 'Every report assigned to you is Resolved/Closed or Rejected.'
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
        key: _listKey,
        liveRegion: true,
        child: Text(
          '$n $what · ${_sort == _sortPriority ? 'Urgent first' : 'newest first'}',
          style: RwType.label.copyWith(color: c.textMuted),
        ),
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
