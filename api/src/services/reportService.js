const { Op } = require('sequelize');
const { Report, User, Role, AccidentType, ReportPhoto, ReportStatusHistory } = require('../models');
const { STATUSES, ROLES } = require('../config/constants');

// Reporter contact details are restricted (course UI spec): only the reporter, an Administrator,
// or the Traffic Officer assigned to the report can see them.
const reporterAttrs = ['user_id', 'full_name', 'contact_email', 'contact_phone'];

function includes({ withHistory = false } = {}) {
  const list = [
    { model: User, as: 'reporter', attributes: reporterAttrs },
    { model: User, as: 'assignedOfficer', attributes: ['user_id', 'full_name'] },
    { model: AccidentType, as: 'accidentType', attributes: ['type_id', 'type_name'] },
    { model: ReportPhoto, as: 'photos' },
  ];
  if (withHistory) {
    list.push({ model: ReportStatusHistory, as: 'statusHistory', include: [{
      model: User, as: 'changedBy', attributes: ['full_name'],
      // The role lets staff screens say "Maria Cruz (Admin)"; the reporter app shows only the role.
      include: [{ model: Role, as: 'role', attributes: ['role_name'] }],
    }] });
  }
  return list;
}

// Removes the reporter's contact details unless the viewer is allowed to see them.
function serialize(report, viewer) {
  const data = report.toJSON();
  const isOwner = data.reporter_id === viewer.user_id;
  const isAdmin = viewer.role === ROLES.ADMIN;
  const isAssignedOfficer = viewer.role === ROLES.OFFICER && data.assigned_officer_id === viewer.user_id;
  if (data.reporter && !(isOwner || isAdmin || isAssignedOfficer)) {
    data.reporter = { user_id: data.reporter.user_id, full_name: data.reporter.full_name };
  }
  data.is_verified_record = data.record_type === 'verified_record';
  return data;
}

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// A Report ID as people type it: the code shown in the apps (RW-000004, rw4), #4 or plain 4 (#39).
function reportIdFromSearch(text) {
  const match = /^(?:rw-?|#)?(\d{1,9})$/i.exec(text.replace(/\s+/g, ''));
  return match ? Number(match[1]) : null;
}

// FR-11: search and filter by date, location, status, accident type (plus record type and free text).
function buildWhere(q = {}) {
  const where = {};
  if (q.status) where.report_status = q.status;
  if (q.accident_type_id) where.accident_type_id = q.accident_type_id;
  if (q.record_type) where.record_type = q.record_type;
  if (q.assigned_officer_id) where.assigned_officer_id = q.assigned_officer_id;
  if (q.date_from || q.date_to) {
    where.accident_date = {};
    if (q.date_from) where.accident_date[Op.gte] = q.date_from;
    if (q.date_to) where.accident_date[Op.lte] = q.date_to;
  }
  if (q.location) where.accident_location = { [Op.like]: `%${escapeLike(q.location)}%` };
  if (q.q) {
    const like = `%${escapeLike(q.q)}%`;
    const or = [{ accident_location: { [Op.like]: like } }, { accident_description: { [Op.like]: like } }];
    const reportId = reportIdFromSearch(q.q);
    if (reportId) or.push({ report_id: reportId });
    where[Op.and] = [{ [Op.or]: or }];
  }
  return where;
}

async function listReports({ where, query, viewer }) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const result = await Report.findAndCountAll({
    where,
    include: includes(),
    order: [['date_submitted', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });
  return {
    data: result.rows.map((r) => serialize(r, viewer)),
    pagination: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) },
  };
}

module.exports = { includes, serialize, buildWhere, listReports, STATUSES };
