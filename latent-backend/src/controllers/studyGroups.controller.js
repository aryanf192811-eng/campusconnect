// src/controllers/studyGroups.controller.js
const db = require('../config/db');
const { ok, err, paged } = require('../utils/response.utils');

/* ── GET /api/study-groups ───────────────────────────────── */
const list = async (req, res, next) => {
  try {
    const { subject, location_id } = req.query;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 15;
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];
    if (subject) { params.push(`%${subject}%`); whereParts.push(`sg.subject ILIKE $${params.length}`); }
    if (location_id) { params.push(location_id); whereParts.push(`sg.location_id=$${params.length}`); }

    const whereStr = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT sg.*,
         (SELECT COUNT(*)::int FROM study_group_members WHERE group_id=sg.id) as member_count,
         EXISTS(SELECT 1 FROM study_group_members WHERE group_id=sg.id AND user_id=$${params.length + 1}) as is_member,
         (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url FROM users WHERE id=sg.creator_id) u) as creator
       FROM study_groups sg
       ${whereStr}
       ORDER BY sg.scheduled_at DESC NULLS LAST, sg.created_at DESC
       LIMIT $${params.length + 2} OFFSET $${params.length + 3}`,
      [...params, req.user.id, limit, offset]
    );

    // Get first 5 members for each group
    for (const g of rows) {
      const { rows: mems } = await db.query(
        `SELECT u.id, u.name, u.avatar_url FROM study_group_members sgm
         JOIN users u ON u.id=sgm.user_id WHERE sgm.group_id=$1 LIMIT 5`,
        [g.id]
      );
      g.members = mems;
    }

    const { rows: cnt } = await db.query(`SELECT COUNT(*)::int as total FROM study_groups sg ${whereStr}`, params);

    return paged(res, rows, cnt[0].total, page, limit);
  } catch (e) { next(e); }
};

/* ── POST /api/study-groups ──────────────────────────────── */
const create = async (req, res, next) => {
  try {
    const { name, subject, location_id, location_text, scheduled_at, max_members } = req.body;
    const userId = req.user.id;

    if (!subject) return err(res, 'Subject is required', 'VALIDATION_ERROR');

    const { rows } = await db.query(
      `INSERT INTO study_groups (name, subject, creator_id, location_id, location_text, scheduled_at, max_members)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name || null, subject, userId, location_id || null, location_text || null, scheduled_at || null, max_members || 6]
    );

    await db.query('INSERT INTO study_group_members (group_id, user_id) VALUES ($1,$2)', [rows[0].id, userId]);

    return ok(res, rows[0]);
  } catch (e) { next(e); }
};

/* ── POST /api/study-groups/:id/join ─────────────────────── */
const joinGroup = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId  = req.user.id;

    const { rows: grp } = await db.query('SELECT max_members FROM study_groups WHERE id=$1', [groupId]);
    if (!grp.length) return err(res, 'Group not found', 'NOT_FOUND', 404);

    const { rows: cnt } = await db.query('SELECT COUNT(*)::int as count FROM study_group_members WHERE group_id=$1', [groupId]);
    if (cnt[0].count >= grp[0].max_members) return err(res, 'Group is full', 'GROUP_FULL', 400);

    await db.query('INSERT INTO study_group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [groupId, userId]);

    const { rows: newCnt } = await db.query('SELECT COUNT(*)::int as count FROM study_group_members WHERE group_id=$1', [groupId]);
    return ok(res, { is_member: true, member_count: newCnt[0].count });
  } catch (e) { next(e); }
};

/* ── DELETE /api/study-groups/:id/leave ──────────────────── */
const leaveGroup = async (req, res, next) => {
  try {
    await db.query('DELETE FROM study_group_members WHERE group_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    return ok(res, null, 'Left group');
  } catch (e) { next(e); }
};

module.exports = { list, create, joinGroup, leaveGroup };
