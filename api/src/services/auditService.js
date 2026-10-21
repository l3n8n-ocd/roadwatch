const { Op } = require('sequelize');
const { AuditLog, User, Role } = require('../models');
const { ROLES } = require('../config/constants');

// FR-14: record important actions. Pass { transaction } when called inside one.
async function recordAudit(userId, action, details = null, transaction) {
  return AuditLog.create(
    { user_id: userId, action_taken: action, action_details: details ? JSON.stringify(details) : null },
    { transaction }
  );
}

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

function parseDetails(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

// Action log (#27): newest first, paged. userId limits it to one person's actions; staffOnly (the admin
// "All staff" view) leaves out reporters and adds who did each action.
// Details come back as an object; user ids inside them get the person's name so the log reads well.
async function listAuditLogs({ userId, action, period, page, limit, staffOnly = false }) {
  const where = {};
  if (userId) where.user_id = userId;
  if (action) where.action_taken = { [Op.or]: [action, { [Op.like]: `${action}.%` }] };
  if (PERIOD_DAYS[period]) where.timestamp = { [Op.gte]: new Date(Date.now() - PERIOD_DAYS[period] * 86400000) };

  const result = await AuditLog.findAndCountAll({
    where,
    order: [['timestamp', 'DESC'], ['log_id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    include: staffOnly
      ? [{
        model: User, as: 'user', attributes: ['user_id', 'full_name'], required: true,
        include: [{ model: Role, as: 'role', required: true, where: { role_name: { [Op.ne]: ROLES.REPORTER } } }],
      }]
      : [],
  });

  const rows = result.rows.map((log) => ({ log, details: parseDetails(log.action_details) }));
  const ids = new Set();
  rows.forEach(({ details }) => {
    if (details.target_user_id) ids.add(details.target_user_id);
    if (details.assigned_officer_id) ids.add(details.assigned_officer_id);
  });
  const names = new Map();
  if (ids.size) {
    const people = await User.findAll({ where: { user_id: [...ids] }, attributes: ['user_id', 'full_name'] });
    people.forEach((p) => names.set(p.user_id, p.full_name));
  }

  const data = rows.map(({ log, details }) => {
    if (names.has(details.target_user_id)) details.target_name = names.get(details.target_user_id);
    if (names.has(details.assigned_officer_id)) details.officer_name = names.get(details.assigned_officer_id);
    const row = {
      log_id: log.log_id,
      user_id: log.user_id,
      action_taken: log.action_taken,
      action_details: details,
      timestamp: log.timestamp,
    };
    if (staffOnly && log.user) row.user = { user_id: log.user.user_id, full_name: log.user.full_name, role: log.user.role?.role_name };
    return row;
  });
  return { data, pagination: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) } };
}

module.exports = { recordAudit, listAuditLogs };
