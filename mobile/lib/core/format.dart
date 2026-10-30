// Display formatting shared by screens. Mirrors web/src/lib/format.js.

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

String _two(int n) => n.toString().padLeft(2, '0');

DateTime? _parse(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value.toLocal();
  return DateTime.tryParse(value.toString())?.toLocal();
}

/// "Oct 17, 2026"
String formatDate(Object? value) {
  final d = _parse(value);
  if (d == null) return value?.toString() ?? '';
  return '${_months[d.month - 1]} ${d.day}, ${d.year}';
}

/// "Oct 17, 2026 · 08:15"
String formatDateTime(Object? value) {
  final d = _parse(value);
  if (d == null) return value?.toString() ?? '';
  return '${formatDate(d)} · ${_two(d.hour)}:${_two(d.minute)}';
}

/// "09:14" (24 h, local time).
String formatTime(Object? value) {
  final d = _parse(value);
  if (d == null) return value?.toString() ?? '';
  return '${_two(d.hour)}:${_two(d.minute)}';
}

/// Accident date (YYYY-MM-DD) and time (HH:MM[:SS]) as "Oct 17, 2026 · 08:15".
String formatAccidentDateTime(String? date, String? time) {
  final d = DateTime.tryParse(date ?? '');
  final datePart = d == null ? (date ?? '') : formatDate(d);
  final timePart = (time ?? '').length >= 5 ? time!.substring(0, 5) : (time ?? '');
  return [datePart, timePart].where((s) => s.isNotEmpty).join(' · ');
}

/// "5 min ago" for recent times, otherwise [formatDateTime].
String formatRelative(Object? value, {DateTime? now}) {
  final d = _parse(value);
  if (d == null) return '';
  final diff = (now ?? DateTime.now()).difference(d);
  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
  if (diff.inHours < 24) return '${diff.inHours} h ago';
  return formatDateTime(d);
}

/// API date format YYYY-MM-DD.
String apiDate(DateTime d) => '${d.year}-${_two(d.month)}-${_two(d.day)}';

/// API time format HH:MM (24 h).
String apiTime(int hour, int minute) => '${_two(hour)}:${_two(minute)}';

/// "RW-000123" label for report_id.
String reportCode(Object? id) => id == null ? '' : 'RW-${id.toString().padLeft(6, '0')}';
