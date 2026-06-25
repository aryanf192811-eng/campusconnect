// src/config/env.js
// Validate required environment variables at startup.
// Import this BEFORE anything else in server.js (after dotenv).

const REQUIRED = [
  'JWT_SECRET',
  'JWT_OTP_SECRET',
  'JWT_RESET_SECRET',
  'DB_NAME',
  'DB_USER',
];

const missing = REQUIRED.filter((k) => !process.env[k]);

if (missing.length) {
  console.error('❌  Missing required env vars:', missing.join(', '));
  process.exit(1);
}

// Warn about optional but important keys
const OPTIONAL_WARN = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'OPENWEATHER_API_KEY'];
OPTIONAL_WARN.forEach((k) => {
  if (!process.env[k] || process.env[k].startsWith('XXXXX')) {
    console.warn(`⚠️   [env] ${k} is not set — related features will fail.`);
  }
});
