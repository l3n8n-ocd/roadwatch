import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Traffic Officer report details (#36). Figma (Mobile page 90:4): O2/Report details/Assigned 324:3382,
/// O3/Update status (bottom sheet) 325:3328, O4/Update saved (toast) 325:3567.
///
/// GET /officer/reports/:id (404 unless the report is assigned to this officer). Shows the summary,
/// the location with "Open in Maps", the reporter's contact with "Call reporter" (allowed because the
/// report is assigned to this officer), the accident details, photos and the status history with
/// who made each change. "Update status" stays fixed at the bottom and opens the O3 sheet.
class OfficerReportScreen extends StatefulWidget {
  const OfficerReportScreen({super.key, required this.reportId});

  /// report_id passed as the route argument.
  final int reportId;

  @override
  State<OfficerReportScreen> createState() => _OfficerReportScreenState();
}

class _OfficerReportScreenState extends State<OfficerReportScreen> {
  Report? _report;
  ApiException? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool showSkeleton = true}) async {
    setState(() {
      if (showSkeleton) _loading = true;
      _error = null;
    });
    try {
      final r = await context.read<RoadWatchApi>().officerReport(widget.reportId);
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

  Future<void> _openInMaps(Report r) async {
    final label = Uri.encodeComponent('Report ${reportCode(r.reportId)}');
    final query = r.hasLocation ? '${r.latitude},${r.longitude}' : Uri.encodeComponent(r.location);
    final geo = r.hasLocation
        ? Uri.parse('geo:${r.latitude},${r.longitude}?q=${r.latitude},${r.longitude}($label)')
        : Uri.parse('geo:0,0?q=$query');
    final web = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    var ok = false;
    try {
      ok = await launchUrl(geo, mode: LaunchMode.externalApplication);
      if (!ok) ok = await launchUrl(web, mode: LaunchMode.externalApplication);
    } catch (_) {
      ok = false;
    }
    if (!ok && mounted) {
      showRwToast(
        context,
        type: RwToastType.error,
        title: "Couldn't open a maps app",
        message: r.hasLocation ? 'Coordinates: ${_coords(r)}' : 'Location: ${r.location}',
      );
    }
  }

  Future<void> _call(String phone) async {
    final digits = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    var ok = false;
    try {
      ok = await launchUrl(Uri.parse('tel:$digits'));
    } catch (_) {
      ok = false;
    }
    if (!ok && mounted) {
      showRwToast(context, type: RwToastType.error, title: "Couldn't open the phone app", message: phone);
    }
  }

  Future<void> _updateStatus(Report r) async {
    final updated = await showModalBottomSheet<Report>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: false,
      backgroundColor: RwColors.of(context).surfaceWhite,
      barrierColor: RwColors.of(context).brandNavy.withValues(alpha: 0.55),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _UpdateStatusSheet(report: r, api: context.read<RoadWatchApi>()),
    );
    if (updated == null || !mounted) return;
    final statusChanged = updated.status != r.status;
    setState(() => _report = updated);
    // O4: success toast, the reporter is told in the app and by email.
    showRwToast(
      context,
      type: RwToastType.success,
      title: 'Update saved',
      message: statusChanged
          ? 'Status is now ${updated.status}. The reporter was notified.'
          : 'Your remarks were saved. The reporter can see them when tracking the report.',
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final report = _report;
    Widget body;
    if (_loading) {
      body = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(RwSpace.s16),
        children: const [
          RwSkeletonGroup(
            label: 'Loading report',
            child: Column(
              children: [
                RwSkeletonReportCard(),
                SizedBox(height: RwSpace.s16),
                RwSkeletonReportCard(),
              ],
            ),
          ),
        ],
      );
    } else if (report == null) {
      final notFound = _error?.kind == ApiErrorKind.notFound;
      body = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          notFound
              ? RwEmptyState(
                  icon: RwIcons.search,
                  title: 'Report not found',
                  message: 'This report does not exist or is no longer assigned to you.',
                  actionLabel: 'Back to Assigned',
                  secondaryAction: true,
                  onAction: () => Navigator.of(context).maybePop(),
                )
              : RwEmptyState.error(
                  title: "Couldn't load this report",
                  message: _error?.kind == ApiErrorKind.network
                      ? 'Check your connection, then try again.'
                      : (_error?.message ?? 'Try again.'),
                  onAction: _load,
                ),
        ],
      );
    } else {
      body = _content(c, report);
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
      // Figma "Action bar (sticky)": always reachable while the details scroll.
      bottomNavigationBar: report == null
          ? null
          : Container(
              decoration: BoxDecoration(
                color: c.surfaceWhite,
                border: Border(top: BorderSide(color: c.borderSubtle)),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s12, RwSpace.s16, RwSpace.s16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      RwButton(
                        label: 'Update status',
                        icon: RwIcons.refresh,
                        onPressed: () => _updateStatus(report),
                      ),
                      const SizedBox(height: RwSpace.s8),
                      Text(
                        'You can set In Progress, Additional Information Required or Resolved/Closed.',
                        style: RwType.label.copyWith(color: c.textMuted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _content(RwColors c, Report r) {
    const gap = SizedBox(height: RwSpace.s16);
    const titleGap = SizedBox(height: RwSpace.s12);
    final history = _historyFor(r);
    final phone = (r.reporterPhone ?? '').trim();
    final email = (r.reporterEmail ?? '').trim();
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
        gap,
        const RwSectionTitle('Location'),
        titleGap,
        RwCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (r.hasLocation) ...[
                ClipRRect(
                  borderRadius: RwRadius.mdAll,
                  child: RwMap(pin: LatLng(r.latitude!, r.longitude!), height: 216),
                ),
                const SizedBox(height: RwSpace.s12),
                RwDetailItem(label: 'Coordinates', value: _coords(r)),
              ] else
                const RwDetailItem(
                  label: 'Coordinates',
                  value: 'No map pin. The reporter typed the location only.',
                ),
              const SizedBox(height: RwSpace.s12),
              RwButton.secondary(
                label: 'Open in Maps',
                icon: RwIcons.mapPin,
                onPressed: () => _openInMaps(r),
              ),
            ],
          ),
        ),
        gap,
        const RwSectionTitle('Reporter'),
        titleGap,
        RwCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              RwDetailItem(label: 'Name', value: r.reporterName ?? 'Not available'),
              const SizedBox(height: RwSpace.s12),
              RwDetailItem(label: 'Mobile', value: phone.isEmpty ? 'Not given' : phone),
              if (phone.isEmpty && email.isNotEmpty) ...[
                const SizedBox(height: RwSpace.s12),
                RwDetailItem(label: 'Email', value: email),
              ],
              const SizedBox(height: RwSpace.s12),
              Text(
                'You can see this because the report is assigned to you.',
                style: RwType.label.copyWith(color: c.textMuted),
              ),
              if (phone.isNotEmpty) ...[
                const SizedBox(height: RwSpace.s12),
                RwButton.secondary(
                  label: 'Call reporter',
                  icon: RwIcons.phone,
                  semanticLabel: 'Call reporter, $phone',
                  onPressed: () => _call(phone),
                ),
              ],
            ],
          ),
        ),
        gap,
        const RwSectionTitle('Accident details'),
        titleGap,
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
        if (r.photos.isNotEmpty) ...[
          gap,
          RwSectionTitle('Photos (${r.photos.length})'),
          titleGap,
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
                  onTap: () => RwPhotoViewer.show(
                    context,
                    url: r.photos[i].url,
                    label: 'Photo ${i + 1} of ${r.photos.length}',
                  ),
                ),
            ],
          ),
        ],
        gap,
        const RwSectionTitle('Status history'),
        titleGap,
        RwCard(
          child: Column(
            children: [
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
        const SizedBox(height: RwSpace.s24),
      ],
    );
  }
}

