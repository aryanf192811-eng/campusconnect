// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { err } = require('../utils/response.utils');

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return err(res, 'Authentication required', 'NO_TOKEN', 401);
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    // Update last_seen asynchronously (fire and forget)
    const db = require('../config/db');
    db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [req.user.id]).catch(() => {});
    next();
  } catch (e) {
    return err(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
  }
};

module.exports = { requireAuth };
