require('dotenv').config();
const app = require('./src/app');
const { assertConfig } = require('./src/config/env');
const { sequelize } = require('./src/models');

async function start() {
  try {
    assertConfig(); // refuses to start with a missing or placeholder JWT_SECRET
    await sequelize.authenticate();
    console.log('Connected to MySQL.');
  } catch (err) {
    console.error('Unable to start RoadWatch API:', err.message);
    process.exit(1);
  }
  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => console.log(`RoadWatch API running on port ${port}`));
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => { await sequelize.close(); process.exit(0); });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
start();
