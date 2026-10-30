const { Op } = require('sequelize');
const { sequelize, Report, User, Role, AccidentType, OfficerStatus, ReportDispatch } = require('../models');
const { ROLES, DISPATCH } = require('../config/constants');
const { getAlertRangeKm } = require('./settingsService');
const { recordAudit } = require('./auditService');
const { notifyUser } = require('./notificationService');
const { changeStatus } = require('./statusService');
const HttpError = require('../utils/httpError');

// Nearby on-duty officers (#57, DECISIONS #49). A new report with a map pin alerts up to 3 nearest on-duty
// Traffic Officers within the admin's alert range (in the app, checked every 30 seconds, plus an email). The first
// to respond takes the report and then confirms it on scene (it becomes a verified record) or rejects it with a
// reason. If nobody responds within 10 minutes, the report waits for the administrator to verify and assign as before.

// Reports an alert can still be answered for: not reviewed further and not taken by anyone.
const OPEN_STATUSES = ['Submitted', 'Under Review'];

const minutesAgo = (m) => new Date(Date.now() - m * 60000);

// Great-circle distance in km (haversine).
function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const round2 = (n) => Math.round(n * 100) / 100;

// ----- duty switch -----

async function getDuty(officerId) {
  const row = await OfficerStatus.findByPk(officerId);
  return {
    on_duty: Boolean(row?.is_on_duty),
    latitude: row?.latitude != null ? Number(row.latitude) : null,
    longitude: row?.longitude != null ? Number(row.longitude) : null,
    location_updated_at: row?.location_updated_at || null,
  };
}

// On duty: keep the latest location only. Off duty: the location is cleared (shared only while on duty).
async function setDuty(officer, { on_duty: onDuty, latitude, longitude }) {
  const row = (await OfficerStatus.findByPk(officer.user_id)) || OfficerStatus.build({ officer_id: officer.user_id });
  const wasOnDuty = Boolean(row.is_on_duty);
  row.is_on_duty = onDuty;
  if (!onDuty) {
    row.latitude = null;
    row.longitude = null;
    row.location_updated_at = null;
  } else if (latitude !== undefined && longitude !== undefined) {
    row.latitude = latitude;
    row.longitude = longitude;
    row.location_updated_at = new Date();
  }
  row.updated_at = new Date();
  await row.save();
  if (wasOnDuty !== onDuty) await recordAudit(officer.user_id, onDuty ? 'officer.on_duty' : 'officer.off_duty');
  return getDuty(officer.user_id);
}

// ----- alerting -----

// Called after a report is saved. Best effort: a failure here never fails the submission.
async function dispatchNearby(report) {
  if (report.latitude == null || report.longitude == null) return [];
  const rangeKm = await getAlertRangeKm();
  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  const onDuty = await OfficerStatus.findAll({
    where: { is_on_duty: true, latitude: { [Op.ne]: null }, location_updated_at: { [Op.gte]: minutesAgo(DISPATCH.LOCATION_MAX_AGE_MINUTES) } },
    include: [{
      model: User, as: 'officer', required: true, where: { is_active: true }, attributes: ['user_id', 'full_name'],
      include: [{ model: Role, as: 'role', required: true, where: { role_name: ROLES.OFFICER }, attributes: [] }],
    }],
  });
  const nearest = onDuty
    .map((s) => ({ officerId: s.officer_id, km: distanceKm(lat, lng, Number(s.latitude), Number(s.longitude)) }))
    .filter((o) => o.km <= rangeKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, DISPATCH.MAX_OFFICERS);
  if (!nearest.length) return [];

  const type = await AccidentType.findByPk(report.accident_type_id);
  await ReportDispatch.bulkCreate(nearest.map((o) => ({ report_id: report.report_id, officer_id: o.officerId, distance_km: round2(o.km) })));
  await Promise.all(nearest.map((o) => {
    const where = `${type?.type_name || 'Accident'}, ${round2(o.km)} km from you`;
    return notifyUser(o.officerId, report.report_id, `Accident reported near you: report #${report.report_id} (${where}). Open RoadWatch to respond.`, {
      email: {
        subject: `RoadWatch: accident reported near you (report #${report.report_id})`,
        text: `A ${type?.type_name || 'road accident'} was reported at ${report.accident_location}, ${round2(o.km)} km from your last location.\n\n`
          + `Open RoadWatch and press Respond within ${DISPATCH.RESPONSE_MINUTES} minutes. The first nearby officer to respond takes the report `
          + 'and confirms it on scene.\n\nRoadWatch',
      },
    });
  }));
  return nearest;
}

