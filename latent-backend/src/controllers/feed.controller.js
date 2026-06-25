// src/controllers/feed.controller.js
const db   = require('../config/db');
const sse  = require('../services/sse.service');
const notif = require('../services/notif.service');
const { ok, err, paged } = require('../utils/response.utils');
const path = require('path');
const fs   = require('fs');

/* ── helpers ───────────────────────────────────────────────── */

// Build full post object from a raw row
const augmentPosts = async (posts, userId) => {
  if (!posts.length) return [];
  const postIds = posts.map(p => p.id);
  const userIds = [...new Set(posts.filter(p => !p.is_anonymous).map(p => p.user_id))];

  const [rcRes, urRes, ccRes, svRes, uRes] = await Promise.all([
    db.query('SELECT post_id, reaction_type, COUNT(*)::int as count FROM post_reactions WHERE post_id = ANY($1) GROUP BY post_id, reaction_type', [postIds]),
    db.query('SELECT post_id, reaction_type FROM post_reactions WHERE user_id=$1 AND post_id = ANY($2)', [userId, postIds]),
    db.query('SELECT post_id, COUNT(*)::int as c FROM comments WHERE post_id = ANY($1) GROUP BY post_id', [postIds]),
    db.query('SELECT post_id FROM saved_posts WHERE user_id=$1 AND post_id = ANY($2)', [userId, postIds]),
    userIds.length ? db.query('SELECT id,name,full_name,avatar_url,department,year FROM users WHERE id = ANY($1)', [userIds]) : { rows: [] }
  ]);

  const rcMap = {}; const urMap = {}; const ccMap = {}; const svSet = new Set(svRes.rows.map(r => r.post_id)); const uMap = {};
  uRes.rows.forEach(u => uMap[u.id] = u);
  rcRes.rows.forEach(r => {
    if (!rcMap[r.post_id]) rcMap[r.post_id] = { fire:0, heart:0, laugh:0, clap:0, wow:0, insightful:0, support:0 };
    rcMap[r.post_id][r.reaction_type] = r.count;
  });
  urRes.rows.forEach(r => urMap[r.post_id] = r.reaction_type);
  ccRes.rows.forEach(r => ccMap[r.post_id] = r.c);

  const pollPosts = posts.filter(p => p.post_type === 'poll');
  const pollMap = {};
  if (pollPosts.length) {
    const pRes = await db.query('SELECT * FROM polls WHERE post_id = ANY($1)', [pollPosts.map(p => p.id)]);
    const pollIds = pRes.rows.map(p => p.id);
    if (pollIds.length) {
      const [optsRes, uvRes] = await Promise.all([
        db.query('SELECT po.*, COUNT(pv.id)::int as votes FROM poll_options po LEFT JOIN poll_votes pv ON pv.option_id=po.id WHERE po.poll_id = ANY($1) GROUP BY po.id ORDER BY po.position', [pollIds]),
        db.query('SELECT poll_id, option_id FROM poll_votes WHERE user_id=$1 AND poll_id = ANY($2)', [userId, pollIds])
      ]);
      const uvMap = {}; uvRes.rows.forEach(r => uvMap[r.poll_id] = r.option_id);
      const optsByPoll = {}; const votesByPoll = {};
      optsRes.rows.forEach(o => {
        if (!optsByPoll[o.poll_id]) { optsByPoll[o.poll_id] = []; votesByPoll[o.poll_id] = 0; }
        optsByPoll[o.poll_id].push(o); votesByPoll[o.poll_id] += o.votes;
      });
      pRes.rows.forEach(pr => {
        const t = votesByPoll[pr.id] || 0;
        pollMap[pr.post_id] = {
          id: pr.id, question: pr.question, ends_at: pr.ends_at, user_vote_option_id: uvMap[pr.id] || null,
          options: (optsByPoll[pr.id] || []).map(o => ({ ...o, percentage: t > 0 ? Math.round((o.votes/t)*100) : 0 }))
        };
      });
    }
  }

  return posts.map(p => ({
    ...p,
    user: p.is_anonymous ? null : (uMap[p.user_id] || null),
    reaction_counts: rcMap[p.id] || { fire:0, heart:0, laugh:0, clap:0, wow:0, insightful:0, support:0 },
    user_reaction: urMap[p.id] || null,
    comment_count: ccMap[p.id] || 0,
    is_saved: svSet.has(p.id),
    poll: pollMap[p.id] || null,
  }));
};

