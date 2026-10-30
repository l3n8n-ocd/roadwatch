// Administrator side: review, filter, verify, assign, change status, set priority.
const { Report, User, Role, AccidentType } = require('../models');
const { ROLES } = require('../config/constants');
const { includes, present, buildWhere, listReports } = require('../services/reportService');
const { changeStatus } = require('../services/statusService');
const { autoPriority } = require('../services/priorityService');
const { closeAlerts } = require('../services/dispatchService');
const { recordAudit } = require('../services/auditService');
const HttpError = require('../utils/httpError');

async function respondWithReport(res, reportId, viewer) {
  const full = await Report.findByPk(reportId, { include: includes({ withHistory: true }) });
  res.json({ success: true, data: await present(full, viewer) });
}

async function list(req, res) {
  const result = await listReports({ where: buildWhere(req.validQuery), query: req.validQuery, viewer: req.user });
  res.json({ success: true, ...result });
}

async function getOne(req, res) {
  const report = await Report.findByPk(req.params.id, { include: includes({ withHistory: true }) });
  if (!report) throw new HttpError(404, 'Report not found');
  res.json({ success: true, data: await present(report, req.user) });
}

async function setStatus(req, res) {
  const { status, remarks, rejection_reason } = req.body;
  if (status === 'Assigned') throw new HttpError(400, 'Use PATCH /api/admin/reports/:id/assign to assign an officer');
  const report = await Report.findByPk(req.params.id);
  if (!report) throw new HttpError(404, 'Report not found');
  await changeStatus({ report, status, actor: req.user, remarks, rejectionReason: rejection_reason });
  // The administrator is handling it now, so nearby-officer alerts nobody answered are closed (#57).
  await closeAlerts(report.report_id);
  await respondWithReport(res, report.report_id, req.user);
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
  await closeAlerts(report.report_id);
  await respondWithReport(res, report.report_id, req.user);
}

// Priority (#54): the administrator overrides the automatic priority, or sends null to go back to it.
// Officers see the priority but cannot change it; every change is in the action log.
async function setPriority(req, res) {
  const report = await Report.findByPk(req.params.id, { include: [{ model: AccidentType, as: 'accidentType' }] });
  if (!report) throw new HttpError(404, 'Report not found');
  const from = { priority: report.priority, source: report.priority_source };
  if (req.body.priority === null) {
    report.priority = autoPriority(report.accidentType?.type_name, report.injury_information);
    report.priority_source = 'auto';
  } else {
    report.priority = req.body.priority;
    report.priority_source = 'admin';
  }
  await report.save();
  await recordAudit(req.user.user_id, 'report.priority_changed', {
    report_id: report.report_id, from: from.priority, to: report.priority, source: report.priority_source,
  });
  await respondWithReport(res, report.report_id, req.user);
}

module.exports = { list, getOne, setStatus, assign, setPriority };
