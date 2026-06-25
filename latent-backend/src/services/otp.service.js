// src/services/otp.service.js
const jwt = require('jsonwebtoken');
const db  = require('../config/db');

const generate6Digit = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const createOTP = async (email) => {
  const otp     = generate6Digit();
  const payload = { email, otp, purpose: 'password_reset' };
  const token   = jwt.sign(payload, process.env.JWT_OTP_SECRET, { expiresIn: '10m' });
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate any previous OTPs for this email
  await db.query('UPDATE otp_tokens SET used=TRUE WHERE email=$1', [email]);
  await db.query(
    'INSERT INTO otp_tokens (email, token, expires_at) VALUES ($1,$2,$3)',
    [email, token, expires]
  );

  // DEV MODE: log to console (no email infra needed)
  console.log('\n┌─────────────────────────────────────────┐');
  console.log(`│  [LATENT OTP]  ${email.padEnd(27)}│`);
  console.log(`│  OTP: ${otp}    Expires in: 10 minutes   │`);
  console.log('└─────────────────────────────────────────┘\n');

  return token;
};

const verifyOTP = async (email, otp) => {
  const { rows } = await db.query(
    `SELECT * FROM otp_tokens
     WHERE email=$1 AND used=FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email]
  );
  if (!rows.length) return { valid: false, reason: 'OTP expired or not found' };

  try {
    const decoded = jwt.verify(rows[0].token, process.env.JWT_OTP_SECRET);
    if (decoded.otp !== otp) return { valid: false, reason: 'Incorrect OTP' };
    await db.query('UPDATE otp_tokens SET used=TRUE WHERE id=$1', [rows[0].id]);
    return { valid: true };
  } catch (_) {
    return { valid: false, reason: 'OTP expired' };
  }
};

module.exports = { createOTP, verifyOTP };
