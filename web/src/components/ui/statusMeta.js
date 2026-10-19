// Look of each report_status (Figma Components → Status chip, 99:257).
// chip: background/border of the pill. iconColor: color of the status icon.
// Text on every chip is navy (text-text-primary); color is only a third cue.
export const STATUS_META = {
  Submitted: { icon: 'send', chip: 'bg-surface-navy-subtle', iconColor: 'text-text-primary' },
  'Under Review': { icon: 'search', chip: 'bg-surface-blue-subtle', iconColor: 'text-text-blue' },
  'Additional Information Required': {
    icon: 'alert-triangle',
    chip: 'bg-brand-amber',
    iconColor: 'text-text-primary',
  },
  Verified: { icon: 'shield-check', chip: 'bg-surface-success-subtle', iconColor: 'text-text-success' },
  Assigned: { icon: 'user-check', chip: 'bg-surface-white border border-brand-blue', iconColor: 'text-text-blue' },
  'In Progress': {
    icon: 'clock',
    chip: 'bg-surface-amber-subtle border border-brand-amber',
    iconColor: 'text-text-primary',
  },
  'Resolved/Closed': { icon: 'check-circle', chip: 'bg-brand-success', iconColor: 'text-text-primary' },
  Rejected: { icon: 'x-circle', chip: 'bg-surface-danger-subtle', iconColor: 'text-text-danger' },
};

const FALLBACK = { icon: 'info', chip: 'bg-surface-navy-subtle', iconColor: 'text-text-primary' };

export function statusMeta(status) {
  return STATUS_META[status] || FALLBACK;
}
