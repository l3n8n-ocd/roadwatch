const nodemailer = require('nodemailer');

// Nodemailer is the sending layer. Resend is used through its SMTP endpoint.
// Note: Resend can only email other people after you verify your own domain.
// Default is MAIL_PROVIDER=smtp (Gmail SMTP with an app password), which is the decided demo setup.
function resendTransport() {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
  });
}

function smtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM;
  const provider = (process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
  const primary = provider === 'smtp' ? smtpTransport() : resendTransport();
  try {
    return await primary.sendMail({ from, to, subject, text, html });
  } catch (err) {
    if (provider !== 'smtp' && process.env.SMTP_USER) {
      console.warn('Resend failed, falling back to SMTP:', err.message);
      return smtpTransport().sendMail({ from, to, subject, text, html });
    }
    throw err;
  }
}

module.exports = { sendMail };
