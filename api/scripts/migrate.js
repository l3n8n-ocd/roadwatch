// Upgrades an existing database to the current schema (v1.2.0: database/migrations/2026-10-30-v1.2.0.sql).
// Uses the DB_* settings in .env. Safe to re-run: each step checks whether it is already done.
//   npm run migrate
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../src/config/dbConfig');

const FILE = path.join(__dirname, '..', '..', 'database', 'migrations', '2026-10-30-v1.2.0.sql');

// Splits the migration file into statements (no semicolons inside the statements themselves).
function statements(sql) {
  return sql
    .split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')
    .split(';').map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const cfg = getDbConfig();
  const conn = await mysql.createConnection(cfg);
  try {
    console.log(`Connected to database "${cfg.database}".`);
    const [cols] = await conn.query(
      "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reports' AND column_name = 'priority'"
    );
    const hasPriority = cols[0].n > 0;
    for (const sql of statements(fs.readFileSync(FILE, 'utf8'))) {
      const first = sql.split('\n')[0];
      if (hasPriority && /^(ALTER TABLE reports|UPDATE reports)/.test(sql)) {
        console.log(`Skipped (already done): ${first}`);
        continue;
      }
      await conn.query(sql);
      console.log(`Done: ${first}`);
    }
    const [tables] = await conn.query('SHOW TABLES');
    const [range] = await conn.query("SELECT setting_value FROM app_settings WHERE setting_key = 'alert_range_km'");
    console.log(`Tables: ${tables.length}. Alert range: ${range[0]?.setting_value} km.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