const buildFeedQuery = (filter) => {
  switch (filter) {
    case 'following':
      return `SELECT DISTINCT p.id, p.created_at FROM posts p
              WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1)
              ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`;
    case 'department':
      return `SELECT DISTINCT p.id, p.created_at FROM posts p
              JOIN users u ON u.id=p.user_id
              WHERE u.department=(SELECT department FROM users WHERE id=$1) AND p.is_anonymous=FALSE
              ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`;
    case 'trending':
      return `SELECT p.id, p.created_at FROM posts p
              WHERE p.created_at > NOW()-INTERVAL '24 hours'
              ORDER BY (SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id AND created_at>NOW()-INTERVAL '24h') DESC, p.created_at DESC
              LIMIT $2 OFFSET $3`;
    case 'clubs':
      return `SELECT DISTINCT p.id, p.created_at FROM posts p
              JOIN users u ON u.id=p.user_id
              WHERE u.id IN (
                SELECT cm.user_id FROM club_members cm
                WHERE cm.club_id IN (SELECT club_id FROM club_members WHERE user_id=$1)
              ) AND p.is_anonymous=FALSE
              ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`;
    case 'confessions':
      return `SELECT p.id, p.created_at FROM posts p
              WHERE p.is_anonymous=TRUE ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`;
    default: // for_you
      return `SELECT DISTINCT p.id, p.created_at FROM posts p
              WHERE (
                p.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1)
                OR p.user_id IN (SELECT id FROM users WHERE department=(SELECT department FROM users WHERE id=$1))
                OR (SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id AND created_at>NOW()-INTERVAL '24h') > 5
              ) AND p.is_anonymous=FALSE
              ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`;
  }
};

/* ── GET /api/feed/posts ──────────────────────────────────── */
const getPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filter = req.query.filter || 'for_you';
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 15);
    const offset = (page - 1) * limit;

    const sql = buildFeedQuery(filter);
    // confessions/trending don't use userId param
    const noUserFilters = ['confessions', 'trending'];
    const params = noUserFilters.includes(filter) ? [limit, offset] : [userId, limit, offset];
    // For trending we still pass 2 params, but sql has $1 as limit
    const idsRes = noUserFilters.includes(filter)
      ? await db.query(sql.replace('$1', `$1`), params)
      : await db.query(sql, params);

    const ids = idsRes.rows.map((r) => r.id);
    if (!ids.length) return paged(res, [], 0, page, limit);

    // Fetch full post rows
    const postsRes = await db.query(
      `SELECT * FROM posts WHERE id = ANY($1::int[]) ORDER BY created_at DESC`, [ids]
    );

    const items = await augmentPosts(postsRes.rows, userId);

    // Count total (approximate — for hasMore)
    const countSql = sql.replace(/SELECT DISTINCT p\.id.*?FROM posts p/s, 'SELECT COUNT(DISTINCT p.id) FROM posts p')
                        .replace(/ORDER BY.*?LIMIT \$\d+ OFFSET \$\d+/s, '');
    let total = items.length; // fallback
    try {
      const countParams = noUserFilters.includes(filter) ? [] : [userId];
      const cr = await db.query(countSql, countParams);
      total = parseInt(cr.rows[0]?.count || 0);
    } catch (_) { /* ignore count error */ }

    return paged(res, items, total, page, limit);
  } catch (e) { next(e); }
};

/* ── GET /api/feed/posts/new-count ───────────────────────── */
const newCount = async (req, res, next) => {
  try {
    const { since, filter } = req.query;
    const userId = req.user.id;
    if (!since) return ok(res, { count: 0 });

    const { rows } = await db.query(
      `SELECT COUNT(*)::int as count FROM posts WHERE created_at > $1 AND is_anonymous=FALSE
       AND user_id IN (SELECT following_id FROM follows WHERE follower_id=$2)`,
      [since, userId]
    );
    return ok(res, { count: rows[0].count });
  } catch (e) { next(e); }
};