String _coords(Report r) => '${r.latitude!.toStringAsFixed(4)}, ${r.longitude!.toStringAsFixed(4)}';

class _HistoryRow {
  const _HistoryRow(this.status, this.meta, this.remarks);
  final String status;
  final String meta;
  final String? remarks;
}

/// "Maria Cruz (Admin)"; reporters stay "Reporter". Staff see staff names (unlike the reporter app).
String _actor(StatusHistoryEntry e) {
  final role =
      e.changedByRole ??
      switch (e.newStatus) {
        Statuses.submitted => Roles.reporter,
        Statuses.inProgress || Statuses.additionalInfo || Statuses.resolved => Roles.officer,
        _ => Roles.admin,
      };
  if (role == Roles.reporter) return 'Reporter';
  final short = role == Roles.admin ? 'Admin' : 'Officer';
  final name = (e.changedByName ?? '').trim();
  return name.isEmpty ? short : '$name ($short)';
}

/// Newest first; the current row carries the latest official remarks.
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
          _actor(entries[i]),
        ].join(' · '),
        i == 0 && remarks.isNotEmpty
            ? remarks
            : (entries[i].newStatus == Statuses.submitted ? 'Report received.' : null),
      ),
  ];
}

/// O3 "Update status" bottom sheet: new status (officer choices only) and official remarks.
/// Pops with the updated report after a successful save.
class _UpdateStatusSheet extends StatefulWidget {
  const _UpdateStatusSheet({required this.report, required this.api});

