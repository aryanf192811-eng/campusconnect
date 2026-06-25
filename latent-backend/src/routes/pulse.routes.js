// src/routes/pulse.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getPulse } = require('../controllers/pulse.controller');

router.get('/', requireAuth, getPulse);

module.exports = router;