// Alerts this officer can still answer: alerted in the last 10 minutes, report still open and not taken.
async function pendingAlerts(officerId) {
  const rows = await ReportDispatch.findAll({
    where: { officer_id: officerId, dispatch_status: 'alerted', alerted_at: { [Op.gte]: minutesAgo(DISPATCH.RESPONSE_MINUTES) } },
    include: [{
      model: Report, as: 'report', required: true,
      where: { report_status: OPEN_STATUSES, assigned_officer_id: null },
      include: [{ model: AccidentType, as: 'accidentType', attributes: ['type_name'] }],
    }],
    order: [['alerted_at', 'DESC']],
  });
  return rows.map((d) => ({
    report_id: d.report_id,
    priority: d.report.priority,
    accident_type: d.report.accidentType?.type_name || null,
    accident_location: d.report.accident_location,
    latitude: d.report.latitude != null ? Number(d.report.latitude) : null,
    longitude: d.report.longitude != null ? Number(d.report.longitude) : null,
    record_type: d.report.record_type,
    distance_km: Number(d.distance_km),
    date_submitted: d.report.date_submitted,
    alerted_at: d.alerted_at,
    expires_at: new Date(new Date(d.alerted_at).getTime() + DISPATCH.RESPONSE_MINUTES * 60000),
  }));
}