  final Report report;
  final RoadWatchApi api;

  @override
  State<_UpdateStatusSheet> createState() => _UpdateStatusSheetState();
}

class _UpdateStatusSheetState extends State<_UpdateStatusSheet> {
  late String _status = Statuses.officerChoices.contains(widget.report.status)
      ? widget.report.status
      : Statuses.inProgress;
  final _remarks = TextEditingController();
  bool _saving = false;
  String? _formError;
  String? _remarksError;

  @override
  void dispose() {
    _remarks.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final remarks = _remarks.text.trim();
    final changed = _status != widget.report.status;
    if (!changed && remarks.isEmpty) {
      setState(() => _formError = 'Choose a new status or add official remarks.');
      return;
    }
    setState(() {
      _saving = true;
      _formError = null;
      _remarksError = null;
    });
    try {
      final updated = await widget.api.updateOfficerReport(
        widget.report.reportId,
        status: changed ? _status : null,
        remarks: remarks,
      );
      if (mounted) Navigator.of(context).pop(updated);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _remarksError = e.fieldError('remarks');
        _formError = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final r = widget.report;
    return Padding(
      // Keeps the fields above the keyboard.
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s12, RwSpace.s16, RwSpace.s24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: c.textMuted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: RwSpace.s16),
            Semantics(
              header: true,
              child: Text('Update status', style: RwType.h3.copyWith(color: c.textPrimary)),
            ),
            const SizedBox(height: RwSpace.s16),
            Text(
              [reportCode(r.reportId), r.accidentTypeName ?? 'Accident', r.location].join(' · '),
              style: RwType.label.copyWith(color: c.textMuted),
            ),
            const SizedBox(height: RwSpace.s16),
            RwSelect<String>(
              label: 'New status',
              required: true,
              value: _status,
              items: [for (final s in Statuses.officerChoices) RwSelectItem(s, s)],
              helperText: 'Officers can set In Progress, Additional Information Required or Resolved/Closed.',
              onChanged: _saving ? null : (v) => setState(() => _status = v),
            ),
            const SizedBox(height: RwSpace.s16),
            RwTextarea(
              label: 'Official remarks',
              controller: _remarks,
              enabled: !_saving,
              maxLength: 2000,
              errorText: _remarksError,
              helperText: 'Optional · shown to the reporter in their tracking screen',
            ),
            const SizedBox(height: RwSpace.s16),
            Text(
              'The reporter is notified. Only an administrator can verify, assign or reject.',
              style: RwType.label.copyWith(color: c.textMuted),
            ),
            if (_formError != null) ...[
              const SizedBox(height: RwSpace.s16),
              RwToast(type: RwToastType.error, title: "Couldn't save the update", message: _formError),
            ],
            const SizedBox(height: RwSpace.s16),
            RwButton(label: 'Save update', loading: _saving, onPressed: _saving ? null : _save),
            const SizedBox(height: RwSpace.s12),
            RwButton.secondary(
              label: 'Cancel',
              onPressed: _saving ? null : () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}
