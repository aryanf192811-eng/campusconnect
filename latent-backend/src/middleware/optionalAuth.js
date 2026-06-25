// src/middleware/optionalAuth.js
const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET); } catch (_) {}
  }
  next();
};

module.exports = { optionalAuth };
