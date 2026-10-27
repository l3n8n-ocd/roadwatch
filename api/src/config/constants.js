// Values that must match database/schema.sql and database/seed.sql exactly.
const ROLES = { REPORTER: 'Reporter', ADMIN: 'Administrator', OFFICER: 'Traffic Officer' };

const STATUSES = [
  'Submitted',
  'Under Review',
  'Additional Information Required',
  'Verified',
  'Assigned',
  'In Progress',
  'Resolved/Closed',
  'Rejected',
];

// Statuses that mean the report has been officially verified (record_type = verified_record).
const VERIFIED_STATUSES = ['Verified', 'Assigned', 'In Progress', 'Resolved/Closed'];

// Statuses a Traffic Officer may set on a report assigned to them (workflow #30). Reviewing, verifying,
// assigning and rejecting stay with the Administrator.
const OFFICER_STATUSES = ['Additional Information Required', 'In Progress', 'Resolved/Closed'];

const INJURY_VALUES = ['none', 'injuries', 'fatalities', 'unknown'];

// Which clients each role signs in from (docs/DECISIONS.md #36, #45): Reporters use the mobile app,
// Administrators the web dashboard, and Traffic Officers either one (#52). Each client sends its platform
// at login.
const PLATFORMS = ['web', 'mobile'];
const ROLE_PLATFORMS = { [ROLES.REPORTER]: ['mobile'], [ROLES.OFFICER]: ['web', 'mobile'], [ROLES.ADMIN]: ['web'] };

module.exports = { ROLES, STATUSES, VERIFIED_STATUSES, OFFICER_STATUSES, INJURY_VALUES, PLATFORMS, ROLE_PLATFORMS };
