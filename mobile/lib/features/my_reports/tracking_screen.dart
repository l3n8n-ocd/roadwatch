import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Report tracking (FR-06). Figma (Mobile page 90:4): M6/Tracking/Under Review 118:1606,
/// Additional info required 118:1731.
///
/// GET /reports/:id: summary (status chip + record badge), the official remarks card when more
/// information is needed (with "Add photos"), the status timeline (actor role, never staff
/// names), the details the reporter sent, the map pin and the photos.
class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key, required this.reportId});

  /// report_id passed as the route argument.
  final int reportId;

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  Report? _report;
  ApiException? _error;
  bool _loading = true;
  bool _uploading = false;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  RoadWatchApi get _api => context.read<RoadWatchApi>();

  Future<void> _load({bool showSkeleton = true}) async {
    setState(() {
      if (showSkeleton) _loading = true;
      _error = null;
    });
    try {
      final r = await _api.getReport(widget.reportId);
      if (!mounted) return;
      setState(() {
        _report = r;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  /// Reporter's answer to "Additional Information Required": more photos for this report.
  Future<void> _addPhotos() async {
    final report = _report;
    if (report == null || _uploading) return;
    final room = PhotoRules.maxPerReport - report.photos.length;
    if (room <= 0) {
      showRwToast(
        context,
        type: RwToastType.warning,
        title: 'Photo limit reached',
        message: 'A report can have up to ${PhotoRules.maxPerReport} photos.',
      );
      return;
    }
    final limit = room < PhotoRules.maxPerUpload ? room : PhotoRules.maxPerUpload;
    List<XFile> picked;
    try {
      picked = await ImagePicker().pickMultiImage(limit: limit < 2 ? 2 : limit, imageQuality: 85);
    } catch (_) {
      if (!mounted) return;
      showRwToast(context, type: RwToastType.error, title: "Couldn't open your photos");
      return;
    }
    if (!mounted || picked.isEmpty) return;
    if (picked.length > limit) picked = picked.sublist(0, limit);

    final paths = <String>[];
    final skipped = <String>[];
    for (final f in picked) {
      final ext = f.path.split('.').last.toLowerCase();
      final size = await f.length();
      if (!PhotoRules.extensions.contains(ext) || size > PhotoRules.maxBytes) {
        skipped.add(f.name);
      } else {
        paths.add(f.path);
      }
    }
    if (!mounted) return;
    if (paths.isEmpty) {
      showRwToast(
        context,
        type: RwToastType.error,
        title: "These photos can't be added",
        message: 'Use JPG, PNG or WebP photos of 5 MB or less.',
      );
      return;
    }

    setState(() {
      _uploading = true;
      _progress = 0;
    });
    try {
      await _api.uploadPhotos(
        report.reportId,
        paths,
        onSendProgress: (sent, total) {
          if (mounted && total > 0) setState(() => _progress = sent / total);
        },
      );
      if (!mounted) return;
      showRwToast(
        context,
        type: RwToastType.success,
        title: paths.length == 1 ? 'Photo added' : '${paths.length} photos added',
        message: skipped.isEmpty
            ? 'The officer can see them now.'
            : '${skipped.length} skipped: use JPG, PNG or WebP photos of 5 MB or less.',
      );
      await _load(showSkeleton: false);
    } on ApiException catch (e) {
      if (!mounted) return;
      showRwToast(context, type: RwToastType.error, title: "Couldn't add the photos", message: e.message);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _openPhoto(Report r, int index) {
    RwPhotoViewer.show(
      context,
      urls: [for (final p in r.photos) p.url],
      initialIndex: index,
      captions: [
        for (final p in r.photos) p.uploadedAt == null ? null : 'Added ${formatDateTime(p.uploadedAt)}',
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    Widget body;
    if (_loading) {
      body = const _TrackingSkeleton();
    } else if (_report == null) {
      final e = _error;
      final notFound = e?.kind == ApiErrorKind.notFound;
      body = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          notFound
              ? RwEmptyState(
                  icon: RwIcons.search,
                  title: 'Report not found',
                  message: 'This report does not exist or belongs to another account.',
                  actionLabel: 'Back to My reports',
                  secondaryAction: true,
                  onAction: () => Navigator.of(context).maybePop(),
                )
              : RwEmptyState.error(
                  title: "Couldn't load this report",
                  message: e?.kind == ApiErrorKind.network
                      ? 'Check your connection, then try again.'
                      : (e?.message ?? 'Try again.'),
                  onAction: _load,
                ),
        ],
      );
    } else {
      body = _content(c, _report!);
    }
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: RwTopBar.inner(title: 'Report ${reportCode(widget.reportId)}'),
      body: RefreshIndicator(
        color: c.textPrimary,
        backgroundColor: c.surfaceWhite,
        onRefresh: () => _load(showSkeleton: false),
        child: body,
      ),
    );
  }

  Widget _content(RwColors c, Report r) {
    const gap = SizedBox(height: RwSpace.s16);
    final history = _historyFor(r);
    final needsInfo = r.status == Statuses.additionalInfo;
    final remarks = (r.officialRemarks ?? '').trim();
    final details = <(String, String)>[
      ('Injuries', injuryLabel(r.injury)),
      if ((r.vehiclesInvolved ?? '').trim().isNotEmpty) ('Vehicles involved', r.vehiclesInvolved!.trim()),
      ('What happened', r.description),
    ];

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(RwSpace.s16),
      children: [
        RwCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Semantics(
                header: true,
                child: Text(
                  r.accidentTypeName ?? 'Accident',
                  style: RwType.h2.copyWith(color: c.textPrimary),
                ),
              ),
              const SizedBox(height: RwSpace.s12),
              Wrap(
                spacing: RwSpace.s8,
                runSpacing: RwSpace.s8,
                children: [
                  // A status change cross-fades the chip (#41, M6).
                  AnimatedSwitcher(
                    duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : RwMotion.short,
                    child: KeyedSubtree(key: ValueKey(r.status), child: RwStatusChip(r.status)),
                  ),
                  RwRecordBadge.fromRecordType(r.recordType),
                ],
              ),
              const SizedBox(height: RwSpace.s12),
              RwMetaRow(icon: RwIcons.mapPin, text: r.location),
              const SizedBox(height: RwSpace.s12),
              RwMetaRow(icon: RwIcons.calendar, text: formatAccidentDateTime(r.accidentDate, r.accidentTime)),
            ],
          ),
        ),
        if (needsInfo) ...[
          gap,
          _ActionNeededCard(
            remarks: remarks,
            uploading: _uploading,
            progress: _progress,
            onAddPhotos: _addPhotos,
          ),
        ],
        gap,
        const RwSectionTitle('Status history'),
        const SizedBox(height: RwSpace.s12),
        RwCard(
          child: Column(
            children: [
              // History appears top to bottom, 60 ms apart (#41, M6).
              for (var i = 0; i < history.length; i++)
                RwEntrance(
                  delay: RwMotion.stagger(i, step: const Duration(milliseconds: 60)),
                  child: RwTimelineItem(
                    status: history[i].status,
                    meta: history[i].meta,
                    remarks: history[i].remarks,
                    current: i == 0,
                    last: i == history.length - 1,
                  ),
                ),
            ],
          ),
        ),
        gap,
        const RwSectionTitle('Details you sent'),
        const SizedBox(height: RwSpace.s12),
        RwCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < details.length; i++) ...[
                if (i > 0) const SizedBox(height: RwSpace.s12),
                RwDetailItem(label: details[i].$1, value: details[i].$2),
              ],
            ],
          ),
        ),
        if (r.hasLocation) ...[
          gap,
          const RwSectionTitle('Map location'),
          const SizedBox(height: RwSpace.s12),
          ClipRRect(
            borderRadius: RwRadius.mdAll,
            child: RwMap(
              pin: LatLng(r.latitude!, r.longitude!),
              height: 200,
              onExpand: () => RwFullScreenMap.show(
                context,
                title: 'Accident location',
                pin: LatLng(r.latitude!, r.longitude!),
                address: r.location,
              ),
            ),
          ),
        ],
        if (r.photos.isNotEmpty) ...[
          gap,
          RwSectionTitle('Photos (${r.photos.length})'),
          const SizedBox(height: RwSpace.s12),
          Wrap(
            spacing: RwSpace.s8,
            runSpacing: RwSpace.s12,
            children: [
              for (var i = 0; i < r.photos.length; i++)
                RwPhotoTile(
                  state: RwPhotoTileState.uploaded,
                  image: NetworkImage(r.photos[i].url),
                  caption: 'Photo ${i + 1} of ${r.photos.length}',
                  semanticLabel: 'Photo ${i + 1} of ${r.photos.length}, opens full size',
                  onTap: () => _openPhoto(r, i),
                ),
            ],
          ),
        ],
        const SizedBox(height: RwSpace.s24),
      ],
    );
  }
}

