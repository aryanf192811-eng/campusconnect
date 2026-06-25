// src/middleware/validate.js
const { validationResult } = require('express-validator');
const { err } = require('../utils/response.utils');

/**
 * Run after express-validator chains.
 * Returns 400 with first validation error if any, else calls next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return err(res, first.msg, 'VALIDATION_ERROR', 400);
  }
  next();
};

module.exports = { validate };
