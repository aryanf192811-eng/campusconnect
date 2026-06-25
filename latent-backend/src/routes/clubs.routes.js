// src/routes/clubs.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/clubs.controller');

router.get('/',               requireAuth, ctrl.getClubs);
router.get('/:id',            requireAuth, ctrl.getClub);
router.post('/:id/join',      requireAuth, ctrl.joinClub);
router.delete('/:id/leave',   requireAuth, ctrl.leaveClub);
router.get('/:id/posts',      requireAuth, ctrl.getClubPosts);
router.get('/:id/events',     requireAuth, ctrl.getClubEvents);
router.get('/:id/members',    requireAuth, ctrl.getClubMembers);

module.exports = router;
