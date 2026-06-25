// src/routes/notifications.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/notifications.controller');

router.get('/stream',        ctrl.stream);      // Auth via ?token= query param
router.get('/',              requireAuth, ctrl.list);
router.patch('/read-all',    requireAuth, ctrl.readAll);
router.patch('/:id/read',    requireAuth, ctrl.readOne);

module.exports = router;
