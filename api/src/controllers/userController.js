const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const { recordAudit } = require('../services/auditService');
const { emailUser } = require('../services/notificationService');
const { ROLES } = require('../config/constants');
const HttpError = require('../utils/httpError');
const { assertStrongPassword } = require('../utils/passwordStrength');

async function roleByName(name) {
  const role = await Role.findOne({ where: { role_name: name } });
  if (!role) throw new HttpError(400, 'Unknown role');
  return role;
}

// POST /api/users (admin only): creates a Traffic Officer (or any role) account.
async function create(req, res) {
  const { full_name, contact_email, contact_phone, password, role } = req.body;
  if (await User.findOne({ where: { contact_email } })) throw new HttpError(409, 'Email is already registered');
  assertStrongPassword(password, { name: full_name, email: contact_email }, 'password');
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

// Admin reset (#37): set a temporary password for a Reporter or Traffic Officer. The admin gives it to the
// person directly; the email only says the password was reset (never the password itself).
async function resetPassword(req, res) {
  const user = await User.scope('withPassword').findByPk(req.params.id, { include: [{ model: Role, as: 'role' }] });
  if (!user) throw new HttpError(404, 'User not found');
  if (user.user_id === req.user.user_id) throw new HttpError(400, 'Use Change password for your own account');
  if (user.role.role_name === ROLES.ADMIN) {
    throw new HttpError(400, 'Administrators reset their own password with Forgot password on the sign-in page');
  }
  assertStrongPassword(req.body.new_password, { name: user.full_name, email: user.contact_email }, 'new_password');
  user.password_hash = await bcrypt.hash(req.body.new_password, 12);
  await user.save();
  await recordAudit(req.user.user_id, 'user.password_reset', { target_user_id: user.user_id });
  emailUser(user.user_id, 'RoadWatch: your password was reset',
    `Hi ${user.full_name},\n\nA RoadWatch administrator reset your password. They will give you the temporary `
    + 'password in person or by phone. Log in with it, then change it in Settings > Change password.\n\nRoadWatch');
  res.json({ success: true, data: { user_id: user.user_id } });
}

module.exports = { create, list, setRole, setActive, resetPassword };
