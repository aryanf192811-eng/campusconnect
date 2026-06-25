// src/routes/lostFound.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { upload }      = require('../middleware/upload');
const ctrl = require('../controllers/lostFound.controller');

router.get('/',               requireAuth, ctrl.list);
router.post('/',              requireAuth, upload.single('image'), ctrl.create);
router.patch('/:id/resolve',  requireAuth, ctrl.resolve);

module.exports = router;
