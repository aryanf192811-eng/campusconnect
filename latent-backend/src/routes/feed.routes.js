// src/routes/feed.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/feed.controller');

router.get('/posts',                     requireAuth, ctrl.getPosts);
router.get('/posts/new-count',           requireAuth, ctrl.newCount);
router.get('/posts/:id',                 requireAuth, ctrl.getPost);
router.post('/posts',                    requireAuth, ctrl.createPost);
router.delete('/posts/:id',              requireAuth, ctrl.deletePost);

router.post('/posts/:id/react',          requireAuth, ctrl.reactPost);
router.delete('/posts/:id/react',        requireAuth, ctrl.unreactPost);

router.post('/posts/:id/save',           requireAuth, ctrl.savePost);
router.delete('/posts/:id/save',         requireAuth, ctrl.unsavePost);

router.get('/posts/:id/comments',        requireAuth, ctrl.getComments);
router.post('/posts/:id/comments',       requireAuth, ctrl.addComment);
router.post('/comments/:id/replies',     requireAuth, ctrl.addReply);

router.get('/polls/:id',                 requireAuth, ctrl.getPoll);
router.post('/polls/:id/vote',           requireAuth, ctrl.votePoll);

module.exports = router;
