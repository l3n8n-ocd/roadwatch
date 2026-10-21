import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// My reports (FR-06). Figma (Mobile page 90:4): M6/My reports/Default 116:1286, Empty 116:1456,
/// Loading 116:1506, Error 116:1581.
///
/// Status filter (RwSelect), pull to refresh, and paging (GET /reports?page=&status=) when the
/// list scrolls near its end. Tab body hosted by HomeShell (no back button).
class MyReportsTab extends StatefulWidget {
  const MyReportsTab({super.key});

  @override
  State<MyReportsTab> createState() => _MyReportsTabState();
}

class _MyReportsTabState extends State<MyReportsTab> {
  static const _pageSize = 20;

  /// '' = all statuses.
  String _status = '';
  List<Report> _items = const [];
  Pagination _pagination = const Pagination();
  bool _loading = true;
  bool _loadingMore = false;
  ApiException? _error;
  ApiException? _moreError;
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  RoadWatchApi get _api => context.read<RoadWatchApi>();

  /// Loads page 1. [showSkeleton] is false for pull to refresh (the indicator shows instead).
  Future<void> _load({bool showSkeleton = true}) async {
    final id = ++_requestId;
    setState(() {
      if (showSkeleton) _loading = true;
      _error = null;
      _moreError = null;
    });
    try {
      final page = await _api.myReports(page: 1, limit: _pageSize, status: _status.isEmpty ? null : _status);
      if (!mounted || id != _requestId) return;
      setState(() {
        _items = page.items;
        _pagination = page.pagination;
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

  Future<void> _loadMore() async {
    if (_loadingMore || _loading || !_pagination.hasMore || _moreError != null) return;
    final id = _requestId;
    setState(() => _loadingMore = true);
    try {
      final page = await _api.myReports(
        page: _pagination.page + 1,
        limit: _pageSize,
        status: _status.isEmpty ? null : _status,
      );
      if (!mounted || id != _requestId) return;
      setState(() {
        final seen = _items.map((r) => r.reportId).toSet();
        _items = [..._items, ...page.items.where((r) => !seen.contains(r.reportId))];
        _pagination = page.pagination;
        _loadingMore = false;
      });
    } on ApiException catch (e) {
      if (!mounted || id != _requestId) return;
      setState(() {
        _moreError = e;
        _loadingMore = false;
      });
    }
  }

  void _setStatus(String status) {
    if (status == _status) return;
    _status = status;
    _load();
  }

  Future<void> _openReport(Report r) async {
    await Navigator.of(context).pushNamed(Routes.tracking, arguments: r.reportId);
    // The status may have changed while the reporter was on the tracking screen.
    if (mounted) _load(showSkeleton: false);
  }

  bool _onScroll(ScrollNotification n) {
    if (n.metrics.pixels >= n.metrics.maxScrollExtent - 320) _loadMore();
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'My reports'),
      body: RefreshIndicator(
        color: c.textPrimary,
        backgroundColor: c.surfaceWhite,
        onRefresh: () => _load(showSkeleton: false),
        child: NotificationListener<ScrollNotification>(
          onNotification: _onScroll,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(RwSpace.s16),
            children: _children(c),
          ),
        ),
      ),
    );
  }

  List<Widget> _children(RwColors c) {
    final filtered = _status.isNotEmpty;
    final filter = _StatusFilter(value: _status, onChanged: _setStatus);
    const gap = SizedBox(height: RwSpace.s12);

    if (_loading) {
      return [
        filter,
        gap,
        RwSkeletonGroup(
          label: 'Loading your reports',
          child: Column(
            children: [
              for (var i = 0; i < 3; i++) ...[if (i > 0) gap, const RwSkeletonReportCard()],
            ],
          ),
        ),
      ];
    }

    if (_error != null && _items.isEmpty) {
      final network = _error!.kind == ApiErrorKind.network;
      return [
        filter,
        gap,
        network
            ? RwEmptyState.error(onAction: _load)
            : RwEmptyState.error(onAction: _load, message: _error!.message),
      ];
    }

    if (_items.isEmpty) {
      // Figma Empty: no filter when the reporter has no reports at all.
      return filtered
          ? [filter, gap, RwEmptyState.noResults(onAction: () => _setStatus(''))]
          : [RwEmptyState.noReports(onAction: () => Navigator.of(context).pushNamed(Routes.reportDetails))];
    }

    final total = _pagination.total > 0 ? _pagination.total : _items.length;
    return [
      filter,
      gap,
      Semantics(
        liveRegion: true,
        child: Text(
          '$total ${total == 1 ? 'report' : 'reports'}${filtered ? ' with status $_status' : ''}, newest first',
          style: RwType.label.copyWith(color: c.textMuted),
        ),
      ),
      // #41, M2: cards fade and rise one after another on first load (max 8 staggered).
      for (var i = 0; i < _items.length; i++) ...[
        gap,
        RwEntrance.listItem(
          key: ValueKey(_items[i].reportId),
          index: i,
          child: RwReportCard.fromReport(_items[i], onTap: () => _openReport(_items[i])),
        ),
      ],
      if (_loadingMore) ...[
        gap,
        Semantics(
          label: 'Loading more reports',
          liveRegion: true,
          child: Center(
            child: SizedBox(
              width: RwSize.iconLg,
              height: RwSize.iconLg,
              child: CircularProgressIndicator(strokeWidth: 2, color: c.textPrimary),
            ),
          ),
        ),
      ],
      if (_moreError != null) ...[
        gap,
        RwToast(type: RwToastType.error, title: "Couldn't load more reports", message: _moreError!.message),
        gap,
        RwButton.secondary(
          label: 'Try again',
          icon: RwIcons.refresh,
          onPressed: () {
            setState(() => _moreError = null);
            _loadMore();
          },
        ),
      ],
      const SizedBox(height: RwSpace.s16),
    ];
  }
}

/// Figma "Filter/status": Select with "All statuses" plus the 8 statuses.
class _StatusFilter extends StatelessWidget {
  const _StatusFilter({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return RwSelect<String>(
      label: 'Filter by status',
      value: value,
      hintText: 'All statuses',
      items: [const RwSelectItem('', 'All statuses'), for (final s in Statuses.all) RwSelectItem(s, s)],
      onChanged: onChanged,
    );
  }
}
