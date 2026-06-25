// src/controllers/lostFound.controller.js
const db = require('../config/db');
const { ok, err, paged } = require('../utils/response.utils');

/* ── GET /api/lost-found ─────────────────────────────────── */
const list = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 15);
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];
    if (type && type !== 'all') { params.push(type); whereParts.push(`lf.type=$${params.length}`); }
    if (status) { params.push(status); whereParts.push(`lf.status=$${params.length}`); }
    if (search) { params.push(`%${search}%`); whereParts.push(`(lf.title ILIKE $${params.length} OR lf.description ILIKE $${params.length})`); }

    const whereStr = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT lf.*,
         (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url,department FROM users WHERE id=lf.user_id) u) as user
       FROM lost_found lf
       ${whereStr}
       ORDER BY lf.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const { rows: cnt } = await db.query(`SELECT COUNT(*)::int as total FROM lost_found lf ${whereStr}`, params);

    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

/* ── POST /api/lost-found ────────────────────────────────── */
const create = async (req, res, next) => {
  try {
    const { type, title, category, description, location_hint } = req.body;
    const userId = req.user.id;

    if (!['lost','found'].includes(type)) return err(res, 'Invalid type', 'VALIDATION_ERROR');

    let image_url = null;
    if (req.file) image_url = `/uploads/${req.file.filename}`;

    const { rows } = await db.query(
      `INSERT INTO lost_found (user_id, type, title, category, description, image_url, location_hint)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, type, title, category, description, image_url, location_hint]
    );

    // Auto-post to feed
    await db.query(
      `INSERT INTO posts (user_id, post_type, content, ref_id, ref_type)
       VALUES ($1, 'lost_found', $2, $3, 'lost_found')`,
      [userId, `[${type.toUpperCase()}] ${title}`, rows[0].id]
    );

    return ok(res, rows[0]);
  } catch (e) { next(e); }
};

/* ── PATCH /api/lost-found/:id/resolve ───────────────────── */
const resolve = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM lost_found WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Item not found', 'NOT_FOUND', 404);
    if (rows[0].user_id !== req.user.id) return err(res, 'Forbidden', 'FORBIDDEN', 403);

    await db.query('UPDATE lost_found SET status=\'resolved\', resolved_at=NOW() WHERE id=$1', [req.params.id]);
    return ok(res, null, 'Marked as resolved');
  } catch (e) { next(e); }
};

module.exports = { list, create, resolve };
