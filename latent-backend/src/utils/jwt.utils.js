// src/utils/jwt.utils.js
const jwt = require('jsonwebtoken');

const signToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

module.exports = { signToken, verifyToken };
