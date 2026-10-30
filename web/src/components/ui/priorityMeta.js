// Look of each report priority (Figma Components → Priority chip 527:4117, #54). Text on every chip is navy;
// the icon and fill are extra cues. PRIORITIES runs lowest to highest, like the API.
export const PRIORITY_META = {
  Low: { icon: 'arrow-down', chip: 'bg-surface-light-gray', iconColor: 'text-text-muted' },
  Medium: { icon: 'equal', chip: 'bg-surface-blue-subtle', iconColor: 'text-text-blue' },
  High: { icon: 'arrow-up', chip: 'bg-surface-amber-subtle', iconColor: 'text-text-primary' },
  Urgent: { icon: 'alert-triangle', chip: 'bg-surface-danger-subtle', iconColor: 'text-text-danger' },
};

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
