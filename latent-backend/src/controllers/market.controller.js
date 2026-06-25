// src/controllers/market.controller.js
const db = require('../config/db');
const { ok, err, paged } = require('../utils/response.utils');

/* ── GET /api/market ─────────────────────────────────────── */
const list = async (req, res, next) => {
  try {
    const { category, search, page: pg } = req.query;
    const page   = Math.max(1, parseInt(pg) || 1);
    const limit  = 24;
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];
    if (category && category !== 'all') { params.push(category); whereParts.push(`category=$${params.length}`); }
    if (search) { params.push(`%${search}%`); whereParts.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`); }

    const whereStr = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT m.*,
         (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url,department FROM users WHERE id=m.user_id) u) as seller
       FROM market_listings m
       ${whereStr}
       ORDER BY m.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const { rows: cnt } = await db.query(`SELECT COUNT(*)::int as total FROM market_listings ${whereStr}`, params);

    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

/* ── POST /api/market ────────────────────────────────────── */
const create = async (req, res, next) => {
  try {
    const { title, description, category, condition, price } = req.body;
    const userId = req.user.id;

    let image_urls = [];
    if (req.files && req.files.length) {
      image_urls = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const { rows } = await db.query(
      `INSERT INTO market_listings (user_id, title, description, category, condition, price, image_urls)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, title, description, category, condition, parseFloat(price) || 0, JSON.stringify(image_urls)]
    );

    await db.query(
      `INSERT INTO posts (user_id, post_type, content, ref_id, ref_type)
       VALUES ($1, 'market', $2, $3, 'market')`,
      [userId, `[FOR SALE] ${title} - ₹${price}`, rows[0].id]
    );

    return ok(res, rows[0]);
  } catch (e) { next(e); }
};

/* ── GET /api/market/:id ─────────────────────────────────── */
const getOne = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*,
         (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url,department FROM users WHERE id=m.user_id) u) as seller
       FROM market_listings m WHERE m.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return err(res, 'Listing not found', 'NOT_FOUND', 404);
    return ok(res, { listing: rows[0] });
  } catch (e) { next(e); }
};

/* ── PATCH /api/market/:id/sold ──────────────────────────── */
const markSold = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM market_listings WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Listing not found', 'NOT_FOUND', 404);
    if (rows[0].user_id !== req.user.id) return err(res, 'Forbidden', 'FORBIDDEN', 403);

    await db.query(`UPDATE market_listings SET status='sold' WHERE id=$1`, [req.params.id]);
    return ok(res, null, 'Marked as sold');
  } catch (e) { next(e); }
};

module.exports = { list, create, getOne, markSold };
