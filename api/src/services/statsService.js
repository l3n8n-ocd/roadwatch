const { fn, col, Op, literal } = require('sequelize');
const { Report, AccidentType, User, Role } = require('../models');
const { ROLES } = require('../config/constants');

const count = () => [fn('COUNT', col('reports.report_id')), 'count'];

// FR-10 dashboard numbers.
async function dashboardStats() {
  const [total, pending, verified, closed] = await Promise.all([
    Report.count(),
    Report.count({ where: { report_status: { [Op.in]: ['Submitted', 'Under Review', 'Additional Information Required'] } } }),
    Report.count({ where: { record_type: 'verified_record' } }),
    Report.count({ where: { report_status: 'Resolved/Closed' } }),
  ]);
  const byStatus = await Report.findAll({ attributes: ['report_status', count()], group: ['report_status'], raw: true });
  const byType = await Report.findAll({
    attributes: [[col('accidentType.type_name'), 'type_name'], count()],
    include: [{ model: AccidentType, as: 'accidentType', attributes: [] }],
    group: ['accidentType.type_id', 'accidentType.type_name'], raw: true,
  });
  // Trend: reports per accident date for the last 30 days.
  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const trend = await Report.findAll({
    attributes: ['accident_date', count()],
    where: { accident_date: { [Op.gte]: since } },
    group: ['accident_date'], order: [['accident_date', 'ASC']], raw: true,
  });
  // Accident-prone areas: most frequent locations.
  const hotspots = await Report.findAll({
    attributes: ['accident_location', count()],
    group: ['accident_location'], order: [[literal('count'), 'DESC']], limit: 10, raw: true,
  });
  const mapPoints = await Report.findAll({
    attributes: ['report_id', 'latitude', 'longitude', 'accident_location', 'report_status', 'record_type'],
    where: { latitude: { [Op.ne]: null }, longitude: { [Op.ne]: null } },
    order: [['date_submitted', 'DESC']], limit: 200, raw: true,
  });
  const recent = await Report.findAll({
    include: [{ model: AccidentType, as: 'accidentType', attributes: ['type_name'] }, { model: User, as: 'reporter', attributes: ['full_name'] }],
    order: [['date_submitted', 'DESC']], limit: 10,
  });
  const n = (rows) => rows.map((r) => ({ ...r, count: Number(r.count) }));
  return {
    cards: { total, pending, verified, closed },
    by_status: n(byStatus), by_type: n(byType), trend: n(trend), hotspots: n(hotspots),
    map_points: mapPoints, recent: recent.map((r) => r.toJSON()),
  };
}

// Public totals for the landing stats bar (#40). Counts only: no names, places or contact details.
async function publicStats() {
  const [reportsReceived, verifiedRecords, casesResolved, activeOfficers] = await Promise.all([
    Report.count(),
    Report.count({ where: { record_type: 'verified_record' } }),
    Report.count({ where: { report_status: 'Resolved/Closed' } }),
    User.count({ where: { is_active: true }, include: [{ model: Role, as: 'role', where: { role_name: ROLES.OFFICER } }] }),
  ]);
  return {
    reports_received: reportsReceived,
    verified_records: verifiedRecords,
    cases_resolved: casesResolved,
    active_officers: activeOfficers,
  };
}

// Public road updates (#23): verified records whose accident happened in the last 7 days.
// Only these fields leave the server: no reporter, contact details, description, remarks or photos.
const UPDATE_DAYS = 7;
const UPDATE_LIMIT = 20;
async function publicUpdates() {
  const since = new Date(Date.now() - UPDATE_DAYS * 86400000).toISOString().slice(0, 10);
  const rows = await Report.findAll({
    where: { record_type: 'verified_record', accident_date: { [Op.gte]: since } },
    attributes: ['report_id', 'accident_date', 'accident_time', 'accident_location', 'latitude', 'longitude', 'report_status'],
    include: [{ model: AccidentType, as: 'accidentType', attributes: ['type_name'] }],
    order: [['accident_date', 'DESC'], ['accident_time', 'DESC'], ['report_id', 'DESC']],
    limit: UPDATE_LIMIT,
  });
  return rows.map((r) => ({
    report_id: r.report_id,
    accident_type: { type_name: r.accidentType?.type_name || 'Other' },
    accident_date: r.accident_date,
    accident_time: r.accident_time,
    accident_location: r.accident_location,
    latitude: r.latitude === null ? null : Number(r.latitude),
    longitude: r.longitude === null ? null : Number(r.longitude),
    report_status: r.report_status,
    record_type: 'verified_record',
  }));
}

// FR-12: daily, weekly, monthly or annual summary around a given date.
function periodRange(period, dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  let from; let to;
  if (period === 'daily') { from = d; to = d; }
  else if (period === 'weekly') { // Monday to Sunday
    const dow = (d.getUTCDay() + 6) % 7;
    from = new Date(d.getTime() - dow * 86400000); to = new Date(from.getTime() + 6 * 86400000);
  } else if (period === 'monthly') {
    from = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); to = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  } else {
    from = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); to = new Date(Date.UTC(d.getUTCFullYear(), 11, 31));
  }
  const f = (x) => x.toISOString().slice(0, 10);
  return { from: f(from), to: f(to) };
}

async function periodSummary(period, dateStr) {
  const { from, to } = periodRange(period, dateStr);
  const where = { accident_date: { [Op.between]: [from, to] } };
  const group = async (field) => (await Report.findAll({ attributes: [field, count()], where, group: [field], raw: true }))
    .map((r) => ({ ...r, count: Number(r.count) }));
  return {
    period, from, to,
    total: await Report.count({ where }),
    verified_records: await Report.count({ where: { ...where, record_type: 'verified_record' } }),
    by_status: await group('report_status'),
    by_injury: await group('injury_information'),
    by_type: (await Report.findAll({
      attributes: [[col('accidentType.type_name'), 'type_name'], count()], where,
      include: [{ model: AccidentType, as: 'accidentType', attributes: [] }],
      group: ['accidentType.type_id', 'accidentType.type_name'], raw: true,
    })).map((r) => ({ ...r, count: Number(r.count) })),
  };
}

module.exports = { dashboardStats, publicStats, publicUpdates, periodSummary, periodRange };