/* ── GET /api/feed/posts/:id ──────────────────────────────── */
const getPost = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Post not found', 'NOT_FOUND', 404);
    const posts = await augmentPosts([rows[0]], req.user.id);
    return ok(res, { post: posts[0] });
  } catch (e) { next(e); }
};

/* ── POST /api/feed/posts ─────────────────────────────────── */
const createPost = async (req, res, next) => {
  const client = await db.connect();
  try {
    const userId = req.user.id;
    const { content, image_urls = [], post_type = 'general', is_anonymous = false, ref_id, ref_type, poll: pollData } = req.body;

    // Handle base64 images
    let finalImageUrls = [];
    for (const img of image_urls) {
      if (img.startsWith('data:image')) {
        const ext  = img.split(';')[0].split('/')[1] || 'jpg';
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const fpath = path.join(process.cwd(), 'uploads', name);
        const base64 = img.split(',')[1];
        fs.writeFileSync(fpath, Buffer.from(base64, 'base64'));
        finalImageUrls.push(`/uploads/${name}`);
      } else {
        finalImageUrls.push(img);
      }
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO posts (user_id, content, image_urls, post_type, is_anonymous, ref_id, ref_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, content || null, JSON.stringify(finalImageUrls), post_type, is_anonymous, ref_id || null, ref_type || null]
    );
    const postRow = rows[0];

    // Insert poll if applicable
    if (post_type === 'poll' && pollData) {
      const pollRes = await client.query(
        'INSERT INTO polls (post_id, question, ends_at) VALUES ($1,$2,$3) RETURNING id',
        [postRow.id, pollData.question, pollData.ends_at || null]
      );
      const pollId = pollRes.rows[0].id;
      for (let i = 0; i < (pollData.options || []).length; i++) {
        await client.query(
          'INSERT INTO poll_options (poll_id, option_text, position) VALUES ($1,$2,$3)',
          [pollId, pollData.options[i], i]
        );
      }
    }

    await client.query('COMMIT');

    // Notify followers asynchronously
    db.query('SELECT follower_id FROM follows WHERE following_id=$1', [userId])
      .then(({ rows: followers }) => {
        followers.forEach((r) => sse.send(r.follower_id, 'new_post', { post_id: postRow.id }));
      }).catch(() => {});

    const posts = await augmentPosts([postRow], userId);
    return ok(res, { post: posts[0] }, 'Post created');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    next(e);
  } finally {
    client.release();
  }
};

/* ── DELETE /api/feed/posts/:id ───────────────────────────── */
const deletePost = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT user_id, image_urls FROM posts WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Post not found', 'NOT_FOUND', 404);
    if (rows[0].user_id !== req.user.id) return err(res, 'Forbidden', 'FORBIDDEN', 403);

    const imageUrls = rows[0].image_urls || [];
    
    await db.query('DELETE FROM posts WHERE id=$1', [req.params.id]);

    // Cleanup files
    imageUrls.forEach(url => {
      try {
        if (url.startsWith('/uploads/')) {
          const fpath = path.join(process.cwd(), url);
          if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
        }
      } catch (e) { /* ignore cleanup error */ }
    });

    return ok(res, null, 'Post deleted');
  } catch (e) { next(e); }
};

