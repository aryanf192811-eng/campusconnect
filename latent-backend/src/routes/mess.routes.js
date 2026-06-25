// src/routes/mess.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/mess.controller');

router.get('/messes',             requireAuth, ctrl.getMesses);
router.get('/today',              requireAuth, ctrl.getToday);
router.get('/menu',               requireAuth, ctrl.getMenu);
router.get('/menu/week',          requireAuth, ctrl.getWeekMenu);
router.get('/wallet',             requireAuth, ctrl.getWallet);
router.get('/tickets',            requireAuth, ctrl.getTickets);
router.get('/tickets/:ticket_id', requireAuth, ctrl.getTicket);
router.post('/create-order',      requireAuth, ctrl.createOrder);
router.post('/verify-payment',    requireAuth, ctrl.verifyPayment);
router.post('/book-wallet',       requireAuth, ctrl.bookWallet);

module.exports = router;
