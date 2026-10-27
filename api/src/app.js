const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { allowedOrigins } = require('./config/env');
const { appInfo } = require('./config/videos');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render sits behind a proxy; needed for correct client IPs in rate limiting
app.use(helmet());
// Mobile apps send no Origin header and are allowed; browsers must come from CLIENT_ORIGIN.
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins().includes(origin)) return cb(null, true);
    return cb(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'roadwatch-api' });
});

// Promo video and the 30-second demo clip per role, with transcripts (#48; URLs set on the host)
app.get('/api/app-info', (req, res) => {
  res.json(appInfo());
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