/* ── POST /api/feed/posts/:id/react ──────────────────────── */
const reactPost = async (req, res, next) => {
  try {
    const { reaction_type } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    const valid = ['fire', 'heart', 'laugh', 'clap', 'wow'];
    if (!valid.includes(reaction_type)) return err(res, 'Invalid reaction type', 'INVALID_REACTION');

    // UPSERT
    const existing = await db.query(
      'SELECT id FROM post_reactions WHERE user_id=$1 AND post_id=$2', [userId, postId]
    );
    await db.query(
      `INSERT INTO post_reactions (user_id, post_id, reaction_type)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, post_id) DO UPDATE SET reaction_type=$3`,
      [userId, postId, reaction_type]
    );

    // Notify post owner if new reaction
    if (!existing.rows.length) {
      const postRes = await db.query('SELECT user_id FROM posts WHERE id=$1', [postId]);
      if (postRes.rows.length) {
        notif.createAndSend({
          userId: postRes.rows[0].user_id, actorId: userId,
          type: 'reaction', content: `reacted to your post`, refId: parseInt(postId), refType: 'post',
        }).catch(() => {});
      }
    }

    // Return updated counts
    const rcRes = await db.query(
      `SELECT reaction_type, COUNT(*)::int as count FROM post_reactions WHERE post_id=$1 GROUP BY reaction_type`,
      [postId]
    );
    const reaction_counts = { fire: 0, heart: 0, laugh: 0, clap: 0, wow: 0 };
    rcRes.rows.forEach((r) => { reaction_counts[r.reaction_type] = r.count; });

    return ok(res, { reaction_counts, user_reaction: reaction_type });
  } catch (e) { next(e); }
};

/* ── DELETE /api/feed/posts/:id/react ────────────────────── */
const unreactPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    await db.query('DELETE FROM post_reactions WHERE user_id=$1 AND post_id=$2', [userId, postId]);
    const rcRes = await db.query(
      `SELECT reaction_type, COUNT(*)::int as count FROM post_reactions WHERE post_id=$1 GROUP BY reaction_type`,
      [postId]
    );
    const reaction_counts = { fire: 0, heart: 0, laugh: 0, clap: 0, wow: 0 };
    rcRes.rows.forEach((r) => { reaction_counts[r.reaction_type] = r.count; });
    return ok(res, { reaction_counts, user_reaction: null });
  } catch (e) { next(e); }
};

/* ── POST /api/feed/posts/:id/save ───────────────────────── */
const savePost = async (req, res, next) => {
  try {
    await db.query(
      'INSERT INTO saved_posts (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id]
    );
    return ok(res, { is_saved: true });
  } catch (e) { next(e); }
};

/* ── DELETE /api/feed/posts/:id/save ─────────────────────── */
const unsavePost = async (req, res, next) => {
  try {
    await db.query('DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2', [req.user.id, req.params.id]);
    return ok(res, { is_saved: false });
  } catch (e) { next(e); }
};

/* ── GET /api/feed/posts/:id/comments ────────────────────── */
const getComments = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { rows: comments } = await db.query(
      `SELECT c.*, row_to_json(u) as user FROM comments c
       JOIN users u ON u.id=c.user_id WHERE c.post_id=$1 ORDER BY c.created_at ASC`,
      [postId]
    );
    // Attach replies
    for (const c of comments) {
      const { rows: replies } = await db.query(
        `SELECT cr.*, row_to_json(u) as user FROM comment_replies cr
         JOIN users u ON u.id=cr.user_id WHERE cr.comment_id=$1 ORDER BY cr.created_at ASC`,
        [c.id]
      );
      c.replies = replies;
    }
    return ok(res, { items: comments });
  } catch (e) { next(e); }
};

/* ── POST /api/feed/posts/:id/comments ───────────────────── */
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    if (!content?.trim()) return err(res, 'Content is required', 'VALIDATION_ERROR');

    const { rows } = await db.query(
      `INSERT INTO comments (user_id, post_id, content) VALUES ($1,$2,$3)
       RETURNING *, (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url FROM users WHERE id=$1) u) as user`,
      [userId, postId, content.trim()]
    );

    // Notify post owner
    const postRes = await db.query('SELECT user_id FROM posts WHERE id=$1', [postId]);
    if (postRes.rows.length) {
      notif.createAndSend({
        userId: postRes.rows[0].user_id, actorId: userId,
        type: 'comment', content: 'commented on your post', refId: parseInt(postId), refType: 'post',
      }).catch(() => {});
    }

    return ok(res, { comment: { ...rows[0], replies: [] } });
  } catch (e) { next(e); }
};

