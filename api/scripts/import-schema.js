
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../src/config/dbConfig');

async function main() {
  const cfg = getDbConfig();
  cfg.multipleStatements = true;

  const conn = await mysql.createConnection(cfg);

  try {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');

    console.log(`Connected to database "${cfg.database}".`);

    console.log('Importing schema.sql...');
    await conn.query(fs.readFileSync(schemaPath, 'utf8'));
    console.log('Schema imported.');

    console.log('Importing seed.sql...');
    await conn.query(fs.readFileSync(seedPath, 'utf8'));
    console.log('Seed data imported.');

    const [tables] = await conn.query('SHOW TABLES');
    console.log(`Tables found: ${tables.length}`);

    const [roles] = await conn.query('SELECT role_name FROM roles');
    console.log('Roles:', roles.map((r) => r.role_name).join(', '));

    const [types] = await conn.query('SELECT type_name FROM accident_types');
    console.log('Accident types:', types.length);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exitCode = 1;
});
