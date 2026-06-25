// src/controllers/clubs.controller.js
const db   = require('../config/db');
const notif = require('../services/notif.service');
const { ok, err, paged } = require('../utils/response.utils');

/* ── GET /api/clubs ──────────────────────────────────────── */
const getClubs = async (req, res, next) => {
  try {
    const userId   = req.user.id;
    const category = req.query.category;
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const limit    = Math.max(1, parseInt(req.query.limit) || 30);
    const offset   = (page - 1) * limit;

    const whereParts = ['c.is_active=TRUE'];
    const params = [userId];
    if (category && category !== 'all') { 
      whereParts.push(`c.category=$${params.length + 1}`); 
      params.push(category); 
    }

    const { rows } = await db.query(
      `SELECT c.*,
         (SELECT COUNT(*)::int FROM club_members WHERE club_id=c.id) as member_count,
         EXISTS(SELECT 1 FROM club_members WHERE club_id=c.id AND user_id=$1) as is_member,
         (SELECT role FROM club_members WHERE club_id=c.id AND user_id=$1) as user_role
       FROM clubs c
       WHERE ${whereParts.join(' AND ')}
       ORDER BY c.name
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countRes = await db.query(
      `SELECT COUNT(*)::int FROM clubs c WHERE ${whereParts.join(' AND ')}`, 
      params
    );
    const total = countRes.rows[0].count;

    return paged(res, rows, total, page, limit);
  } catch (e) { next(e); }
};

/* ── GET /api/clubs/:id ──────────────────────────────────── */
const getClub = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT c.*,
         (SELECT COUNT(*)::int FROM club_members WHERE club_id=c.id) as member_count,
         EXISTS(SELECT 1 FROM club_members WHERE club_id=c.id AND user_id=$2) as is_member,
         (SELECT role FROM club_members WHERE club_id=c.id AND user_id=$2) as user_role
       FROM clubs c WHERE c.id=$1`,
      [req.params.id, userId]
    );
    if (!rows.length) return err(res, 'Club not found', 'NOT_FOUND', 404);
    return ok(res, { club: rows[0] });
  } catch (e) { next(e); }
};

/* ── POST /api/clubs/:id/join ────────────────────────────── */
const joinClub = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const clubId  = req.params.id;

    await db.query(
      'INSERT INTO club_members (user_id, club_id, role) VALUES ($1,$2,\'member\') ON CONFLICT DO NOTHING',
      [userId, clubId]
    );

    // Notify president
    const { rows: pres } = await db.query(
      `SELECT user_id FROM club_members WHERE club_id=$1 AND role='president' LIMIT 1`, [clubId]
    );
    if (pres.length) {
      const { rows: club } = await db.query('SELECT name FROM clubs WHERE id=$1', [clubId]);
      notif.createAndSend({
        userId: pres[0].user_id, actorId: userId,
        type: 'club_join', content: `joined "${club[0]?.name}"`,
        refId: parseInt(clubId), refType: 'club',
      }).catch(() => {});
    }

    const { rows: cnt } = await db.query(
      'SELECT COUNT(*)::int as member_count FROM club_members WHERE club_id=$1', [clubId]
    );

    return ok(res, { is_member: true, role: 'member', member_count: cnt[0].member_count });
  } catch (e) { next(e); }
};

/* ── DELETE /api/clubs/:id/leave ─────────────────────────── */
const leaveClub = async (req, res, next) => {
  try {
    await db.query('DELETE FROM club_members WHERE user_id=$1 AND club_id=$2', [req.user.id, req.params.id]);
    return ok(res, { is_member: false });
  } catch (e) { next(e); }
};

/* ── GET /api/clubs/:id/posts ────────────────────────────── */
const getClubPosts = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const clubId  = req.params.id;
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const limit   = 15;
    const offset  = (page - 1) * limit;

    // Posts from members of this club
    const { rows } = await db.query(
      `SELECT p.* FROM posts p
       JOIN club_members cm ON cm.user_id=p.user_id AND cm.club_id=$1
       ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
      [clubId, limit, offset]
    );
    return paged(res, rows, rows.length + offset, page, limit);
  } catch (e) { next(e); }
};

/* ── GET /api/clubs/:id/events ───────────────────────────── */
const getClubEvents = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*,
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='going') as going_count
       FROM events e WHERE e.club_id=$1 ORDER BY e.start_time DESC`,
      [req.params.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── GET /api/clubs/:id/members ──────────────────────────── */
const getClubMembers = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, cm.role, cm.joined_at
       FROM club_members cm JOIN users u ON u.id=cm.user_id
       WHERE cm.club_id=$1 ORDER BY cm.role DESC, cm.joined_at ASC`,
      [req.params.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

module.exports = { getClubs, getClub, joinClub, leaveClub, getClubPosts, getClubEvents, getClubMembers };
