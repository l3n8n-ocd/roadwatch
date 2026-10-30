// Quick connectivity check. Run: npm run check:db
// Connects with the DB_* settings in .env (Aiven TLS supported) and prints what it finds.
require('dotenv').config();
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../src/config/dbConfig');

const EXPECTED = [
  'accident_types', 'app_settings', 'audit_logs', 'notifications', 'officer_status', 'report_dispatch',
  'report_photos', 'report_status_history', 'reports', 'roles', 'users',
];

(async () => {
  const cfg = getDbConfig();
  console.log(`Connecting to ${cfg.host}:${cfg.port} as ${cfg.user}, database "${cfg.database}", TLS ${cfg.ssl ? 'on' : 'off'}`);
  const conn = await mysql.createConnection(cfg);
  try {
    const [rows] = await conn.query('SHOW TABLES');
    const found = rows.map((r) => Object.values(r)[0]);
    console.log(`Connected. ${found.length} tables found.`);
    const missing = EXPECTED.filter((t) => !found.includes(t));
    if (missing.length) console.log('Missing tables:', missing.join(', '));

    if (found.includes('roles')) {
      const [roles] = await conn.query('SELECT COUNT(*) AS n FROM roles');
      console.log(`roles rows: ${roles[0].n} (expected 3)`);
    }
    if (found.includes('accident_types')) {
      const [types] = await conn.query('SELECT COUNT(*) AS n FROM accident_types');
      console.log(`accident_types rows: ${types[0].n} (expected 5)`);
    }
    if (found.includes('users')) {
      const [col] = await conn.query("SHOW COLUMNS FROM users LIKE 'is_active'");
      console.log(`users.is_active column: ${col.length ? 'present' : 'MISSING (reload schema.sql)'}`);
    }
    if (found.includes('reports')) {
      const [col] = await conn.query("SHOW COLUMNS FROM reports LIKE 'priority'");
      console.log(`reports.priority column: ${col.length ? 'present' : 'MISSING (run npm run migrate)'}`);
    }
    if (missing.length) process.exitCode = 1;
  } finally {
    await conn.end();
  }
})().catch((e) => { console.error('DB check failed:', e.message); process.exit(1); });
