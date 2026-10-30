const { Op } = require('sequelize');
const { Report, User, Role, AccidentType, ReportPhoto, ReportStatusHistory } = require('../models');
const { STATUSES, ROLES } = require('../config/constants');
const { dispatchSummaries } = require('./dispatchService');
const { autoPriority } = require('./priorityService');

// Reporter contact details are restricted (UI spec): only the reporter, an Administrator,
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
  // Priority is for staff only (#54): reporters never see it.
  if (viewer.role === ROLES.REPORTER) {
    delete data.priority;
    delete data.priority_source;
  } else if (data.accidentType) {
    // What the automatic rule gives, so staff screens can show "Set by admin · was High".
    data.priority_auto = autoPriority(data.accidentType.type_name, data.injury_information);
  }
  return data;
}

const isStaff = (viewer) => viewer.role === ROLES.ADMIN || viewer.role === ROLES.OFFICER;

// Adds the nearby-officer summary (#57) to serialized reports for staff screens.
async function withDispatch(list, viewer) {
  if (!isStaff(viewer) || !list.length) return list;
  const summaries = await dispatchSummaries(list.map((r) => r.report_id));
  list.forEach((r) => { r.dispatch = summaries.get(r.report_id) || null; });
  return list;
}

// One report as the viewer may see it, with the nearby-officer summary for staff.
async function present(report, viewer) {
  const [data] = await withDispatch([serialize(report, viewer)], viewer);
  return data;
}

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// A Report ID as people type it: the code shown in the apps (RW-000004, rw4), #4 or plain 4 (issue #39).
function reportIdFromSearch(text) {
  const match = /^(?:rw-?|#)?(\d{1,9})$/i.exec(text.replace(/\s+/g, ''));
  return match ? Number(match[1]) : null;
}

// FR-11: search and filter by date, location, status, accident type (plus record type and free text).
function buildWhere(q = {}) {
  const where = {};
  if (q.status) where.report_status = q.status;
  if (q.priority) where.priority = q.priority;
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
    // sort=priority (#54): Urgent first (ENUM order in schema.sql), then newest.
    order: query.sort === 'priority' ? [['priority', 'DESC'], ['date_submitted', 'DESC']] : [['date_submitted', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });
  return {
    data: await withDispatch(result.rows.map((r) => serialize(r, viewer)), viewer),
    pagination: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) },
  };
}

module.exports = { includes, serialize, present, buildWhere, listReports, STATUSES };
