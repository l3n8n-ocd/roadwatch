const { Sequelize } = require('sequelize');
const { getDbConfig } = require('./dbConfig');

// Single Sequelize instance for the API. getDbConfig() adds the TLS settings Aiven needs (DB_SSL=true).
const c = getDbConfig();
const sequelize = new Sequelize(c.database, c.user, c.password, {
  host: c.host,
  port: c.port,
  dialect: 'mysql',
  dialectOptions: c.ssl ? { ssl: c.ssl } : {},
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: { freezeTableName: true, timestamps: false },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

module.exports = sequelize;
