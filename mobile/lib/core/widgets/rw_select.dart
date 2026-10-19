import 'package:flutter/material.dart';

import '../format.dart';
import '../theme/tokens.dart';
import 'rw_field_parts.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

class RwSelectItem<T> {
  const RwSelectItem(this.value, this.label);
  final T value;
  final String label;
}

/// A 48 px field box that opens something when tapped (used by Select and Date time field).
class RwFieldButton extends StatelessWidget {
  const RwFieldButton({
    super.key,
    required this.semanticLabel,
    required this.text,
    required this.placeholder,
    required this.trailingIcon,
    required this.onTap,
    this.hasError = false,
    this.open = false,
  });

  final String semanticLabel;

  /// Current value, or null to show [placeholder] in text/muted.
  final String? text;
  final String placeholder;
  final String trailingIcon;
  final VoidCallback? onTap;
  final bool hasError;

  /// Figma "Open" state: 2 px border/focus without the ring.
  final bool open;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      semanticLabel: '$semanticLabel, ${text ?? 'not set'}',
      excludeChildSemantics: true,
      builder: (context, s) {
        final state = !s.enabled
            ? RwFieldState.disabled
            : hasError
            ? RwFieldState.error
            : (s.focused || open)
            ? RwFieldState.focused
            : RwFieldState.normal;
        var deco = rwFieldDecoration(c, state);
        if (open && !s.focused) deco = deco.copyWith(boxShadow: const []);
        final color = !s.enabled || text == null ? c.textMuted : c.textPrimary;
        return Container(
          constraints: const BoxConstraints(minHeight: RwSize.controlHeight),
          padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: 12),
          decoration: deco,
          child: Row(
            children: [
              Expanded(
                child: Text(
                  text ?? placeholder,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: RwType.body.copyWith(color: color),
                ),
              ),
              const SizedBox(width: RwSpace.s12),
              RwIcon(trailingIcon, size: RwSize.iconMd, color: s.enabled ? c.textPrimary : c.textMuted),
            ],
          ),
        );
      },
    );
  }
}

/// Figma "Select" (97:279). Opens the options in a bottom sheet styled like the Figma menu
/// (selected option: navy-subtle fill, semibold, check icon).
class RwSelect<T> extends StatefulWidget {
  const RwSelect({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    required this.onChanged,
    this.hintText = 'Choose',
    this.helperText,
    this.errorText,
    this.required = false,
  });

  final String label;
  final List<RwSelectItem<T>> items;
  final T? value;

  /// Null disables the field.
  final ValueChanged<T>? onChanged;
  final String hintText;
  final String? helperText;
  final String? errorText;
  final bool required;

  @override
  State<RwSelect<T>> createState() => _RwSelectState<T>();
}

class _RwSelectState<T> extends State<RwSelect<T>> {
  bool _open = false;

  Future<void> _pick() async {
    setState(() => _open = true);
    final picked = await showModalBottomSheet<RwSelectItem<T>>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => _OptionsSheet<T>(title: widget.label, items: widget.items, selected: widget.value),
    );
    if (!mounted) return;
    setState(() => _open = false);
    if (picked != null) widget.onChanged?.call(picked.value);
  }

  @override
  Widget build(BuildContext context) {
    String? current;
    for (final i in widget.items) {
      if (i.value == widget.value) current = i.label;
    }
    return RwFieldColumn(
      label: widget.label,
      required: widget.required,
      enabled: widget.onChanged != null,
      helperText: widget.helperText,
      errorText: widget.errorText,
      child: RwFieldButton(
        semanticLabel: widget.required ? '${widget.label}, required' : widget.label,
        text: current,
        placeholder: widget.hintText,
        trailingIcon: RwIcons.chevronDown,
        hasError: widget.errorText != null,
        open: _open,
        onTap: widget.onChanged == null ? null : _pick,
      ),
    );
  }
}

class _OptionsSheet<T> extends StatelessWidget {
  const _OptionsSheet({required this.title, required this.items, required this.selected});

