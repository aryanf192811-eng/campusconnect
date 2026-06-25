// src/routes/weather.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getWeather } = require('../controllers/weather.controller');

router.get('/', requireAuth, getWeather);

module.exports = router;
