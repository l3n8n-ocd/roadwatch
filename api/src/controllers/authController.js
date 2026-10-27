const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const { ROLES, ROLE_PLATFORM } = require('../config/constants');
const { signToken } = require('../middleware/auth');
const { recordAudit, listAuditLogs } = require('../services/auditService');
const { makeResetCode, isValidResetCode, CODE_MINUTES } = require('../services/passwordResetService');
const { sendMail, mailConfigured } = require('../config/mailer');
const HttpError = require('../utils/httpError');
const { assertStrongPassword } = require('../utils/passwordStrength');

const publicUser = (u, role) => ({ user_id: u.user_id, full_name: u.full_name, contact_email: u.contact_email, contact_phone: u.contact_phone, role });

// Public registration ALWAYS creates a Reporter. Any "role" sent by the client is ignored
// (the validation schema strips unknown fields, and the role is looked up here).
async function register(req, res) {
  const { full_name, contact_email, contact_phone, password } = req.body;
  if (await User.findOne({ where: { contact_email } })) throw new HttpError(409, 'Email is already registered');
  assertStrongPassword(password, { name: full_name, email: contact_email }, 'password');
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
  // Same message for an unknown email and a wrong password, so nothing is leaked.
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Invalid email or password');
  // Deactivated and wrong-platform answers come only after the right password, so they never reveal
  // whether an email exists (issue #40, Figma M0/Login/Deactivated).
  if (!user.is_active) {
    throw new HttpError(403, 'This account was deactivated. Contact the RoadWatch administrator.', { code: 'ACCOUNT_DEACTIVATED' });
  }
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

// Edit profile (#25): name and phone only.
async function updateMe(req, res) {
  const user = await User.findByPk(req.user.user_id);
  user.full_name = req.body.full_name;
  if (req.body.contact_phone !== undefined) user.contact_phone = req.body.contact_phone || null;
  await user.save();
  await recordAudit(user.user_id, 'account.profile_updated');
  res.json({ success: true, data: { user: publicUser(user, req.user.role) } });
}

// Change password (#25). A wrong current password is a 400 (not 401) so the apps do not sign the user out.
async function changePassword(req, res) {
  const user = await User.scope('withPassword').findByPk(req.user.user_id);
  if (!(await bcrypt.compare(req.body.current_password, user.password_hash))) {
    throw new HttpError(400, 'Your current password is incorrect.', { current_password: ['Your current password is incorrect.'] });
  }
  assertStrongPassword(req.body.new_password, { name: user.full_name, email: user.contact_email }, 'new_password');
  user.password_hash = await bcrypt.hash(req.body.new_password, 12);
  await user.save();
  await recordAudit(user.user_id, 'account.password_changed');
  res.json({ success: true, data: { message: 'Password changed' } });
}

// Forgot password, step 1 (#37): email an 8-character code. The answer is the same whether or not the
// email has an account (or the account is deactivated), and the email is sent in the background,
// so neither the text nor the timing tells anyone which emails are registered.
const RESET_SENT = 'If this email has a RoadWatch account, we sent it a code. It works for 15 minutes.';
async function forgotPassword(req, res) {
  const user = await User.scope('withPassword').findOne({ where: { contact_email: req.body.contact_email } });
  if (user && user.is_active) {
    await recordAudit(user.user_id, 'auth.password_reset_requested');
    if (mailConfigured()) {
      const code = makeResetCode(user);
      sendMail({
        to: user.contact_email,
        subject: `RoadWatch: your code is ${code}`,
        text: `Hi ${user.full_name},\n\nYour RoadWatch code is ${code}. Type it in the app to choose a new password. `
          + `It works for ${CODE_MINUTES} minutes and only once.\n\nIf you did not ask for this, ignore this email; `
          + 'your password stays the same.\n\nRoadWatch',
      }).catch((err) => console.warn('Reset code email not sent:', err.message));
    } else {
      console.warn('Reset code requested but email is off (MAIL_PROVIDER).');
    }
  }
  res.json({ success: true, data: { message: RESET_SENT } });
}

// Forgot password, step 2 (#37): email + code + new password. Other signed-in devices stay signed in.
const BAD_CODE = 'This code is wrong or has expired. Send a new code.';
async function resetPassword(req, res) {
  const { contact_email, reset_code, new_password } = req.body;
  const user = await User.scope('withPassword').findOne({ where: { contact_email } });
  // One answer for an unknown email, a deactivated account and a wrong or old code.
  if (!user || !user.is_active || !isValidResetCode(user, reset_code)) {
    throw new HttpError(400, BAD_CODE, { reset_code: [BAD_CODE] });
  }
  // Checked after the code, so a weak password never reveals whether the email has an account.
  assertStrongPassword(new_password, { name: user.full_name, email: user.contact_email }, 'new_password');
  user.password_hash = await bcrypt.hash(new_password, 12);
  await user.save();
  await recordAudit(user.user_id, 'account.password_reset');
  if (mailConfigured()) {
    sendMail({
      to: user.contact_email,
      subject: 'RoadWatch: your password was changed',
      text: `Hi ${user.full_name},\n\nYour RoadWatch password was changed with a reset code. `
        + 'If this was not you, contact the RoadWatch administrator.\n\nRoadWatch',
    }).catch((err) => console.warn('Email not sent:', err.message));
  }
  res.json({ success: true, data: { message: 'Password changed. Log in with your new password.' } });
}

// Action log, own actions (#27).
async function myActivity(req, res) {
  const result = await listAuditLogs({ ...req.validQuery, userId: req.user.user_id });
  res.json({ success: true, ...result });
}

module.exports = { register, login, me, updateMe, changePassword, forgotPassword, resetPassword, myActivity };
