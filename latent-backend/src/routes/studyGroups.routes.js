// src/routes/studyGroups.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/studyGroups.controller');

router.get('/',               requireAuth, ctrl.list);
router.post('/',              requireAuth, ctrl.create);
router.post('/:id/join',      requireAuth, ctrl.joinGroup);
router.delete('/:id/leave',   requireAuth, ctrl.leaveGroup);

module.exports = router;
