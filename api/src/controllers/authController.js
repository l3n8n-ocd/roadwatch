const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const { ROLES, ROLE_PLATFORM } = require('../config/constants');
const { signToken } = require('../middleware/auth');
const { recordAudit } = require('../services/auditService');
const HttpError = require('../utils/httpError');

const publicUser = (u, role) => ({ user_id: u.user_id, full_name: u.full_name, contact_email: u.contact_email, contact_phone: u.contact_phone, role });

// Public registration ALWAYS creates a Reporter. Any "role" sent by the client is ignored
// (the validation schema strips unknown fields, and the role is looked up here).
async function register(req, res) {
  const { full_name, contact_email, contact_phone, password } = req.body;
  if (await User.findOne({ where: { contact_email } })) throw new HttpError(409, 'Email is already registered');
  const role = await Role.findOne({ where: { role_name: ROLES.REPORTER } });
  if (!role) throw new HttpError(500, 'Roles are not seeded. Run database/seed.sql first.');
  const user = await User.create({
    role_id: role.role_id, full_name, contact_email, contact_phone: contact_phone || null,
    password_hash: await bcrypt.hash(password, 12),
  });
  await recordAudit(user.user_id, 'account.registered', { email: contact_email });
  res.status(201).json({ success: true, data: { user: publicUser(user, ROLES.REPORTER), token: signToken(user) } });
}

async function login(req, res) {
  const { contact_email, password, platform } = req.body;
  const user = await User.scope('withPassword').findOne({ where: { contact_email }, include: [{ model: Role, as: 'role' }] });
  // Same message for unknown email, wrong password and deactivated account, so nothing is leaked.
  const ok = user && user.is_active && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Invalid email or password');
  // Checked only after the password, so the platform message never reveals whether an email exists.
  const role = user.role.role_name;
  const home = ROLE_PLATFORM[role];
  if (platform !== home) {
    await recordAudit(user.user_id, 'auth.login_wrong_platform', { platform });
    const message = home === 'mobile'
      ? `${role} accounts sign in on the RoadWatch Android app.`
      : 'Administrators sign in on the RoadWatch web dashboard.';
    throw new HttpError(403, message, { code: 'WRONG_PLATFORM', platform: home });
  }
  await recordAudit(user.user_id, 'auth.login', { platform });
  res.json({ success: true, data: { token: signToken(user), user: publicUser(user, user.role.role_name) } });
}

async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, me };
