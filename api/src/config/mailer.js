// Email goes through the Brevo transactional email API over HTTPS (#37), using Node's built-in fetch.
// Render's free tier blocks SMTP ports, so SMTP (Gmail, Resend) is not used.
// MAIL_PROVIDER: "brevo" sends (needs BREVO_API_KEY and MAIL_FROM), "log" prints the email instead
// (local dev and tests), anything else or unset turns email off. In-app notifications work either way.
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10000;

function mailProvider() {
  const provider = (process.env.MAIL_PROVIDER || '').trim().toLowerCase();
  if (provider === 'log') return 'log';
  if (provider === 'brevo' && process.env.BREVO_API_KEY && process.env.MAIL_FROM) return 'brevo';
  return 'off';
}

function mailConfigured() {
  return mailProvider() !== 'off';
}

// MAIL_FROM is either "RoadWatch <no-reply@roadwatch-ph.me>" or a bare address.
function parseSender(value) {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(value || '');
  if (match) return { name: match[1].trim() || 'RoadWatch', email: match[2].trim() };
  return { name: 'RoadWatch', email: String(value || '').trim() };
}

async function sendMail({ to, subject, text, html }) {
  const provider = mailProvider();
  if (provider === 'off') return { skipped: true };
  if (provider === 'log') {
    console.info(`[mail:log] to=${to} subject="${subject}"\n${text || ''}`);
    return { logged: true };
  }

  const body = { sender: parseSender(process.env.MAIL_FROM), to: [{ email: to }], subject };
  if (text) body.textContent = text;
  if (html) body.htmlContent = html;
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Brevo answered ${res.status}${data.message ? `: ${data.message}` : ''}`);
  }
  return { messageId: data.messageId };
}

module.exports = { sendMail, mailConfigured, parseSender };