// The first alerted officer to respond takes the report (row lock, so two officers cannot both win).
async function respond(reportId, officer) {
  const t = await sequelize.transaction();
  let report;
  let mine;
  try {
    report = await Report.findByPk(reportId, { transaction: t, lock: t.LOCK.UPDATE });
    mine = report && await ReportDispatch.findOne({ where: { report_id: reportId, officer_id: officer.user_id }, transaction: t, lock: t.LOCK.UPDATE });
    if (!mine) throw new HttpError(404, 'Report not found');
    if (mine.dispatch_status === 'responded') {
      await t.commit();
      return report;
    }
    if (report.assigned_officer_id && report.assigned_officer_id !== officer.user_id) {
      const first = await User.findByPk(report.assigned_officer_id, { attributes: ['full_name'], transaction: t });
      throw new HttpError(409, `${first?.full_name || 'Another officer'} responded first to report #${reportId}. It's no longer waiting for you.`, {
        code: 'ALREADY_TAKEN', responder_name: first?.full_name || null,
      });
    }
    const expired = new Date(mine.alerted_at) < minutesAgo(DISPATCH.RESPONSE_MINUTES);
    if (mine.dispatch_status !== 'alerted' || expired || !OPEN_STATUSES.includes(report.report_status)) {
      throw new HttpError(409, 'This alert has closed. The administrator is handling the report.', { code: 'ALERT_CLOSED' });
    }
    mine.dispatch_status = 'responded';
    mine.responded_at = new Date();
    await mine.save({ transaction: t });
    await ReportDispatch.update({ dispatch_status: 'taken' },
      { where: { report_id: reportId, dispatch_status: 'alerted', officer_id: { [Op.ne]: officer.user_id } }, transaction: t });
    report.assigned_officer_id = officer.user_id;
    await report.save({ transaction: t });
    await recordAudit(officer.user_id, 'report.dispatch_responded', { report_id: reportId, distance_km: Number(mine.distance_km) }, t);
    await notifyUser(report.reporter_id, reportId, `A traffic officer is responding to your report #${reportId}.`, { transaction: t });
    await t.commit();
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
  return report;
}

async function decline(reportId, officer) {
  const [count] = await ReportDispatch.update({ dispatch_status: 'declined' },
    { where: { report_id: reportId, officer_id: officer.user_id, dispatch_status: 'alerted' } });
  if (!count) throw new HttpError(404, 'No open alert for this report');
}

// The officer's responded row that still waits for Confirm on scene or Reject, if any.
async function awaitingConfirmation(reportId, officerId) {
  return ReportDispatch.findOne({ where: { report_id: reportId, officer_id: officerId, dispatch_status: 'responded', outcome: null } });
}

async function settle(row, outcome) {
  row.outcome = outcome;
  row.outcome_at = new Date();
  await row.save();
}

// Confirm on scene: the report becomes an official (verified) record and the investigation starts (In Progress).
async function confirmOnScene(report, officer, remarks) {
  const row = await awaitingConfirmation(report.report_id, officer.user_id);
  if (!row) throw new HttpError(409, 'Only the officer who responded can confirm this report on scene.', { code: 'NOT_RESPONDING' });
  await changeStatus({ report, status: 'In Progress', actor: officer, remarks });
  await settle(row, 'confirmed');
  await recordAudit(officer.user_id, 'report.confirmed_on_scene', { report_id: report.report_id });
}

// Reject on scene: the report becomes Rejected with the reason; the administrator sees it flagged and can reopen it.
async function rejectOnScene(report, officer, reason) {
  const row = await awaitingConfirmation(report.report_id, officer.user_id);
  if (!row) throw new HttpError(409, 'Only the officer who responded can reject this report on scene.', { code: 'NOT_RESPONDING' });
  await changeStatus({ report, status: 'Rejected', actor: officer, rejectionReason: reason });
  await settle(row, 'rejected_on_scene');
  await recordAudit(officer.user_id, 'report.rejected_on_scene', { report_id: report.report_id, reason });
  const admins = await User.findAll({ where: { is_active: true }, include: [{ model: Role, as: 'role', where: { role_name: ROLES.ADMIN }, attributes: [] }] });
  await Promise.all(admins.map((a) => notifyUser(a.user_id, report.report_id,
    `Report #${report.report_id} was rejected on scene by ${officer.full_name}. You can reopen it.`)));
}

// When the administrator acts on a report (verify, assign, reject...), alerts nobody answered are closed.
async function closeAlerts(reportId) {
  await ReportDispatch.update({ dispatch_status: 'expired' }, { where: { report_id: reportId, dispatch_status: 'alerted' } });
}

// What staff screens show about the nearby-officer path, per report id:
// alerting | no_response (10+ minutes, waits for the admin) | responding | confirmed | rejected_on_scene.
async function dispatchSummaries(reportIds) {
  const out = new Map();
  if (!reportIds.length) return out;
  const rows = await ReportDispatch.findAll({
    where: { report_id: reportIds },
    include: [{ model: User, as: 'officer', attributes: ['user_id', 'full_name'] }],
    order: [['alerted_at', 'ASC']],
  });
  const byReport = new Map();
  rows.forEach((r) => byReport.set(r.report_id, [...(byReport.get(r.report_id) || []), r]));
  for (const [reportId, list] of byReport) {
    const first = list[0];
    const responded = list.find((r) => r.dispatch_status === 'responded');
    const minutes = Math.floor((Date.now() - new Date(first.alerted_at).getTime()) / 60000);
    const summary = {
      state: responded ? (responded.outcome || 'responding') : (minutes >= DISPATCH.RESPONSE_MINUTES ? 'no_response' : 'alerting'),
      alerted_count: list.length,
      alerted_at: first.alerted_at,
      minutes_since_alert: minutes,
      responder: responded ? { user_id: responded.officer.user_id, full_name: responded.officer.full_name } : null,
      responded_at: responded?.responded_at || null,
      distance_km: responded ? Number(responded.distance_km) : null,
      outcome_at: responded?.outcome_at || null,
    };
    out.set(reportId, summary);
  }
  return out;
}

module.exports = {
  distanceKm, getDuty, setDuty, dispatchNearby, pendingAlerts, respond, decline, awaitingConfirmation, confirmOnScene,
  rejectOnScene, closeAlerts, dispatchSummaries,
};
