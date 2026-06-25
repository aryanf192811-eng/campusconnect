// src/app.js
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet  = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false })); // allow cross-origin images
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Rate limiting (relaxed for dev/demo)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/feed',           require('./routes/feed.routes'));
app.use('/api/events',         require('./routes/events.routes'));
app.use('/api/map',            require('./routes/map.routes'));
app.use('/api/mess',           require('./routes/mess.routes'));
app.use('/api/clubs',          require('./routes/clubs.routes'));
app.use('/api/people',         require('./routes/people.routes'));
app.use('/api/profile',        require('./routes/profile.routes'));
app.use('/api/lost-found',     require('./routes/lostFound.routes'));
app.use('/api/market',         require('./routes/market.routes'));
app.use('/api/study-groups',   require('./routes/studyGroups.routes'));
app.use('/api/seniors',        require('./routes/seniors.routes'));
app.use('/api/notifications',  require('./routes/notifications.routes'));
app.use('/api/pulse',          require('./routes/pulse.routes'));
app.use('/api/weather',        require('./routes/weather.routes'));
app.use('/api/users',          require('./routes/users.routes')); // follow/unfollow

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Latent API' }));

// ── Error handler (always last) ─────────────────────────────
app.use(errorHandler);

module.exports = app;
