const { Notification, AccidentType } = require('../models');
const { dashboardStats, publicStats: countPublicStats, publicUpdates: listPublicUpdates, periodSummary } = require('../services/statsService');
const { buildWhere } = require('../services/reportService');
const { csvBuffer, pdfBuffer } = require('../services/exportService');
const { recordAudit, listAuditLogs } = require('../services/auditService');
const { getSettings, setAlertRangeKm } = require('../services/settingsService');
const HttpError = require('../utils/httpError');

// ----- notifications -----
async function listNotifications(req, res) {
  const rows = await Notification.findAll({ where: { user_id: req.user.user_id }, order: [['created_at', 'DESC']], limit: 100 });
  res.json({ success: true, data: rows, unread: rows.filter((n) => !n.is_read).length });
}
async function markRead(req, res) {
  const n = await Notification.findOne({ where: { notification_id: req.params.id, user_id: req.user.user_id } });
  if (!n) throw new HttpError(404, 'Notification not found');
  n.is_read = true;
  await n.save();
  res.json({ success: true, data: n });
}
async function markAllRead(req, res) {
  await Notification.update({ is_read: true }, { where: { user_id: req.user.user_id, is_read: false } });
  res.json({ success: true });
}

// ----- accident types -----
async function listTypes(req, res) {
  res.json({ success: true, data: await AccidentType.findAll({ order: [['type_name', 'ASC']] }) });
}
async function createType(req, res) {
  const row = await AccidentType.create({ type_name: req.body.type_name });
  await recordAudit(req.user.user_id, 'accident_type.created', { type_id: row.type_id, type_name: row.type_name });
  res.status(201).json({ success: true, data: row });
}

// ----- public (no token) -----
// Landing stats bar (#40). Browsers and proxies may reuse the answer for a minute.
async function publicStats(req, res) {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: await countPublicStats() });
}

// Public road updates on the landing page (#23).
async function publicUpdates(req, res) {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: await listPublicUpdates() });
}

// ----- action log, all staff (admin, #27) -----
async function auditLogs(req, res) {
  const { user_id: userId, ...query } = req.validQuery;
  const result = await listAuditLogs({ ...query, userId, staffOnly: true });
  res.json({ success: true, ...result });
}

// ----- dashboard and exports (admin) -----
async function stats(req, res) {
  res.json({ success: true, data: await dashboardStats() });
}
async function summary(req, res) {
  const date = req.validQuery.date || new Date().toISOString().slice(0, 10);
  res.json({ success: true, data: await periodSummary(req.validQuery.period, date) });
}
async function exportCsv(req, res) {
  const buf = await csvBuffer(buildWhere(req.validQuery));
  await recordAudit(req.user.user_id, 'export.csv');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="roadwatch-reports.csv"' }).send(buf);
}
async function exportPdf(req, res) {
  const buf = await pdfBuffer(buildWhere(req.validQuery), req.validQuery);
  await recordAudit(req.user.user_id, 'export.pdf');
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="roadwatch-reports.pdf"' }).send(buf);
}

// ----- admin settings (#57) -----
async function settings(req, res) {
  res.json({ success: true, data: await getSettings() });
}
async function updateSettings(req, res) {
  res.json({ success: true, data: await setAlertRangeKm(req.body.alert_range_km, req.user) });
}

module.exports = { settings, updateSettings, publicStats, publicUpdates, auditLogs, listNotifications, markRead, markAllRead, listTypes, createType, stats, summary, exportCsv, exportPdf };
