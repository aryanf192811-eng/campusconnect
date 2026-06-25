// src/routes/people.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getPeople } = require('../controllers/people.controller');

router.get('/', requireAuth, getPeople);

module.exports = router;
