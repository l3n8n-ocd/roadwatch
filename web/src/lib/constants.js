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

// Workflow order (#30): admin verifies before assigning; officers do the rest in the mobile app (#36).
export const ADMIN_STATUSES = ['Under Review', 'Additional Information Required', 'Verified', 'Rejected'];

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

// The web is for Administrators only (#36); Reporters and Traffic Officers use the Android app.
export function homePathFor(role) {
  return role === ROLES.ADMIN ? '/admin' : '/';
}

// Release APK (GitHub Actions on tag v*). Switch VITE_APK_URL to roadwatch-ph.me/app once the domain is live (#38).
export const APK_URL = import.meta.env.VITE_APK_URL || 'https://github.com/l3n8n-ocd/roadwatch/releases/latest';
