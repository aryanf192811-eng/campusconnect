// src/controllers/seniors.controller.js
const db = require('../config/db');
const { ok, err } = require('../utils/response.utils');

/* ── GET /api/seniors ────────────────────────────────────── */
const getSeniors = async (req, res, next) => {
  try {
    const { department } = req.query;

    const whereParts = ['u.year >= 3'];
    const params = [];
    if (department) { params.push(department); whereParts.push(`u.department=$${params.length}`); }

    const whereStr = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.department, u.year, u.avatar_url, u.bio,
              sm.bio_mentor, sm.subjects, sm.opted_in_at
       FROM senior_mentors sm
       JOIN users u ON u.id = sm.user_id
       ${whereStr}
       ORDER BY u.year DESC, u.name ASC`,
      params
    );

    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── POST /api/seniors/opt-in ────────────────────────────── */
const optIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bio_mentor, subjects } = req.body;

    const { rows: u } = await db.query('SELECT year FROM users WHERE id=$1', [userId]);
    if (!u.length) return err(res, 'User not found', 'NOT_FOUND', 404);
    if (u[0].year < 3) return err(res, 'Only 3rd year and above can opt-in as mentors', 'NOT_ELIGIBLE', 403);

    await db.query(
      `INSERT INTO senior_mentors (user_id, bio_mentor, subjects) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET bio_mentor=$2, subjects=$3`,
      [userId, bio_mentor, JSON.stringify(subjects || [])]
    );

    return ok(res, null, 'Opted in as mentor');
  } catch (e) { next(e); }
};

/* ── DELETE /api/seniors/opt-out ─────────────────────────── */
const optOut = async (req, res, next) => {
  try {
    await db.query('DELETE FROM senior_mentors WHERE user_id=$1', [req.user.id]);
    return ok(res, null, 'Opted out of mentorship');
  } catch (e) { next(e); }
};

module.exports = { getSeniors, optIn, optOut };
