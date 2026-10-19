import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/models.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import 'report_draft.dart';

/// Report an accident, step 1 of 3. Figma (Mobile page 90:4): M2/Accident details/Default 113:517,
/// Validation 113:659.
///
/// Fills [ReportDraft]: accident_type_id (GET /accident-types), accident_date, accident_time,
/// injury_information, vehicles_involved (optional), accident_description (10+ chars).
/// The location text is collected on step 2.
class ReportDetailsScreen extends StatefulWidget {
  const ReportDetailsScreen({super.key});

  @override
  State<ReportDetailsScreen> createState() => _ReportDetailsScreenState();
}

/// Close (x) on any step: confirm, clear the draft, go back to the tab shell.
Future<void> confirmCancelReport(BuildContext context) async {
  final discard = await showRwConfirmDialog(
    context,
    title: 'Cancel this report?',
    message: 'What you entered so far will be cleared.',
    confirmLabel: 'Discard report',
    cancelLabel: 'Keep editing',
    destructive: true,
  );
  if (!discard || !context.mounted) return;
  context.read<ReportDraft>().reset();
  Navigator.of(context).popUntil((r) => r.isFirst);
}

class _ReportDetailsScreenState extends State<ReportDetailsScreen> {
  final _scroll = ScrollController();
  late final ReportDraft _draft = context.read<ReportDraft>();
  late final _vehicles = TextEditingController(text: _draft.vehiclesInvolved);
  late final _description = TextEditingController(text: _draft.description);

  List<AccidentType>? _types;
  String? _typesError;

  bool _tried = false;
  bool _showSummary = false;
  Map<String, String> _errors = const {};

  @override
  void initState() {
    super.initState();
    // Default the date to today; the time stays empty so the reporter sets it.
    _draft.accidentDate ??= DateUtils.dateOnly(DateTime.now());
    _loadTypes();
  }

