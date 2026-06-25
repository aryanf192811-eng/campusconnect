// src/controllers/events.controller.js
const db   = require('../config/db');
const notif = require('../services/notif.service');
const { ok, err, paged } = require('../utils/response.utils');
const { upload } = require('../middleware/upload');

/* ── GET /api/events ─────────────────────────────────────── */
const getEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filter = req.query.filter || 'all';
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 15);
    const offset = (page - 1) * limit;

    const filterMap = {
      all:       `e.start_time >= NOW()`,
      today:     `DATE(e.start_time) = CURRENT_DATE`,
      this_week: `e.start_time BETWEEN NOW() AND NOW() + INTERVAL '7 days'`,
      my_clubs:  `e.club_id IN (SELECT club_id FROM club_members WHERE user_id=${userId}) AND e.start_time >= NOW()`,
    };
    const whereClause = filterMap[filter] || filterMap.all;

    const { rows } = await db.query(
      `SELECT e.*,
         c.name as club_name, c.logo_url as club_logo,
         l.name as location_name,
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='going') as going_count,
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='interested') as interested_count,
         (SELECT status FROM event_rsvps WHERE event_id=e.id AND user_id=$1) as user_rsvp
       FROM events e
       LEFT JOIN clubs c ON c.id=e.club_id
       LEFT JOIN locations l ON l.id=e.location_id
       WHERE ${whereClause}
       ORDER BY e.start_time ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Add first 3 attendee avatars
    for (const ev of rows) {
      const { rows: avatars } = await db.query(
        `SELECT u.id, u.name, u.avatar_url FROM event_rsvps er
         JOIN users u ON u.id=er.user_id
         WHERE er.event_id=$1 AND er.status='going' LIMIT 3`,
        [ev.id]
      );
      ev.attendee_avatars = avatars;
    }

    const { rows: cnt } = await db.query(
      `SELECT COUNT(*)::int as total FROM events e WHERE ${whereClause}`,
      [userId]
    );

    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

/* ── GET /api/events/:id ─────────────────────────────────── */
const getEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT e.*,
         c.name as club_name, c.logo_url as club_logo,
         l.name as location_name,
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='going') as going_count,
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=e.id AND status='interested') as interested_count,
         (SELECT status FROM event_rsvps WHERE event_id=e.id AND user_id=$2) as user_rsvp
       FROM events e
       LEFT JOIN clubs c ON c.id=e.club_id
       LEFT JOIN locations l ON l.id=e.location_id
       WHERE e.id=$1`,
      [req.params.id, userId]
    );
    if (!rows.length) return err(res, 'Event not found', 'NOT_FOUND', 404);
    return ok(res, { event: rows[0] });
  } catch (e) { next(e); }
};

/* ── POST /api/events/:id/rsvp ───────────────────────────── */
const rsvpEvent = async (req, res, next) => {
  try {
    const { status } = req.body;
    const eventId = req.params.id;
    const userId  = req.user.id;

    if (!['going', 'interested', 'not_going'].includes(status))
      return err(res, 'Invalid status', 'INVALID_STATUS');

    await db.query(
      `INSERT INTO event_rsvps (user_id, event_id, status)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, event_id) DO UPDATE SET status=$3, updated_at=NOW()`,
      [userId, eventId, status]
    );

    // Notify event creator
    if (status === 'going') {
      const { rows: ev } = await db.query('SELECT created_by, title FROM events WHERE id=$1', [eventId]);
      if (ev.length) {
        notif.createAndSend({
          userId: ev[0].created_by, actorId: userId,
          type: 'event_rsvp', content: `is going to your event "${ev[0].title}"`,
          refId: parseInt(eventId), refType: 'event',
        }).catch(() => {});
      }
    }

    const { rows: counts } = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=$1 AND status='going') as going_count,
         (SELECT COUNT(*)::int FROM event_rsvps WHERE event_id=$1 AND status='interested') as interested_count`,
      [eventId]
    );

    return ok(res, { user_rsvp: status, ...counts[0] });
  } catch (e) { next(e); }
};

/* ── DELETE /api/events/:id/rsvp ─────────────────────────── */
const deleteRsvp = async (req, res, next) => {
  try {
    await db.query('DELETE FROM event_rsvps WHERE user_id=$1 AND event_id=$2', [req.user.id, req.params.id]);
    return ok(res, null, 'RSVP removed');
  } catch (e) { next(e); }
};

/* ── GET /api/events/:id/count (SSE) ─────────────────────── */
const rsvpCountStream = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let prevGoing = 0;
    const interval = setInterval(async () => {
      try {
        const { rows } = await db.query(
          `SELECT COUNT(*)::int as count FROM event_rsvps WHERE event_id=$1 AND status='going'`,
          [eventId]
        );
        const going = rows[0].count;
        if (going !== prevGoing) {
          res.write(`event: rsvp_count\ndata: ${JSON.stringify({ going })}\n\n`);
          prevGoing = going;
        }
      } catch (_) {}
    }, 5000);

    res.on('close', () => clearInterval(interval));
  } catch (e) { next(e); }
};

/* ── GET /api/events/:id/attendees ───────────────────────── */
const getAttendees = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department, er.status
       FROM event_rsvps er JOIN users u ON u.id=er.user_id
       WHERE er.event_id=$1 AND er.status='going'
       ORDER BY er.created_at DESC`,
      [req.params.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── POST /api/events/:id/memories ───────────────────────── */
const addMemory = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const eventId = req.params.id;

    // Verify user went to this event
    const { rows: rsvp } = await db.query(
      `SELECT id FROM event_rsvps WHERE user_id=$1 AND event_id=$2 AND status='going'`,
      [userId, eventId]
    );
    if (!rsvp.length) return err(res, 'You must have attended this event', 'FORBIDDEN', 403);

    // Verify event ended
    const { rows: ev } = await db.query('SELECT end_time FROM events WHERE id=$1', [eventId]);
    if (!ev.length) return err(res, 'Event not found', 'NOT_FOUND', 404);
    if (ev[0].end_time && new Date(ev[0].end_time) > new Date())
      return err(res, 'Event has not ended yet', 'EVENT_NOT_ENDED', 400);

    if (!req.file) return err(res, 'Image is required', 'VALIDATION_ERROR');

    const image_url = `/uploads/${req.file.filename}`;
    const caption   = req.body.caption || null;

    const { rows } = await db.query(
      'INSERT INTO event_memories (event_id, user_id, image_url, caption) VALUES ($1,$2,$3,$4) RETURNING *',
      [eventId, userId, image_url, caption]
    );

    return ok(res, { memory: rows[0] });
  } catch (e) { next(e); }
};

/* ── GET /api/events/:id/memories ────────────────────────── */
const getMemories = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT em.*, json_build_object('id',u.id,'name',u.name,'avatar_url',u.avatar_url) as user
       FROM event_memories em JOIN users u ON u.id=em.user_id
       WHERE em.event_id=$1 ORDER BY em.created_at DESC`,
      [req.params.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

module.exports = { getEvents, getEvent, rsvpEvent, deleteRsvp, rsvpCountStream, getAttendees, addMemory, getMemories };
