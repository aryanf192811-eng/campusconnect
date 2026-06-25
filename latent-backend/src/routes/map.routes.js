// src/routes/map.routes.js
const router = require('express').Router();
const { requireAuth }  = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const ctrl = require('../controllers/map.controller');

router.get('/locations',           optionalAuth, ctrl.getLocations);
router.get('/locations/:id',       optionalAuth, ctrl.getLocation);
router.get('/locations/:id/crowd', optionalAuth, ctrl.getCrowd);
router.post('/checkin',            requireAuth,  ctrl.checkin);
router.get('/checkins/today',      requireAuth,  ctrl.todayCheckins);

module.exports = router;
