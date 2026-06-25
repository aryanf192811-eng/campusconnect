// src/controllers/pulse.controller.js
const db  = require('../config/db');
const { ok } = require('../utils/response.utils');

const getPulse = async (req, res, next) => {
  try {
    const [online, eventsToday, messToday, newPosts, announcements] = await Promise.all([
      db.query(`SELECT COUNT(*)::int as count FROM users WHERE last_seen > NOW() - INTERVAL '15 minutes'`),
      db.query(`SELECT COUNT(*)::int as count FROM events WHERE DATE(start_time)=CURRENT_DATE`),
      db.query(`SELECT COUNT(*)::int as count FROM mess_coupons WHERE meal_date=CURRENT_DATE`),
      db.query(`SELECT COUNT(*)::int as count FROM posts WHERE created_at > NOW() - INTERVAL '1 hour' AND is_anonymous=FALSE`),
      db.query(`SELECT * FROM announcements WHERE (expires_at IS NULL OR expires_at > NOW()) ORDER BY priority DESC, created_at DESC LIMIT 3`),
    ]);

    return ok(res, {
      online_now:    online.rows[0].count,
      events_today:  eventsToday.rows[0].count,
      mess_bookings: messToday.rows[0].count,
      new_posts:     newPosts.rows[0].count,
      announcements: announcements.rows,
    });
  } catch (e) { next(e); }
};

module.exports = { getPulse };
