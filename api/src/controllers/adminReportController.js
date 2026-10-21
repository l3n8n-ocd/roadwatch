// Administrator side: review, filter, verify, assign, change status.
const { Report, User, Role } = require('../models');
const { ROLES } = require('../config/constants');
const { includes, serialize, buildWhere, listReports } = require('../services/reportService');
const { changeStatus } = require('../services/statusService');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const result = await listReports({ where: buildWhere(req.validQuery), query: req.validQuery, viewer: req.user });
  res.json({ success: true, ...result });
}

async function getOne(req, res) {
  const report = await Report.findByPk(req.params.id, { include: includes({ withHistory: true }) });
  if (!report) throw new HttpError(404, 'Report not found');
  res.json({ success: true, data: serialize(report, req.user) });
}

async function setStatus(req, res) {
  const { status, remarks, rejection_reason } = req.body;
  if (status === 'Assigned') throw new HttpError(400, 'Use PATCH /api/admin/reports/:id/assign to assign an officer');
  const report = await Report.findByPk(req.params.id);
  if (!report) throw new HttpError(404, 'Report not found');
  await changeStatus({ report, status, actor: req.user, remarks, rejectionReason: rejection_reason });
  const full = await Report.findByPk(report.report_id, { include: includes({ withHistory: true }) });
  res.json({ success: true, data: serialize(full, req.user) });
}

async function assign(req, res) {
  const report = await Report.findByPk(req.params.id);
  if (!report) throw new HttpError(404, 'Report not found');
  if (['Rejected', 'Resolved/Closed'].includes(report.report_status)) throw new HttpError(400, `A "${report.report_status}" report cannot be assigned`);
  // Workflow #30: the administrator verifies before assigning. A report that already has an officer
  // (Assigned, In Progress, Additional Information Required) may be re-assigned.
  if (!report.assigned_officer_id && report.report_status !== 'Verified') {
    throw new HttpError(400, 'Verify the report first. You can assign an officer once it is Verified.');
  }
  const officer = await User.findByPk(req.body.officer_id, { include: [{ model: Role, as: 'role' }] });
  if (!officer || officer.role.role_name !== ROLES.OFFICER || !officer.is_active) {
    throw new HttpError(400, 'officer_id must be an active Traffic Officer');
  }
  await changeStatus({ report, status: 'Assigned', actor: req.user, remarks: req.body.remarks, assignedOfficerId: officer.user_id });
  const full = await Report.findByPk(report.report_id, { include: includes({ withHistory: true }) });
  res.json({ success: true, data: serialize(full, req.user) });
}

module.exports = { list, getOne, setStatus, assign };
