// src/routes/users.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

router.post('/:id/follow',    requireAuth, ctrl.follow);
router.delete('/:id/follow',  requireAuth, ctrl.unfollow);
router.get('/:id/followers',  requireAuth, ctrl.getFollowers);
router.get('/:id/following',  requireAuth, ctrl.getFollowing);

module.exports = router;
