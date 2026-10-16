const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const { recordAudit } = require('../services/auditService');
const HttpError = require('../utils/httpError');

async function roleByName(name) {
  const role = await Role.findOne({ where: { role_name: name } });
  if (!role) throw new HttpError(400, 'Unknown role');
  return role;
}

// POST /api/users (admin only): creates a Traffic Officer (or any role) account.
async function create(req, res) {
  const { full_name, contact_email, contact_phone, password, role } = req.body;
  if (await User.findOne({ where: { contact_email } })) throw new HttpError(409, 'Email is already registered');
  const r = await roleByName(role);
  const user = await User.create({
    role_id: r.role_id, full_name, contact_email, contact_phone: contact_phone || null,
    password_hash: await bcrypt.hash(password, 12),
  });
  await recordAudit(req.user.user_id, 'user.created', { target_user_id: user.user_id, role });
  res.status(201).json({ success: true, data: { user_id: user.user_id, full_name, contact_email, role, is_active: true } });
}

async function list(req, res) {
  const where = {};
  if (req.validQuery.role) {
    const r = await roleByName(req.validQuery.role);
    where.role_id = r.role_id;
  }
  const users = await User.findAll({ where, include: [{ model: Role, as: 'role', attributes: ['role_name'] }], order: [['created_at', 'DESC']] });
  res.json({ success: true, data: users.map((u) => ({ ...u.toJSON(), role: u.role.role_name })) });
}

async function setRole(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user.user_id === req.user.user_id) throw new HttpError(400, 'You cannot change your own role');
  const r = await roleByName(req.body.role);
  user.role_id = r.role_id;
  await user.save();
  await recordAudit(req.user.user_id, 'user.role_changed', { target_user_id: user.user_id, role: r.role_name });
  res.json({ success: true, data: { user_id: user.user_id, role: r.role_name } });
}

// Deactivate or reactivate. The account, its reports, history and audit logs all stay intact.
async function setActive(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user.user_id === req.user.user_id) throw new HttpError(400, 'You cannot deactivate your own account');
  user.is_active = req.body.is_active;
  await user.save();
  await recordAudit(req.user.user_id, user.is_active ? 'user.reactivated' : 'user.deactivated', { target_user_id: user.user_id });
  res.json({ success: true, data: { user_id: user.user_id, is_active: user.is_active } });
}

module.exports = { create, list, setRole, setActive };
