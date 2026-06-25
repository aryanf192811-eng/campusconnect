// server.js
require('dotenv').config();

// Ensure required env vars are present before anything else
require('./src/config/env');

const app = require('./src/app');
const db  = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Test DB connection before starting
db.query('SELECT 1')
  .then(() => {
    console.log('✅ PostgreSQL connected');
    app.listen(PORT, () => {
      console.log(`🚀 Latent API running on http://localhost:${PORT}`);
      console.log(`📡 SSE endpoint: http://localhost:${PORT}/api/notifications/stream`);
    });
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  });
