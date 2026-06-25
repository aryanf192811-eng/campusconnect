// src/controllers/profile.controller.js
const db = require('../config/db');
const { ok, err, paged } = require('../utils/response.utils');
const fs = require('fs');
const path = require('path');

/* ── GET /api/profile/:id ────────────────────────────────── */
const getProfile = async (req, res, next) => {
  try {
    const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
    const userId   = req.user.id;

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.enrollment_no, u.department, u.year, u.bio, u.avatar_url,
              u.campus_status, u.hostel_type, u.default_mess_id, u.created_at,
         (SELECT COUNT(*)::int FROM follows WHERE following_id=u.id) as follower_count,
         (SELECT COUNT(*)::int FROM follows WHERE follower_id=u.id)  as following_count,
         (SELECT COUNT(*)::int FROM posts WHERE user_id=u.id AND is_anonymous=FALSE) as post_count,
         EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=u.id) as is_following,
         ARRAY(SELECT interest FROM user_interests WHERE user_id=u.id) as interests,
         EXISTS(SELECT 1 FROM senior_mentors WHERE user_id=u.id) as is_senior_mentor
       FROM users u WHERE u.id=$1`,
      [targetId, userId]
    );
    if (!rows.length) return err(res, 'User not found', 'NOT_FOUND', 404);

    const profile = rows[0];

    // Study streak
    const { rows: streakRows } = await db.query(
      `SELECT COUNT(DISTINCT DATE(checked_in_at))::int as streak FROM checkins
       WHERE user_id=$1 AND location_id IN (SELECT id FROM locations WHERE category='library' OR category='academic')
       AND checked_in_at >= NOW() - INTERVAL '30 days'`,
      [targetId]
    );
    profile.study_streak = streakRows[0]?.streak || 0;

    return ok(res, profile);
  } catch (e) { next(e); }
};

/* ── PATCH /api/profile/me ───────────────────────────────── */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, bio, department, year, hostel_type, default_mess_id, interests } = req.body;

    await db.query(
      `UPDATE users SET
         name=COALESCE($1,name), bio=COALESCE($2,bio), department=COALESCE($3,department),
         year=COALESCE($4,year), hostel_type=COALESCE($5,hostel_type),
         default_mess_id=COALESCE($6,default_mess_id), updated_at=NOW()
       WHERE id=$7`,
      [name, bio, department, year, hostel_type, default_mess_id, userId]
    );

    if (interests && Array.isArray(interests)) {
      await db.query('DELETE FROM user_interests WHERE user_id=$1', [userId]);
      if (interests.length) {
        const values = interests.map((_, i) => `($1,$${i + 2})`).join(',');
        await db.query(`INSERT INTO user_interests (user_id, interest) VALUES ${values}`, [userId, ...interests]);
      }
    }

    const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [userId]);
    const user = rows[0];
    delete user.password_hash;
    return ok(res, user);
  } catch (e) { next(e); }
};

/* ── POST /api/profile/avatar ────────────────────────────── */
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return err(res, 'No image uploaded', 'VALIDATION_ERROR');
    const avatar_url = `/uploads/${req.file.filename}`;

    const { rows: uRows } = await db.query('SELECT avatar_url FROM users WHERE id=$1', [req.user.id]);
    const oldAvatar = uRows[0]?.avatar_url;
    if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
      try { fs.unlinkSync(path.join(process.cwd(), oldAvatar)); } catch (e) {}
    }

    await db.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [avatar_url, req.user.id]);
    return ok(res, { avatar_url });
  } catch (e) { next(e); }
};

/* ── GET /api/profile/:id/posts ──────────────────────────── */
const getProfilePosts = async (req, res, next) => {
  try {
    const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 15;
    const offset = (page - 1) * limit;

    const { rows } = await db.query(
      `SELECT * FROM posts WHERE user_id=$1 AND is_anonymous=FALSE ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [targetId, limit, offset]
    );
    const { rows: cnt } = await db.query('SELECT COUNT(*)::int as total FROM posts WHERE user_id=$1 AND is_anonymous=FALSE', [targetId]);

    // We omit full post augmentation here for brevity, but in real app we'd call augmentPost from feed controller.
    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

/* ── GET /api/profile/:id/activity ───────────────────────── */
const getActivity = async (req, res, next) => {
  try {
    const targetId = req.params.id === 'me' ? req.user.id : req.params.id;

    // Fetch mix of recent RSVPs, club joins, checkins, market listings
    const [rsvps, clubs, checkins, markets] = await Promise.all([
      db.query(`SELECT er.status, er.created_at, e.id, e.title, e.start_time FROM event_rsvps er JOIN events e ON e.id=er.event_id WHERE er.user_id=$1 ORDER BY er.created_at DESC LIMIT 5`, [targetId]),
      db.query(`SELECT cm.created_at, c.id, c.name, c.logo_url FROM club_members cm JOIN clubs c ON c.id=cm.club_id WHERE cm.user_id=$1 ORDER BY cm.joined_at DESC LIMIT 5`, [targetId]),
      db.query(`SELECT c.checked_in_at as created_at, l.id, l.name, l.category FROM checkins c JOIN locations l ON l.id=c.location_id WHERE c.user_id=$1 ORDER BY c.checked_in_at DESC LIMIT 5`, [targetId]),
      db.query(`SELECT id, title, price, created_at FROM market_listings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [targetId])
    ]);

    const items = [
      ...rsvps.rows.map(r => ({ type: 'rsvp', event: {id:r.id, title:r.title, start_time:r.start_time}, status: r.status, created_at: r.created_at })),
      ...clubs.rows.map(c => ({ type: 'club_join', club: {id:c.id, name:c.name, logo_url:c.logo_url}, created_at: c.created_at })),
      ...checkins.rows.map(c => ({ type: 'checkin', location: {id:c.id, name:c.name, category:c.category}, created_at: c.created_at })),
      ...markets.rows.map(m => ({ type: 'market', listing: {id:m.id, title:m.title, price:m.price}, created_at: m.created_at }))
    ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);

    return ok(res, { items });
  } catch (e) { next(e); }
};

module.exports = { getProfile, updateProfile, updateAvatar, getProfilePosts, getActivity };
