const { Notification, User } = require('../models');
const { sendMail } = require('../config/mailer');

// FR-09: in-app notification (always) + email (best effort, never blocks the request).
async function notifyUser(userId, reportId, message, { transaction, email } = {}) {
  await Notification.create({ user_id: userId, report_id: reportId || null, message: message.slice(0, 255) }, { transaction });
  if (email) emailUser(userId, email.subject, email.text || message);
}

function mailConfigured() {
  const provider = (process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
  return provider === 'smtp' ? Boolean(process.env.SMTP_USER && process.env.SMTP_PASS) : Boolean(process.env.RESEND_API_KEY);
}

function emailUser(userId, subject, text) {
  if (!mailConfigured()) return;
  User.findByPk(userId)
    .then((u) => u && sendMail({ to: u.contact_email, subject, text }))
    .catch((err) => console.warn('Email not sent:', err.message));
}

module.exports = { notifyUser, emailUser };
