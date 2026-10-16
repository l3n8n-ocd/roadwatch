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

// Statuses a Traffic Officer may set on a report assigned to them.
// Assigning and rejecting stay with the Administrator.
const OFFICER_STATUSES = ['Under Review', 'Additional Information Required', 'Verified', 'In Progress', 'Resolved/Closed'];

const INJURY_VALUES = ['none', 'injuries', 'fatalities', 'unknown'];

module.exports = { ROLES, STATUSES, VERIFIED_STATUSES, OFFICER_STATUSES, INJURY_VALUES };
