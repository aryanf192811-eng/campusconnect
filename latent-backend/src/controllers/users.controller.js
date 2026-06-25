// src/controllers/users.controller.js
const db = require('../config/db');
const notif = require('../services/notif.service');
const { ok, err } = require('../utils/response.utils');

/* ── POST /api/users/:id/follow ──────────────────────────── */
const follow = async (req, res, next) => {
  try {
    const followingId = req.params.id;
    const followerId  = req.user.id;

    if (followingId == followerId) return err(res, 'Cannot follow yourself', 'VALIDATION_ERROR');

    const { rows: target } = await db.query('SELECT id FROM users WHERE id=$1', [followingId]);
    if (!target.length) return err(res, 'User not found', 'NOT_FOUND', 404);

    await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );

    // Notify target user
    notif.createAndSend({
      userId: followingId, actorId: followerId,
      type: 'follow', content: 'started following you',
      refId: followerId, refType: 'user',
    }).catch(() => {});

    return ok(res, { following: true });
  } catch (e) { next(e); }
};

/* ── DELETE /api/users/:id/follow ────────────────────────── */
const unfollow = async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM follows WHERE follower_id=$1 AND following_id=$2',
      [req.user.id, req.params.id]
    );
    return ok(res, { following: false });
  } catch (e) { next(e); }
};

/* ── GET /api/users/:id/followers ────────────────────────── */
const getFollowers = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department,
         EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id=$2 AND f2.following_id=u.id) as is_following
       FROM follows f JOIN users u ON u.id=f.follower_id
       WHERE f.following_id=$1 ORDER BY f.created_at DESC`,
      [req.params.id, req.user.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

/* ── GET /api/users/:id/following ────────────────────────── */
const getFollowing = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.avatar_url, u.department,
         EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id=$2 AND f2.following_id=u.id) as is_following
       FROM follows f JOIN users u ON u.id=f.following_id
       WHERE f.follower_id=$1 ORDER BY f.created_at DESC`,
      [req.params.id, req.user.id]
    );
    return ok(res, { items: rows });
  } catch (e) { next(e); }
};

module.exports = { follow, unfollow, getFollowers, getFollowing };
