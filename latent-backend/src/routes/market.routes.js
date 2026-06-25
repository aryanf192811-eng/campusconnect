// src/routes/market.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { upload }      = require('../middleware/upload');
const ctrl = require('../controllers/market.controller');

router.get('/',               requireAuth, ctrl.list);
router.post('/',              requireAuth, upload.array('images', 3), ctrl.create);
router.get('/:id',            requireAuth, ctrl.getOne);
router.patch('/:id/sold',     requireAuth, ctrl.markSold);

module.exports = router;
