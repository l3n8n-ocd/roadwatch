// Startup checks for settings that are dangerous to leave at their defaults.
const PLACEHOLDERS = ['change-me', 'changeme', 'replace_with_a_random_secret_at_least_32_characters_long'];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || PLACEHOLDERS.includes(secret.toLowerCase())) {
    throw new Error('JWT_SECRET must be a random string of at least 32 characters (not the placeholder). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  }
  return secret;
}

function assertConfig() {
  getJwtSecret();
}

// CLIENT_ORIGIN can hold several comma-separated origins (web dev server, deployed web app).
function allowedOrigins() {
  return (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
}

module.exports = { getJwtSecret, assertConfig, allowedOrigins };
