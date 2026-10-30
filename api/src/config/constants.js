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

// Report priority (#54), lowest to highest. The order matters: it is the ENUM order in schema.sql, so
// ORDER BY priority DESC puts Urgent first.
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Nearby on-duty officers (#57, DECISIONS #49): how many are alerted, how long they have to respond before the
// report waits for the administrator, and how fresh an officer's location must be to count.
const DISPATCH = { MAX_OFFICERS: 3, RESPONSE_MINUTES: 10, LOCATION_MAX_AGE_MINUTES: 30, DEFAULT_RANGE_KM: 5, MAX_RANGE_KM: 50 };

// Which clients each role signs in from (docs/DECISIONS.md #36, #45): Reporters use the mobile app,
// Administrators the web dashboard, and Traffic Officers either one (#52). Each client sends its platform
// at login.
const PLATFORMS = ['web', 'mobile'];
const ROLE_PLATFORMS = { [ROLES.REPORTER]: ['mobile'], [ROLES.OFFICER]: ['web', 'mobile'], [ROLES.ADMIN]: ['web'] };

module.exports = {
  ROLES, STATUSES, VERIFIED_STATUSES, OFFICER_STATUSES, INJURY_VALUES, PRIORITIES, DISPATCH, PLATFORMS, ROLE_PLATFORMS,
};
