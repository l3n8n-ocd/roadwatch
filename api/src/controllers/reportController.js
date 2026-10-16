// Reporter side: submit, list my reports, track one report, add photos.
const { sequelize, Report, ReportStatusHistory, AccidentType, ReportPhoto, User, Role } = require('../models');
const { ROLES } = require('../config/constants');
const { includes, serialize, listReports } = require('../services/reportService');
const { recordAudit } = require('../services/auditService');
const { notifyUser } = require('../services/notificationService');
const { uploadImageBuffer } = require('../services/cloudinaryService');
const HttpError = require('../utils/httpError');

async function create(req, res) {
  const b = req.body;
  if (!(await AccidentType.findByPk(b.accident_type_id))) throw new HttpError(400, 'Unknown accident_type_id');
  const t = await sequelize.transaction();
  let report;
  try {
    report = await Report.create({
      reporter_id: req.user.user_id,
      accident_type_id: b.accident_type_id,
      accident_date: b.accident_date,
      accident_time: b.accident_time,
      accident_location: b.accident_location,
      latitude: b.latitude ?? null,
      longitude: b.longitude ?? null,
      vehicles_involved: b.vehicles_involved || null,
      injury_information: b.injury_information,
      accident_description: b.accident_description,
      record_type: 'public_submission',
      report_status: 'Submitted',
    }, { transaction: t });
    await ReportStatusHistory.create(
      { report_id: report.report_id, changed_by_user_id: req.user.user_id, previous_status: null, new_status: 'Submitted' },
      { transaction: t }
    );
    await recordAudit(req.user.user_id, 'report.created', { report_id: report.report_id }, t);
    await notifyUser(req.user.user_id, report.report_id, `Your report #${report.report_id} was submitted. We will review it soon.`, {
      transaction: t,
      email: { subject: `RoadWatch: report #${report.report_id} received`, text: `Thank you. Your accident report #${report.report_id} was received and is now "Submitted". You can track it in the app.` },
    });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
  // Tell administrators (in-app only).
  const admins = await User.findAll({ include: [{ model: Role, as: 'role', where: { role_name: ROLES.ADMIN }, attributes: [] }], where: { is_active: true } });
  await Promise.all(admins.map((a) => notifyUser(a.user_id, report.report_id, `New accident report #${report.report_id} at ${report.accident_location}`)));
  const full = await Report.findByPk(report.report_id, { include: includes({ withHistory: true }) });
  res.status(201).json({ success: true, data: serialize(full, req.user) });
}

// "My reports": only the logged-in reporter's own reports.
async function listMine(req, res) {
  const where = { reporter_id: req.user.user_id };
  if (req.validQuery.status) where.report_status = req.validQuery.status;
  const result = await listReports({ where, query: req.validQuery, viewer: req.user });
  res.json({ success: true, ...result });
}

// FR-06 tracking: one report with its photos and status history.
async function getOne(req, res) {
  const report = await Report.findByPk(req.params.id, { include: includes({ withHistory: true }) });
  // 404 (not 403) for someone else's report so ids cannot be probed.
  if (!report || report.reporter_id !== req.user.user_id) throw new HttpError(404, 'Report not found');
  res.json({ success: true, data: serialize(report, req.user) });
}

async function addPhotos(req, res) {
  const report = await Report.findByPk(req.params.id);
  if (!report || report.reporter_id !== req.user.user_id) throw new HttpError(404, 'Report not found');
  if (!req.files || !req.files.length) throw new HttpError(400, 'Attach at least one image in the multipart field "photos"');
  const existing = await ReportPhoto.count({ where: { report_id: report.report_id } });
  if (existing + req.files.length > 10) throw new HttpError(400, 'A report can have at most 10 photos');
  const saved = [];
  for (const file of req.files) {
    const result = await uploadImageBuffer(file.buffer, `report-${report.report_id}-${Date.now()}-${saved.length}`);
    saved.push(await ReportPhoto.create({ report_id: report.report_id, cloudinary_url: result.secure_url }));
  }
  await recordAudit(req.user.user_id, 'report.photos_added', { report_id: report.report_id, count: saved.length });
  res.status(201).json({ success: true, data: saved });
}

module.exports = { create, listMine, getOne, addPhotos };