  @override
  void dispose() {
    _scroll.dispose();
    _vehicles.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _loadTypes() async {
    setState(() => _typesError = null);
    final api = context.read<RoadWatchApi?>();
    if (api == null) return;
    try {
      final types = await api.accidentTypes();
      if (mounted) setState(() => _types = types);
    } on ApiException catch (e) {
      if (mounted) setState(() => _typesError = e.message);
    }
  }

  TimeOfDay? get _time {
    final t = _draft.accidentTime;
    if (t == null || t.length < 5) return null;
    final h = int.tryParse(t.substring(0, 2));
    final m = int.tryParse(t.substring(3, 5));
    return (h == null || m == null) ? null : TimeOfDay(hour: h, minute: m);
  }

  /// Field key -> message. Keys double as names for the summary banner.
  Map<String, String> _validate() {
    final e = <String, String>{};
    final now = DateTime.now();
    final today = DateUtils.dateOnly(now);
    if (_draft.accidentTypeId == null) e['type'] = 'Choose an accident type.';
    final date = _draft.accidentDate;
    if (date == null) {
      e['date'] = 'Choose the accident date.';
    } else if (date.isAfter(today)) {
      e['date'] = 'Date cannot be in the future.';
    }
    final time = _time;
    if (time == null) {
      e['time'] = 'Choose the accident time.';
    } else if (date != null &&
        DateUtils.isSameDay(date, today) &&
        time.hour * 60 + time.minute > now.hour * 60 + now.minute) {
      e['time'] = 'Time cannot be in the future.';
    }
    if (_draft.injury == null) e['injury'] = 'Choose an injury option. Pick Unknown if unsure.';
    final desc = _description.text.trim();
    if (desc.length < 10) {
      e['description'] = desc.isEmpty
          ? 'Describe what happened in at least 10 characters.'
          : 'Describe what happened in at least 10 characters (${desc.length} so far).';
    }
    return e;
  }

  void _revalidate() {
    if (_tried) setState(() => _errors = _validate());
  }

  void _next() {
    _tried = true;
    final errors = _validate();
    setState(() {
      _errors = errors;
      _showSummary = errors.isNotEmpty;
    });
    if (errors.isNotEmpty) {
      _scroll.animateTo(
        0,
        duration: MediaQuery.disableAnimationsOf(context)
            ? const Duration(milliseconds: 1)
            : const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
      return;
    }
    FocusScope.of(context).unfocus();
    Navigator.of(context).pushNamed(Routes.reportLocation);
  }

  static const _names = {
    'type': 'Accident type',
    'date': 'date',
    'time': 'time',
    'injury': 'injuries',
    'description': 'description',
  };

  String _summaryMessage() {
    final names = _errors.keys.map((k) => _names[k] ?? k).toList();
    if (names.isEmpty) return '';
    names[0] = names[0][0].toUpperCase() + names[0].substring(1);
    final list = names.length == 1
        ? names.first
        : '${names.sublist(0, names.length - 1).join(', ')} and ${names.last}';
    return '$list ${names.length == 1 ? 'needs' : 'need'} attention.';
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final n = _errors.length;
    final descLength = _description.text.trim().length;
    // Side-by-side date and time unless large text would squeeze them.
    final narrow = MediaQuery.textScalerOf(context).scale(16) > 20;

    final date = RwDateTimeField.date(
      label: 'Accident date',
      required: true,
      date: _draft.accidentDate,
      errorText: _errors['date'],
      onDateChanged: (d) {
        _draft.update((x) => x.accidentDate = d);
        _revalidate();
        setState(() {});
      },
    );
    final time = RwDateTimeField.time(
      label: 'Accident time',
      required: true,
      time: _time,
      helperText: narrow ? '24-hour time, approximate is fine.' : null,
      errorText: _errors['time'],
      onTimeChanged: (t) {
        _draft.update((x) => x.accidentTime = apiTime(t.hour, t.minute));
        _revalidate();
        setState(() {});
      },
    );

    return Scaffold(
      backgroundColor: c.surfaceWhite,
      appBar: RwTopBar.inner(
        title: 'Report an accident',
        action: RwTopBarAction(
          icon: RwIcons.x,
          semanticLabel: 'Cancel report',
          onPressed: () => confirmCancelReport(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.all(RwSpace.s16),
              children: [
                const RwStepper(step: 1),
                if (_showSummary && n > 0) ...[
                  const SizedBox(height: RwSpace.s16),
                  RwToast(
                    type: RwToastType.error,
                    title: n == 1 ? 'Fix 1 field to continue' : 'Fix $n fields to continue',
                    message: _summaryMessage(),
                    onClose: () => setState(() => _showSummary = false),
                  ),
                ],
                const SizedBox(height: RwSpace.s16),
                RwSelect<int>(
                  label: 'Accident type',
                  required: true,
                  items: [
                    for (final t in _types ?? const <AccidentType>[]) RwSelectItem(t.typeId, t.typeName),
                  ],
                  value: _draft.accidentTypeId,
                  hintText: _types == null
                      ? (_typesError == null ? 'Loading types…' : 'Types not loaded')
                      : 'Choose a type',
                  errorText: _errors['type'] ?? _typesError,
                  onChanged: _types == null
                      ? null
                      : (v) {
                          _draft.update((x) => x.accidentTypeId = v);
                          _revalidate();
                          setState(() {});
                        },
                ),
                if (_typesError != null)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: RwButton.secondary(
                      label: 'Try again',
                      icon: RwIcons.refresh,
                      expand: false,
                      onPressed: _loadTypes,
                    ),
                  ),
                const SizedBox(height: RwSpace.s16),
                if (narrow) ...[
                  date,
                  const SizedBox(height: RwSpace.s16),
                  time,
                ] else
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: date),
                      const SizedBox(width: RwSpace.s12),
                      Expanded(child: time),
                    ],
                  ),
                const SizedBox(height: RwSpace.s16),
                RwSelect<String>(
                  label: 'Injuries',
                  required: true,
                  items: [for (final o in injuryOptions) RwSelectItem(o.value, o.label)],
                  value: _draft.injury,
                  hintText: 'Choose',
                  errorText: _errors['injury'],
                  onChanged: (v) {
                    _draft.update((x) => x.injury = v);
                    _revalidate();
                    setState(() {});
                  },
                ),
                const SizedBox(height: RwSpace.s16),
                _OptionalTag(
                  child: RwTextField(
                    label: 'Vehicles involved',
                    controller: _vehicles,
                    leadingIcon: RwIcons.car,
                    hintText: 'e.g. 1 tricycle, 1 motorcycle',
                    maxLength: 255,
                    textInputAction: TextInputAction.next,
                    onChanged: (v) => _draft.vehiclesInvolved = v,
                  ),
                ),
                const SizedBox(height: RwSpace.s16),
                RwTextarea(
                  label: 'What happened?',
                  required: true,
                  controller: _description,
                  hintText: 'Describe the accident: vehicles, road condition, traffic.',
                  helperText: '$descLength characters · at least 10',
                  errorText: _errors['description'],
                  maxLength: 10000,
                  onChanged: (v) {
                    _draft.description = v;
                    _revalidate();
                    setState(() {});
                  },
                ),
              ],
            ),
          ),
          _ActionBar(
            children: [
              Expanded(
                child: RwButton(label: 'Next: Location', onPressed: _next),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Sticky bottom action bar: white, top border, 16 px padding.
class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        border: Border(top: BorderSide(color: c.borderSubtle)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(RwSpace.s16),
          child: Row(children: children),
        ),
      ),
    );
  }
}

/// Puts the Figma "Optional" caption at the end of a field's label row (RwTextField only draws
/// "Required").
class _OptionalTag extends StatelessWidget {
  const _OptionalTag({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Stack(
      children: [
        child,
        PositionedDirectional(
          top: 2,
          end: 0,
          child: ExcludeSemantics(
            child: Text('Optional', style: RwType.caption.copyWith(color: c.textMuted)),
          ),
        ),
      ],
    );
  }
}
