const fs = require('fs');

// Shared MySQL settings for Sequelize and the seed script. Handles Aiven's TLS requirement.
function getDbConfig() {
  const cfg = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
  if (String(process.env.DB_SSL).toLowerCase() === 'true') {
    let ca = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;
    if (!ca && process.env.DB_SSL_CA_PATH) ca = fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8');
    cfg.ssl = ca ? { ca } : { rejectUnauthorized: true };
  }
  return cfg;
}

module.exports = { getDbConfig };
