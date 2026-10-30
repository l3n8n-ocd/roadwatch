const { PRIORITIES } = require('../config/constants');

// Report priority (#54, DECISIONS #49). The accident type sets the base and injuries raise it:
// Pedestrian accident, Hit-and-run, Vehicle rollover = High; Collision = Medium; anything else = Low.
// Fatalities make it Urgent; Injuries make it at least High; Unknown makes it at least Medium.
// database/migrations/2026-10-30-v1.2.0.sql applies the same rule to reports made before v1.2.0.
const TYPE_BASE = {
  'Pedestrian accident': 'High',
  'Hit-and-run': 'High',
  'Vehicle rollover': 'High',
  Collision: 'Medium',
};
const INJURY_MINIMUM = { fatalities: 'Urgent', injuries: 'High', unknown: 'Medium', none: 'Low' };

const rank = (p) => PRIORITIES.indexOf(p);

function autoPriority(typeName, injury) {
  const base = TYPE_BASE[typeName] || 'Low';
  const minimum = INJURY_MINIMUM[injury] || 'Low';
  return rank(minimum) > rank(base) ? minimum : base;
}

module.exports = { autoPriority };
