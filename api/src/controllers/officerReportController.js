// Traffic Officer side: ONLY reports assigned to the logged-in officer.
const { Report } = require('../models');
const { includes, serialize, buildWhere, listReports } = require('../services/reportService');
const { changeStatus } = require('../services/statusService');
const HttpError = require('../utils/httpError');

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
  const full = await Report.findByPk(report.report_id, { include: includes({ withHistory: true }) });
  res.json({ success: true, data: serialize(full, req.user) });
}

// Update investigation status and/or add official remarks.
async function update(req, res) {
  const report = await findAssigned(req);
  // A rejected report is closed for the officer; only an administrator can reopen it (#44).
  if (report.report_status === 'Rejected') {
    throw new HttpError(409, 'This report was rejected by an administrator, so it can no longer be updated.', { code: 'REPORT_REJECTED' });
  }
  const { status, remarks } = req.body;
  await changeStatus({ report, status: status || report.report_status, actor: req.user, remarks });
  const full = await Report.findByPk(report.report_id, { include: includes({ withHistory: true }) });
  res.json({ success: true, data: serialize(full, req.user) });
}

module.exports = { list, getOne, update };
