// src/controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { ok, err } = require('../utils/response.utils');
const { signToken } = require('../utils/jwt.utils');
const otpService    = require('../services/otp.service');
const fs            = require('fs');
const path          = require('path');

/* ── helpers ───────────────────────────────────────────────── */
const fullUser = async (userId) => {
  const { rows } = await db.query(
    `SELECT u.*,
       (SELECT COUNT(*) FROM follows WHERE following_id=u.id)::int AS follower_count,
       (SELECT COUNT(*) FROM follows WHERE follower_id=u.id)::int  AS following_count,
       (SELECT COUNT(*) FROM posts   WHERE user_id=u.id)::int      AS post_count,
       ARRAY(SELECT interest FROM user_interests WHERE user_id=u.id) AS interests
     FROM users u WHERE u.id=$1`,
    [userId]
  );
  return rows[0];
};

/* ── POST /api/auth/register ───────────────────────────────── */
const register = async (req, res, next) => {
  try {
    const { name, email, enrollment_no, password } = req.body;

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, enrollment_no, password_hash)
       VALUES ($1,$2,$3,$4) RETURNING id, name, email, enrollment_no, onboarding_complete`,
      [name, email, enrollment_no || null, password_hash]
    );
    const user = rows[0];

    // Create mess wallet with 500 starter balance
    await db.query('INSERT INTO mess_wallet (user_id, balance) VALUES ($1, 500.00)', [user.id]);

    const token = signToken({ id: user.id, name: user.name, email: user.email });

    return ok(res, { user, token }, 'Registration successful');
  } catch (e) { next(e); }
};

/* ── POST /api/auth/login ─────────────────────────────────── */
const login = async (req, res, next) => {
  try {
    const { email_or_enrollment, password } = req.body;

    const { rows } = await db.query(
      'SELECT * FROM users WHERE email=$1 OR enrollment_no=$1',
      [email_or_enrollment]
    );
    if (!rows.length) return err(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return err(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);

    // Update last_seen
    await db.query('UPDATE users SET last_seen=NOW() WHERE id=$1', [user.id]);

    const full = await fullUser(user.id);
    const token = signToken({ id: user.id, name: user.name, email: user.email });

    // Remove password_hash before sending
    delete full.password_hash;
    return ok(res, { user: full, token });
  } catch (e) { next(e); }
};

/* ── GET /api/auth/me ─────────────────────────────────────── */
const me = async (req, res, next) => {
  try {
    const user = await fullUser(req.user.id);
    if (!user) return err(res, 'User not found', 'NOT_FOUND', 404);
    delete user.password_hash;
    return ok(res, { user });
  } catch (e) { next(e); }
};

/* ── POST /api/auth/onboarding ────────────────────────────── */
const onboarding = async (req, res, next) => {
  try {
    let { department, year, hostel_type, default_mess_id, bio, avatar_url } = req.body;
    let interests = [];
    if (req.body.interests) {
      try { interests = JSON.parse(req.body.interests); }
      catch (e) { interests = req.body.interests; }
    }
    const userId = req.user.id;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
      const { rows: uRows } = await db.query('SELECT avatar_url FROM users WHERE id=$1', [userId]);
      const oldAvatar = uRows[0]?.avatar_url;
      if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
        try { fs.unlinkSync(path.join(process.cwd(), oldAvatar)); } catch (e) {}
      }
    }

    await db.query(
      `UPDATE users SET
         department=$1, year=$2, hostel_type=$3, default_mess_id=$4,
         bio=$5, avatar_url=$6, onboarding_complete=TRUE, updated_at=NOW()
       WHERE id=$7`,
      [department, year, hostel_type, default_mess_id || null, bio || null, avatar_url || null, userId]
    );

    // Replace interests
    await db.query('DELETE FROM user_interests WHERE user_id=$1', [userId]);
    if (interests.length) {
      const values = interests.map((_, i) => `($1,$${i + 2})`).join(',');
      await db.query(
        `INSERT INTO user_interests (user_id, interest) VALUES ${values}`,
        [userId, ...interests]
      );
    }

    const user = await fullUser(userId);
    delete user.password_hash;
    return ok(res, { user });
  } catch (e) { next(e); }
};

/* ── PATCH /api/auth/update-profile ───────────────────────── */
const updateProfile = async (req, res, next) => {
  try {
    let { name, bio, department, year, hostel_type, default_mess_id, avatar_url } = req.body;
    let interests = [];
    if (req.body.interests) {
      try { interests = JSON.parse(req.body.interests); }
      catch (e) { interests = req.body.interests; }
    }
    const userId = req.user.id;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
      const { rows: uRows } = await db.query('SELECT avatar_url FROM users WHERE id=$1', [userId]);
      const oldAvatar = uRows[0]?.avatar_url;
      if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
        try { fs.unlinkSync(path.join(process.cwd(), oldAvatar)); } catch (e) {}
      }
    }

    await db.query(
      `UPDATE users SET
         name=COALESCE($1,name), bio=COALESCE($2,bio), department=COALESCE($3,department),
         year=COALESCE($4,year), hostel_type=COALESCE($5,hostel_type),
         default_mess_id=COALESCE($6,default_mess_id), avatar_url=COALESCE($7,avatar_url),
         updated_at=NOW()
       WHERE id=$8`,
      [name, bio, department, year, hostel_type, default_mess_id, avatar_url, userId]
    );

    if (req.body.interests) {
      await db.query('DELETE FROM user_interests WHERE user_id=$1', [userId]);
      if (interests.length) {
        const values = interests.map((_, i) => `($1,$${i + 2})`).join(',');
        await db.query(
          `INSERT INTO user_interests (user_id, interest) VALUES ${values}`,
          [userId, ...interests]
        );
      }
    }

    const user = await fullUser(userId);
    delete user.password_hash;
    return ok(res, { user });
  } catch (e) { next(e); }
};

/* ── POST /api/auth/status ────────────────────────────────── */
const setStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['free', 'studying', 'at_mess', 'at_gym', 'in_class', 'in_hostel'];
    if (!valid.includes(status)) return err(res, 'Invalid status', 'INVALID_STATUS');

    const { rows } = await db.query(
      `UPDATE users SET campus_status=$1, status_expires_at=NOW()+INTERVAL '4 hours'
       WHERE id=$2 RETURNING campus_status, status_expires_at`,
      [status, req.user.id]
    );
    return ok(res, { status: rows[0].campus_status, expires_at: rows[0].status_expires_at });
  } catch (e) { next(e); }
};

/* ── POST /api/auth/forgot-password ───────────────────────── */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!rows.length) return err(res, 'No account with that email', 'NOT_FOUND', 404);

    await otpService.createOTP(email);
    return ok(res, null, 'OTP sent. Check server console (dev mode).');
  } catch (e) { next(e); }
};

/* ── POST /api/auth/verify-otp ────────────────────────────── */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await otpService.verifyOTP(email, otp);
    if (!result.valid) return err(res, result.reason, 'INVALID_OTP', 400);

    const reset_token = jwt.sign({ email, purpose: 'reset' }, process.env.JWT_RESET_SECRET, { expiresIn: '15m' });
    return ok(res, { reset_token });
  } catch (e) { next(e); }
};

/* ── POST /api/auth/reset-password ────────────────────────── */
const resetPassword = async (req, res, next) => {
  try {
    const { reset_token, new_password } = req.body;

    let decoded;
    try { decoded = jwt.verify(reset_token, process.env.JWT_RESET_SECRET); }
    catch (_) { return err(res, 'Reset token expired or invalid', 'INVALID_TOKEN', 401); }

    const password_hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE email=$2', [password_hash, decoded.email]);

    return ok(res, null, 'Password updated successfully.');
  } catch (e) { next(e); }
};

module.exports = { register, login, me, onboarding, updateProfile, setStatus, forgotPassword, verifyOtp, resetPassword };
