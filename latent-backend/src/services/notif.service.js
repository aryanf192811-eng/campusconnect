// src/services/notif.service.js
const db  = require('../config/db');
const sse = require('./sse.service');

const createAndSend = async ({ userId, actorId, type, content, refId, refType }) => {
  if (userId === actorId) return; // Don't notify yourself

  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, actor_id, type, content, ref_id, ref_type)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [userId, actorId, type, content, refId || null, refType || null]
  );
  const notif = rows[0];

  // Get actor info for SSE payload
  const actor = actorId
    ? (await db.query('SELECT id, name, avatar_url FROM users WHERE id=$1', [actorId])).rows[0]
    : null;

  // Get updated unread count
  const countRes = await db.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE',
    [userId]
  );

  sse.send(userId, 'notification', { ...notif, actor });
  sse.send(userId, 'unread_count', { count: parseInt(countRes.rows[0].count) });
};

module.exports = { createAndSend };