/* ── POST /api/feed/comments/:id/replies ─────────────────── */
const addReply = async (req, res, next) => {
  try {
    const { content } = req.body;
    const commentId = req.params.id;
    const userId    = req.user.id;

    if (!content?.trim()) return err(res, 'Content is required', 'VALIDATION_ERROR');

    const { rows } = await db.query(
      `INSERT INTO comment_replies (user_id, comment_id, content) VALUES ($1,$2,$3)
       RETURNING *, (SELECT row_to_json(u) FROM (SELECT id,name,avatar_url FROM users WHERE id=$1) u) as user`,
      [userId, commentId, content.trim()]
    );

    // Notify comment author
    const comRes = await db.query('SELECT user_id FROM comments WHERE id=$1', [commentId]);
    if (comRes.rows.length) {
      notif.createAndSend({
        userId: comRes.rows[0].user_id, actorId: userId,
        type: 'reply', content: 'replied to your comment', refId: parseInt(commentId), refType: 'comment',
      }).catch(() => {});
    }

    return ok(res, { reply: rows[0] });
  } catch (e) { next(e); }
};

/* ── GET /api/feed/polls/:id ─────────────────────────────── */
const getPoll = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM polls WHERE id=$1', [req.params.id]);
    if (!rows.length) return err(res, 'Poll not found', 'NOT_FOUND', 404);
    const pollRow = rows[0];
    const optsRes = await db.query(
      'SELECT po.*, COUNT(pv.id)::int as votes FROM poll_options po LEFT JOIN poll_votes pv ON pv.option_id=po.id WHERE po.poll_id=$1 GROUP BY po.id ORDER BY po.position',
      [pollRow.id]
    );
    const total_votes = optsRes.rows.reduce((s, o) => s + o.votes, 0);
    const uvRes = await db.query(
      'SELECT option_id FROM poll_votes WHERE user_id=$1 AND poll_id=$2', [req.user.id, pollRow.id]
    );
    return ok(res, {
      poll: {
        ...pollRow,
        user_vote_option_id: uvRes.rows[0]?.option_id || null,
        options: optsRes.rows.map((o) => ({
          id: o.id, text: o.option_text, votes: o.votes, position: o.position,
          percentage: total_votes > 0 ? Math.round((o.votes / total_votes) * 100) : 0,
        })),
      }
    });
  } catch (e) { next(e); }
};

/* ── POST /api/feed/polls/:id/vote ───────────────────────── */
const votePoll = async (req, res, next) => {
  try {
    const { option_id } = req.body;
    const pollId = req.params.id;
    const userId = req.user.id;

    const { rows: polls } = await db.query('SELECT * FROM polls WHERE id=$1', [pollId]);
    if (!polls.length) return err(res, 'Poll not found', 'NOT_FOUND', 404);
    if (polls[0].ends_at && new Date(polls[0].ends_at) < new Date())
      return err(res, 'Poll has ended', 'POLL_ENDED');

    await db.query(
      `INSERT INTO poll_votes (user_id, poll_id, option_id) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, poll_id) DO UPDATE SET option_id=$3`,
      [userId, pollId, option_id]
    );

    // Return updated poll
    const optsRes = await db.query(
      'SELECT po.*, COUNT(pv.id)::int as votes FROM poll_options po LEFT JOIN poll_votes pv ON pv.option_id=po.id WHERE po.poll_id=$1 GROUP BY po.id ORDER BY po.position',
      [pollId]
    );
    const total_votes = optsRes.rows.reduce((s, o) => s + o.votes, 0);

    return ok(res, {
      poll: {
        ...polls[0],
        user_vote_option_id: parseInt(option_id),
        options: optsRes.rows.map((o) => ({
          id: o.id, text: o.option_text, votes: o.votes, position: o.position,
          percentage: total_votes > 0 ? Math.round((o.votes / total_votes) * 100) : 0,
        })),
      }
    });
  } catch (e) { next(e); }
};

module.exports = {
  getPosts, newCount, getPost, createPost, deletePost,
  reactPost, unreactPost, savePost, unsavePost,
  getComments, addComment, addReply, getPoll, votePoll,
};
