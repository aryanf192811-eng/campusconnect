// src/controllers/people.controller.js
const db = require('../config/db');
const { ok, err, paged } = require('../utils/response.utils');

/* ── GET /api/people ─────────────────────────────────────── */
const getPeople = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { department, year, interest, status } = req.query;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 15);
    const offset = (page - 1) * limit;

    const whereParts = ['u.id <> $1', 'u.onboarding_complete = TRUE'];
    const params = [userId];

    if (department) { params.push(department); whereParts.push(`u.department=$${params.length}`); }
    if (year) { params.push(parseInt(year)); whereParts.push(`u.year=$${params.length}`); }
    if (interest) { params.push(interest); whereParts.push(`u.id IN (SELECT user_id FROM user_interests WHERE interest=$${params.length})`); }
    if (status === 'free') { whereParts.push(`u.campus_status='free' AND u.status_expires_at > NOW()`); }

    const sql = `
      SELECT u.id, u.name, u.department, u.year, u.avatar_url, u.bio,
             u.campus_status, u.status_expires_at,
             EXISTS(SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=u.id) as is_following,
             ARRAY(SELECT interest FROM user_interests WHERE user_id=u.id) as interests,
             ARRAY(SELECT interest FROM user_interests WHERE user_id=u.id
                   AND interest IN (SELECT interest FROM user_interests WHERE user_id=$1)) as shared_interests,
             (SELECT COUNT(*) FROM user_interests WHERE user_id=u.id
              AND interest IN (SELECT interest FROM user_interests WHERE user_id=$1)) as shared_interests_count
      FROM users u
      WHERE ${whereParts.join(' AND ')}
      ORDER BY shared_interests_count DESC, u.last_seen DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const { rows } = await db.query(sql, [...params, limit, offset]);

    const countSql = `SELECT COUNT(*)::int as total FROM users u WHERE ${whereParts.join(' AND ')}`;
    const { rows: cnt } = await db.query(countSql, params);

    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

module.exports = { getPeople };
