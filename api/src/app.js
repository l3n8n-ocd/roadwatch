const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'roadwatch-api' });
});

// Demo video URL for the web page and the mobile screen (set DEMO_VIDEO_URL on the host)
app.get('/api/app-info', (req, res) => {
  res.json({ demoVideoUrl: process.env.DEMO_VIDEO_URL || null });
});

// TODO (Carl): mount routes here
// Rules: POST /api/auth/register is public and always creates a Reporter (ignore any role from the client).
//        POST /api/users (admin only) creates Traffic Officers and other accounts.
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/reports', require('./routes/reports'));
// app.use('/api/admin', require('./routes/admin'));
// app.use('/api/officer', require('./routes/officer'));

module.exports = app;
