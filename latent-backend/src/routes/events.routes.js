// src/routes/events.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { upload }      = require('../middleware/upload');
const ctrl = require('../controllers/events.controller');

router.get('/',                  requireAuth, ctrl.getEvents);
router.get('/:id',               requireAuth, ctrl.getEvent);
router.post('/:id/rsvp',         requireAuth, ctrl.rsvpEvent);
router.delete('/:id/rsvp',       requireAuth, ctrl.deleteRsvp);
router.get('/:id/count',         ctrl.rsvpCountStream);   // SSE — no auth header
router.get('/:id/attendees',     requireAuth, ctrl.getAttendees);
router.post('/:id/memories',     requireAuth, upload.single('image'), ctrl.addMemory);
router.get('/:id/memories',      requireAuth, ctrl.getMemories);

module.exports = router;
