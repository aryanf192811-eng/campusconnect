// src/utils/response.utils.js
const ok = (res, data, message) =>
  res.json({ success: true, data, message: message || null });

const err = (res, message, code, status = 400) =>
  res.status(status).json({ success: false, error: message, code: code || 'ERROR' });

const paged = (res, items, total, page, limit) =>
  res.json({
    success: true,
    data: { items, total, page, limit, hasMore: page * limit < total },
  });

module.exports = { ok, err, paged };
