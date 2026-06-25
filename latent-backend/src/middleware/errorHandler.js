// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message, err.stack?.split('\n')[1]);

  // Postgres unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.+)\)/)?.[1] || 'field';
    return res.status(409).json({ success: false, error: `${field} already exists`, code: 'DUPLICATE' });
  }
  // Postgres FK violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced record not found', code: 'FK_VIOLATION' });
  }
  // Generic
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error:   status === 500 ? 'Internal server error' : err.message,
    code:    err.code || 'INTERNAL_ERROR',
  });
};

module.exports = { errorHandler };
