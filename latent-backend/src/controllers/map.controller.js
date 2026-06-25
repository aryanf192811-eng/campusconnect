// src/controllers/map.controller.js
const db    = require('../config/db');
const crowd = require('../services/crowd.service');
const { ok, err } = require('../utils/response.utils');

/* ── GET /api/map/locations ──────────────────────────────── */
const getLocations = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM locations ORDER BY name');
    const now = new Date().toISOString();

    const items = await Promise.all(rows.map(async (loc) => {
      const crowd_level = await crowd.getCrowdLevel(loc.id, loc.category);
      const { rows: ci } = await db.query(
        `SELECT COUNT(*)::int as count FROM checkins
         WHERE location_id=$1 AND checked_in_at > NOW() - INTERVAL '30 minutes'`,
        [loc.id]
      );
      return { ...loc, crowd_level, recent_checkins: ci[0].count, last_updated: now };
    }));

    return ok(res, { items });
  } catch (e) { next(e); }
};

/* ── GET /api/map/locations/:id ──────────────────────────── */
const getLocation = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM locations WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Location not found', 'NOT_FOUND', 404);
    const loc = rows[0];
    const crowd_level = await crowd.getCrowdLevel(loc.id, loc.category);
    const { rows: ci } = await db.query(
      `SELECT COUNT(*)::int as count FROM checkins
       WHERE location_id=$1 AND checked_in_at > NOW() - INTERVAL '30 minutes'`,
      [loc.id]
    );
    return ok(res, { location: { ...loc, crowd_level, recent_checkins: ci[0].count, last_updated: new Date().toISOString() } });
  } catch (e) { next(e); }
};

/* ── GET /api/map/locations/:id/crowd ────────────────────── */
const getCrowd = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, category FROM locations WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Location not found', 'NOT_FOUND', 404);
    const level = await crowd.getCrowdLevel(rows[0].id, rows[0].category);
    return ok(res, { crowd_level: level });
  } catch (e) { next(e); }
};

/* ── POST /api/map/checkin ───────────────────────────────── */
const checkin = async (req, res, next) => {
  try {
    const { location_id } = req.body;
    const userId = req.user.id;

    if (!location_id) return err(res, 'location_id is required', 'VALIDATION_ERROR');

    // Verify location exists
    const { rows: locs } = await db.query('SELECT * FROM locations WHERE id=$1', [location_id]);
    if (!locs.length) return err(res, 'Location not found', 'NOT_FOUND', 404);
    const location = locs[0];

    // One check-in per day per location
    const { rows: existing } = await db.query(
      `SELECT id FROM checkins
       WHERE user_id=$1 AND location_id=$2 AND DATE(checked_in_at)=CURRENT_DATE`,
      [userId, location_id]
    );
    if (existing.length) {
      return ok(res, { already_checked_in: true, message: 'Already checked in here today' });
    }

    const { rows: ciRows } = await db.query(
      'INSERT INTO checkins (user_id, location_id) VALUES ($1,$2) RETURNING *',
      [userId, location_id]
    );

    // Auto-post the check-in
    await db.query(
      `INSERT INTO posts (user_id, post_type, content, ref_id, ref_type)
       VALUES ($1,'check_in',$2,$3,'location')`,
      [userId, `Checked in at ${location.name}`, location_id]
    );

    return ok(res, { success: true, checkin: ciRows[0], post_created: true });
  } catch (e) { next(e); }
};

/* ── GET /api/map/checkins/today ─────────────────────────── */
const todayCheckins = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, l.name as location_name, l.category
       FROM checkins c JOIN locations l ON l.id=c.location_id
       WHERE c.user_id=$1 AND DATE(c.checked_in_at)=CURRENT_DATE
       ORDER BY c.checked_in_at DESC`,
      [req.user.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

module.exports = { getLocations, getLocation, getCrowd, checkin, todayCheckins };