class _HistoryRow {
  const _HistoryRow(this.status, this.meta, this.remarks);
  final String status;
  final String meta;
  final String? remarks;
}

/// Who sets each status in the RoadWatch workflow (#30). The API sends staff names, which the
/// reporter must not see, so the role is derived from the status instead.
String _actorFor(String status) {
  switch (status) {
    case Statuses.submitted:
      return 'You';
    case Statuses.inProgress:
    case Statuses.additionalInfo:
    case Statuses.resolved:
      return 'Traffic Officer';
    default:
      return 'Administrator';
  }
}

/// Newest first. Falls back to the current status when the API sent no history.
List<_HistoryRow> _historyFor(Report r) {
  final remarks = (r.officialRemarks ?? '').trim();
  final entries = r.statusHistory.isNotEmpty
      ? r.statusHistory
      : [StatusHistoryEntry(historyId: 0, newStatus: r.status, changedAt: r.dateSubmitted)];
  return [
    for (var i = 0; i < entries.length; i++)
      _HistoryRow(
        entries[i].newStatus,
        [
          if (entries[i].changedAt != null) formatDateTime(entries[i].changedAt),
          _actorFor(entries[i].newStatus),
        ].join(' · '),
        i == 0 && remarks.isNotEmpty
            ? remarks
            : (entries[i].newStatus == Statuses.submitted ? 'Report received.' : null),
      ),
  ];
}

