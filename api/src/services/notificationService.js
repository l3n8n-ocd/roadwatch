const { Notification, User } = require('../models');
const { sendMail, mailConfigured } = require('../config/mailer');

async function notifyUser(userId, reportId, message, { transaction, email } = {}) {
  await Notification.create(
    { user_id: userId, report_id: reportId || null, message: message.slice(0, 255) },
    { transaction }
  );
  if (email) emailUser(userId, email.subject, email.text || message);
}

// Best effort (#37): never blocks or fails the request that triggered it.
function emailUser(userId, subject, text) {
  if (!mailConfigured()) return;
  User.findByPk(userId)
    .then((u) => u && sendMail({ to: u.contact_email, subject, text }))
    .catch((err) => console.warn('Email not sent:', err.message));
}

module.exports = { notifyUser, emailUser };
