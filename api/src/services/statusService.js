const { sequelize, Report, ReportStatusHistory } = require('../models');
const { VERIFIED_STATUSES } = require('../config/constants');
const { recordAudit } = require('./auditService');
const { notifyUser, emailUser } = require('./notificationService');
const HttpError = require('../utils/httpError');

// The one place where a report's status changes. Every change writes report_status_history and audit_logs
// in the same transaction, sets record_type, and notifies the reporter (in-app + email). An assigned officer
// is told in the app only (#37).
async function changeStatus({ report, status, actor, remarks, assignedOfficerId, rejectionReason }) {
  const previous = report.report_status;
  if (previous === status && !remarks && !assignedOfficerId) {
    throw new HttpError(400, `Report is already "${status}"`);
  }
  const t = await sequelize.transaction();
  try {
    report.report_status = status;
    if (assignedOfficerId) report.assigned_officer_id = assignedOfficerId;
    // Product rule: public submissions and officially verified records must be clearly different.
    if (VERIFIED_STATUSES.includes(status)) report.record_type = 'verified_record';
    if (status === 'Rejected') report.record_type = 'public_submission';
    if (status === 'Rejected') report.official_remarks = `Rejected: ${rejectionReason}`;
    else if (remarks !== undefined) report.official_remarks = remarks;
    await report.save({ transaction: t });

    if (previous !== status) {
      await ReportStatusHistory.create(
        { report_id: report.report_id, changed_by_user_id: actor.user_id, previous_status: previous, new_status: status },
        { transaction: t }
      );
    }
    await recordAudit(actor.user_id, 'report.status_changed', {
      report_id: report.report_id, from: previous, to: status,
      ...(assignedOfficerId ? { assigned_officer_id: assignedOfficerId } : {}),
      ...(status === 'Rejected' ? { reason: rejectionReason } : {}),
    }, t);
    const msg = `Your report #${report.report_id} is now "${status}".`;
    await notifyUser(report.reporter_id, report.report_id, msg, { transaction: t });
    if (assignedOfficerId) {
      await notifyUser(assignedOfficerId, report.report_id, `Report #${report.report_id} was assigned to you.`, { transaction: t });
    }
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
  // Email the reporter after commit (best effort, #37).
  emailUser(report.reporter_id, `RoadWatch report #${report.report_id}: ${status}`,
    `Your accident report #${report.report_id} status is now "${status}".${report.official_remarks ? `\n\nRemarks: ${report.official_remarks}` : ''}`);
  return report;
}

module.exports = { changeStatus };
