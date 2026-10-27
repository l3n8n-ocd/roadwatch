// Creates the first Administrator. Run once: npm run seed:admin
// Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env. The password is hashed with bcrypt.
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../src/config/dbConfig');
const { checkPassword } = require('../src/utils/passwordStrength');

(async () => {
  const { ADMIN_NAME = 'System Administrator', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
    process.exit(1);
  }
  // Same rule as every new password in the apps (#44): it must be Strong.
  const strength = checkPassword(ADMIN_PASSWORD, { name: ADMIN_NAME, email: ADMIN_EMAIL });
  if (strength.level !== 'strong') {
    console.error(`ADMIN_PASSWORD is ${strength.level}, and it must be strong. ${strength.tip}`);
    process.exit(1);
  }
  const conn = await mysql.createConnection(getDbConfig());
  try {
    const [roles] = await conn.query("SELECT role_id FROM roles WHERE role_name = 'Administrator'");
    if (!roles.length) throw new Error('Run database/seed.sql first (roles are missing).');
    const [existing] = await conn.query('SELECT user_id FROM users WHERE contact_email = ?', [ADMIN_EMAIL]);
    if (existing.length) {
      console.log('An account with that email already exists. Nothing to do.');
      return;
    }
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await conn.query(
      'INSERT INTO users (role_id, full_name, contact_email, password_hash) VALUES (?, ?, ?, ?)',
      [roles[0].role_id, ADMIN_NAME, ADMIN_EMAIL, hash]
    );
    console.log('Administrator created:', ADMIN_EMAIL);
  } finally {
    await conn.end();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
