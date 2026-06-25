// src/routes/profile.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { upload }      = require('../middleware/upload');
const ctrl = require('../controllers/profile.controller');

router.get('/:id',          requireAuth, ctrl.getProfile);
router.patch('/me',         requireAuth, ctrl.updateProfile);
router.post('/avatar',      requireAuth, upload.single('image'), ctrl.updateAvatar);
router.get('/:id/posts',    requireAuth, ctrl.getProfilePosts);
router.get('/:id/activity', requireAuth, ctrl.getActivity);

module.exports = router;
