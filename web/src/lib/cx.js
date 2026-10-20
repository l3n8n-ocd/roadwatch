// Joins class names, skipping empty values: cx('a', isOn && 'b', undefined) -> 'a b'.
export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

// "Maria Cruz" -> "MC" (avatar initials).
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
