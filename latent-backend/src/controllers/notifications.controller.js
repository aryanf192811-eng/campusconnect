// src/controllers/notifications.controller.js
const jwt = require('jsonwebtoken');
const db  = require('../config/db');
const sse = require('../services/sse.service');
const { ok, err, paged } = require('../utils/response.utils');

/* ── GET /api/notifications/stream (SSE) ─────────────────── */
const stream = async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).end();

    let user;
    try { user = jwt.verify(token, process.env.JWT_SECRET); }
    catch (_) { return res.status(401).end(); }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial unread count
    const { rows } = await db.query(
      'SELECT COUNT(*)::int as count FROM notifications WHERE user_id=$1 AND is_read=FALSE',
      [user.id]
    );
    res.write(`event: unread_count\ndata: ${JSON.stringify({ count: rows[0].count })}\n\n`);

    sse.addClient(user.id, res);
  } catch (e) { next(e); }
};

/* ── GET /api/notifications ──────────────────────────────── */
const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT n.*,
         CASE WHEN n.actor_id IS NOT NULL THEN
           (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url FROM users WHERE id=n.actor_id) u)
         END as actor
       FROM notifications n
       WHERE n.user_id=$1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const { rows: cnt } = await db.query(
      'SELECT COUNT(*)::int as total FROM notifications WHERE user_id=$1', [userId]
    );

    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

/* ── PATCH /api/notifications/read-all ───────────────────── */
const readAll = async (req, res, next) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
    sse.send(req.user.id, 'unread_count', { count: 0 });
    return ok(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
};

/* ── PATCH /api/notifications/:id/read ───────────────────── */
const readOne = async (req, res, next) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    const { rows } = await db.query(
      'SELECT COUNT(*)::int as count FROM notifications WHERE user_id=$1 AND is_read=FALSE',
      [req.user.id]
    );
    sse.send(req.user.id, 'unread_count', { count: rows[0].count });
    return ok(res, null, 'Notification marked as read');
  } catch (e) { next(e); }
};

module.exports = { stream, list, readAll, readOne };