/// Figma "Action needed (official_remarks)": amber-subtle card with the officer's request.
class _ActionNeededCard extends StatelessWidget {
  const _ActionNeededCard({
    required this.remarks,
    required this.uploading,
    required this.progress,
    required this.onAddPhotos,
  });

  final String remarks;
  final bool uploading;
  final double progress;
  final VoidCallback onAddPhotos;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(RwSpace.s16),
      decoration: BoxDecoration(
        color: c.surfaceAmberSubtle,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.brandAmber),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: RwIcon(RwIcons.alertTriangle, size: RwSize.iconMd, color: c.textPrimary),
              ),
              const SizedBox(width: RwSpace.s8),
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(
                    'The officer needs more information',
                    style: RwType.button.copyWith(color: c.textPrimary),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: RwSpace.s12),
          Text(
            remarks.isEmpty ? 'Add clear photos that help the officer verify the accident.' : '"$remarks"',
            style: RwType.body.copyWith(color: c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s12),
          RwButton.secondary(
            label: uploading ? 'Uploading ${(progress * 100).round()}%' : 'Add photos',
            icon: RwIcons.camera,
            loading: uploading,
            onPressed: onAddPhotos,
          ),
        ],
      ),
    );
  }
}

class _TrackingSkeleton extends StatelessWidget {
  const _TrackingSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(RwSpace.s16),
      children: const [
        RwSkeletonGroup(
          label: 'Loading report',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RwCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RwSkeleton(width: 160, height: 28, radius: RwRadius.sm),
                    SizedBox(height: RwSpace.s12),
                    RwSkeleton(width: 120, height: 32),
                    SizedBox(height: RwSpace.s12),
                    RwSkeleton(width: 220),
                    SizedBox(height: RwSpace.s12),
                    RwSkeleton(width: 140),
                  ],
                ),
              ),
              SizedBox(height: RwSpace.s16),
              RwSkeleton(width: 140, height: 24, radius: RwRadius.sm),
              SizedBox(height: RwSpace.s12),
              RwCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RwSkeleton(width: 180, height: 20),
                    SizedBox(height: RwSpace.s12),
                    RwSkeleton(width: 220),
                    SizedBox(height: RwSpace.s24),
                    RwSkeleton(width: 180, height: 20),
                    SizedBox(height: RwSpace.s12),
                    RwSkeleton(width: 220),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
