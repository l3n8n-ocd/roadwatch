// Unit tests for the report priority rule (#54) and the distance used for nearby officers (#57). No database.
const test = require('node:test');
const assert = require('node:assert');
const { autoPriority } = require('../src/services/priorityService');
const { distanceKm } = require('../src/services/dispatchService');

test('accident type sets the base priority', () => {
  assert.equal(autoPriority('Pedestrian accident', 'none'), 'High');
  assert.equal(autoPriority('Hit-and-run', 'none'), 'High');
  assert.equal(autoPriority('Vehicle rollover', 'none'), 'High');
  assert.equal(autoPriority('Collision', 'none'), 'Medium');
  assert.equal(autoPriority('Other', 'none'), 'Low');
  assert.equal(autoPriority('A type added later', 'none'), 'Low');
});

test('injuries raise the priority, never lower it', () => {
  assert.equal(autoPriority('Other', 'fatalities'), 'Urgent');
  assert.equal(autoPriority('Collision', 'fatalities'), 'Urgent');
  assert.equal(autoPriority('Other', 'injuries'), 'High');
  assert.equal(autoPriority('Collision', 'injuries'), 'High');
  assert.equal(autoPriority('Hit-and-run', 'injuries'), 'High');
  assert.equal(autoPriority('Other', 'unknown'), 'Medium');
  assert.equal(autoPriority('Pedestrian accident', 'unknown'), 'High');
});

test('distance between two points in km', () => {
  assert.equal(distanceKm(14.84, 120.81, 14.84, 120.81), 0);
  // 0.009 degrees of latitude is about 1 km
  assert.ok(Math.abs(distanceKm(14.84, 120.81, 14.849, 120.81) - 1.0) < 0.01);
  // Malolos to Manila (City Hall), about 33 km
  const km = distanceKm(14.8433, 120.8114, 14.5896, 120.9813);
  assert.ok(km > 30 && km < 36, `got ${km}`);
});
