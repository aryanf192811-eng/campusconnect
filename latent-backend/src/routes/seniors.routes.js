// src/routes/seniors.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/seniors.controller');

router.get('/',         requireAuth, ctrl.getSeniors);
router.post('/opt-in',  requireAuth, ctrl.optIn);
router.delete('/opt-out', requireAuth, ctrl.optOut);

module.exports = router;