  final String title;
  final List<RwSelectItem<T>> items;
  final T? selected;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.7),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(RwSpace.s16, 0, RwSpace.s16, RwSpace.s8),
              child: Semantics(
                header: true,
                child: Text(title, style: RwType.h3.copyWith(color: c.textPrimary)),
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.all(RwSpace.s8),
                children: [
                  for (final item in items)
                    RwPressable(
                      onTap: () => Navigator.of(context).pop(item),
                      borderRadius: RwRadius.smAll,
                      selected: item.value == selected,
                      builder: (context, s) {
                        final isSelected = item.value == selected;
                        return Container(
                          constraints: const BoxConstraints(minHeight: RwSize.touch),
                          padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12, vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected || s.active ? c.surfaceNavySubtle : null,
                            borderRadius: RwRadius.smAll,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  item.label,
                                  style: (isSelected ? RwType.label : RwType.body).copyWith(
                                    color: c.textPrimary,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                RwIcon(RwIcons.check, size: RwSize.iconMd, color: c.textPrimary),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum RwDateTimeType { date, time }

/// Figma "Date time field" (97:411). Date shows YYYY-MM-DD, time shows HH:MM (24 h), the
/// formats the API expects. Opens the platform pickers.
class RwDateTimeField extends StatelessWidget {
  const RwDateTimeField.date({
    super.key,
    required this.label,
    required this.date,
    required this.onDateChanged,
    this.firstDate,
    this.lastDate,
    this.helperText,
    this.errorText,
    this.required = false,
  }) : type = RwDateTimeType.date,
       time = null,
       onTimeChanged = null;

  const RwDateTimeField.time({
    super.key,
    required this.label,
    required this.time,
    required this.onTimeChanged,
    this.helperText,
    this.errorText,
    this.required = false,
  }) : type = RwDateTimeType.time,
       date = null,
       firstDate = null,
       lastDate = null,
       onDateChanged = null;

  final RwDateTimeType type;
  final String label;
  final DateTime? date;
  final TimeOfDay? time;
  final ValueChanged<DateTime>? onDateChanged;
  final ValueChanged<TimeOfDay>? onTimeChanged;

  /// Defaults: one year back to today (accident dates cannot be in the future).
  final DateTime? firstDate;
  final DateTime? lastDate;
  final String? helperText;
  final String? errorText;
  final bool required;

  bool get _enabled => type == RwDateTimeType.date ? onDateChanged != null : onTimeChanged != null;

  Future<void> _pick(BuildContext context) async {
    if (type == RwDateTimeType.date) {
      final now = DateTime.now();
      final picked = await showDatePicker(
        context: context,
        initialDate: date ?? now,
        firstDate: firstDate ?? DateTime(now.year - 1, now.month, now.day),
        lastDate: lastDate ?? now,
        helpText: label,
      );
      if (picked != null) onDateChanged?.call(picked);
    } else {
      final picked = await showTimePicker(
        context: context,
        initialTime: time ?? TimeOfDay.now(),
        helpText: label,
        builder: (ctx, child) =>
            MediaQuery(data: MediaQuery.of(ctx).copyWith(alwaysUse24HourFormat: true), child: child!),
      );
      if (picked != null) onTimeChanged?.call(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDate = type == RwDateTimeType.date;
    final text = isDate
        ? (date == null ? null : apiDate(date!))
        : (time == null ? null : apiTime(time!.hour, time!.minute));
    return RwFieldColumn(
      label: label,
      required: required,
      enabled: _enabled,
      helperText: helperText,
      errorText: errorText,
      child: RwFieldButton(
        semanticLabel: required ? '$label, required' : label,
        text: text,
        placeholder: isDate ? 'YYYY-MM-DD' : 'HH:MM',
        trailingIcon: isDate ? RwIcons.calendar : RwIcons.clock,
        hasError: errorText != null,
        onTap: _enabled ? () => _pick(context) : null,
      ),
    );
  }
}
