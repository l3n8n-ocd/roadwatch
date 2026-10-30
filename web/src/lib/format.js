const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : dateFmt.format(d);
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

// "RW-000123" style label for report_id.
export function reportCode(id) {
  return id == null ? '' : `RW-${String(id).padStart(6, '0')}`;
}

// "Just now", "5 min ago", "1 hour ago", "3 hours ago", then the date and time (notification bell).
export function formatRelative(value, now = Date.now()) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const minutes = Math.floor((now - d.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  return formatDateTime(d);
}
