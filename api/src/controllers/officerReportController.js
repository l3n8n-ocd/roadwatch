// Traffic Officer side: ONLY reports assigned to the logged-in officer, plus the nearby-officer alerts (#57).
const { Report } = require('../models');
const { includes, present, buildWhere, listReports } = require('../services/reportService');
const { changeStatus } = require('../services/statusService');
const dispatch = require('../services/dispatchService');
const HttpError = require('../utils/httpError');

async function respondWithReport(res, reportId, viewer) {
  const full = await Report.findByPk(reportId, { include: includes({ withHistory: true }) });
  res.json({ success: true, data: await present(full, viewer) });
}

async function list(req, res) {
  const where = { ...buildWhere({ ...req.validQuery, assigned_officer_id: undefined }), assigned_officer_id: req.user.user_id };
  const result = await listReports({ where, query: req.validQuery, viewer: req.user });
  res.json({ success: true, ...result });
}

async function findAssigned(req) {
  const report = await Report.findByPk(req.params.id);
  // 404 for a report that is not assigned to this officer, so other reports cannot be probed.
  if (!report || report.assigned_officer_id !== req.user.user_id) throw new HttpError(404, 'Report not found');
  return report;
}

async function getOne(req, res) {
  const report = await findAssigned(req);
  await respondWithReport(res, report.report_id, req.user);
}

// Update investigation status and/or add official remarks.
async function update(req, res) {
  const report = await findAssigned(req);
  // A rejected report is closed for the officer; only an administrator can reopen it (issue #44).
  if (report.report_status === 'Rejected') {
    throw new HttpError(409, 'This report was rejected by an administrator, so it can no longer be updated.', { code: 'REPORT_REJECTED' });
  }
  // A report taken from a nearby alert is confirmed or rejected on scene first (#57).
  if (await dispatch.awaitingConfirmation(report.report_id, req.user.user_id)) {
    throw new HttpError(409, 'Confirm the accident on scene first, or reject the report.', { code: 'CONFIRM_FIRST' });
  }
  const { status, remarks } = req.body;
  await changeStatus({ report, status: status || report.report_status, actor: req.user, remarks });
  await respondWithReport(res, report.report_id, req.user);
}

// ----- nearby on-duty officers (#57) -----

async function getDuty(req, res) {
  res.json({ success: true, data: await dispatch.getDuty(req.user.user_id) });
}

async function setDuty(req, res) {
  res.json({ success: true, data: await dispatch.setDuty(req.user, req.body) });
}

// Polled every 30 seconds by the apps while the officer is on duty.
async function nearby(req, res) {
  res.json({ success: true, data: await dispatch.pendingAlerts(req.user.user_id) });
}

async function respond(req, res) {
  const report = await dispatch.respond(Number(req.params.id), req.user);
  await respondWithReport(res, report.report_id, req.user);
}

async function decline(req, res) {
  await dispatch.decline(Number(req.params.id), req.user);
  res.json({ success: true, data: { report_id: Number(req.params.id) } });
}

async function confirmOnScene(req, res) {
  const report = await findAssigned(req);
  await dispatch.confirmOnScene(report, req.user, req.body.remarks);
  await respondWithReport(res, report.report_id, req.user);
}

async function rejectOnScene(req, res) {
  const report = await findAssigned(req);
  await dispatch.rejectOnScene(report, req.user, req.body.rejection_reason);
  await respondWithReport(res, report.report_id, req.user);
}

module.exports = { list, getOne, update, getDuty, setDuty, nearby, respond, decline, confirmOnScene, rejectOnScene };
