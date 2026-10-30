// Values fixed by the approved schema (database/schema.sql, docs/DECISIONS.md #19).
export const ROLES = {
  REPORTER: 'Reporter',
  ADMIN: 'Administrator',
  OFFICER: 'Traffic Officer',
};

export const STATUSES = [
  'Submitted',
  'Under Review',
  'Additional Information Required',
  'Verified',
  'Assigned',
  'In Progress',
  'Resolved/Closed',
  'Rejected',
];

// Workflow order (#30): admin verifies before assigning; officers do the rest (web portal #52 or the app).
export const ADMIN_STATUSES = ['Under Review', 'Additional Information Required', 'Verified', 'Rejected'];
export const OFFICER_STATUSES = ['In Progress', 'Additional Information Required', 'Resolved/Closed'];

export const INJURY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'injuries', label: 'Injuries' },
  { value: 'fatalities', label: 'Fatalities' },
  { value: 'unknown', label: 'Unknown' },
];

export const RECORD_TYPES = {
  public_submission: 'Public submission',
  verified_record: 'Verified record',
};

// Hotlines confirmed as official (docs/ui-design/hotlines.md, #31).
export const HOTLINES = {
  emergency: { label: 'Emergency', number: '911', tel: 'tel:911' },
  pnp: [
    { number: '117', tel: 'tel:117' },
    { number: '(02) 8722-0650', tel: 'tel:+63287220650' },
    { number: '(02) 8723-0401 to 0420', tel: 'tel:+63287230401' },
  ],
  bfp: [
    { number: '(02) 8426-0219', tel: 'tel:+63284260219' },
    { number: '(02) 8426-0246', tel: 'tel:+63284260246' },
  ],
};

// Staff use the web (#36, #52): Administrators and Traffic Officers. Reporters use the Android app.
export function homePathFor(role) {
  if (role === ROLES.ADMIN) return '/admin';
  if (role === ROLES.OFFICER) return '/officer';
  return '/';
}

// Release APK: mobile-ci attaches roadwatch.apk to a GitHub Release on each v* tag (#22), so this link
// downloads the newest one directly. Switch VITE_APK_URL to roadwatch-ph.me/app once the domain is live (#38).
export const APK_URL = import.meta.env.VITE_APK_URL || 'https://github.com/l3n8n-ocd/roadwatch/releases/latest/download/roadwatch.apk';

// Project support address (#40). It works once the domain and its email forwarding exist (#38).
export const SUPPORT_EMAIL = 'support@roadwatch-ph.me';
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
