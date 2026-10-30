import 'package:flutter/material.dart';

import '../../core/api/models.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

// Nearby on-duty officers (#57, DECISIONS #49). Figma (Mobile 90:4): O1 with On duty 537:4741,
// "Accident reported near you" sheet 537:4936, "Already taken" sheet 537:5011.

/// The On duty switch at the top of Assigned. The location is shared only while it is on.
class RwOnDutyCard extends StatelessWidget {
  const RwOnDutyCard({
    super.key,
    required this.onDuty,
    required this.onChanged,
    this.busy = false,
    this.error,
  });

  final bool onDuty;
  final bool busy;
  final String? error;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RwSettingsRow.toggle(
            icon: RwIcons.locate,
            label: 'On duty',
            description: 'Nearby reports reach you. Your location is shared only while this is on.',
            switchValue: onDuty,
            onSwitchChanged: busy ? null : onChanged,
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(RwSpace.s16, 0, RwSpace.s16, RwSpace.s12),
              child: Semantics(
                liveRegion: true,
                child: Text(error!, style: RwType.bodySm.copyWith(color: c.textDanger)),
              ),
            ),
        ],
      ),
    );
  }
}

Future<T?> _showSheet<T>(BuildContext context, Widget child) {
  final c = RwColors.of(context);
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: c.surfaceWhite,
    barrierColor: c.brandNavy.withValues(alpha: 0.55),
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (_) => SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(RwSpace.s24, RwSpace.s24 + 4, RwSpace.s24, RwSpace.s32),
      child: child,
    ),
  );
}

/// "Accident reported near you": true = Respond, false/null = Not now.
Future<bool?> showNearbyAlertSheet(BuildContext context, NearbyAlert alert) {
  final c = RwColors.of(context);
  final when = alert.dateSubmitted == null
      ? ''
      : ' · reported ${formatRelative(alert.dateSubmitted).toLowerCase()}';
  return _showSheet<bool>(
    context,
    Builder(
      builder: (context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Semantics(
            header: true,
            child: Text('Accident reported near you', style: RwType.h3.copyWith(color: c.textPrimary)),
          ),
          const SizedBox(height: RwSpace.s16),
          Wrap(
            spacing: RwSpace.s8,
            runSpacing: RwSpace.s8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (alert.priority != null) RwPriorityChip(alert.priority!),
              Text('Not yet verified', style: RwType.bodySm.copyWith(color: c.textMuted)),
            ],
          ),
          const SizedBox(height: RwSpace.s16),
          Text(
            '${alert.accidentType ?? 'Accident'} · ${alert.location}\n'
            '${_km(alert.distanceKm)} km from you$when · ${reportCode(alert.reportId)}',
            style: RwType.body.copyWith(color: c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s16),
          Text(
            'Up to 3 nearby on-duty officers got this alert. The first to respond takes the report and confirms '
            'it on scene.',
            style: RwType.bodySm.copyWith(color: c.textMuted),
          ),
          const SizedBox(height: RwSpace.s16),
          RwButton(label: 'Respond', icon: RwIcons.send, onPressed: () => Navigator.of(context).pop(true)),
          const SizedBox(height: RwSpace.s16),
          RwButton.secondary(label: 'Not now', onPressed: () => Navigator.of(context).pop(false)),
        ],
      ),
    ),
  );
}

/// "Already taken": another nearby officer responded first.
Future<void> showAlreadyTakenSheet(BuildContext context, NearbyAlert alert, String responderName) {
  final c = RwColors.of(context);
  return _showSheet<void>(
    context,
    Builder(
      builder: (context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Semantics(
            header: true,
            child: Text('Already taken', style: RwType.h3.copyWith(color: c.textPrimary)),
          ),
          const SizedBox(height: RwSpace.s16),
          Text(
            '$responderName responded first to ${reportCode(alert.reportId)} '
            '(${alert.accidentType ?? 'Accident'}, ${_km(alert.distanceKm)} km away). '
            'It’s no longer waiting for you.',
            style: RwType.body.copyWith(color: c.textPrimary),
          ),
          const SizedBox(height: RwSpace.s16),
          RwButton(label: 'OK', onPressed: () => Navigator.of(context).pop()),
        ],
      ),
    ),
  );
}

String _km(double km) => km == km.roundToDouble() ? km.toStringAsFixed(0) : km.toStringAsFixed(1);
