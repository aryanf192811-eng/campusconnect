// src/routes/auth.routes.js
const router = require('express').Router();
const { body } = require('express-validator');
const { validate }     = require('../middleware/validate');
const { requireAuth }  = require('../middleware/auth');
const ctrl             = require('../controllers/auth.controller');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate, ctrl.register
);

router.post('/login',
  [
    body('email_or_enrollment').notEmpty().withMessage('Email or enrollment is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate, ctrl.login
);

const { upload }       = require('../middleware/upload');

router.get('/me',           requireAuth, ctrl.me);
router.post('/onboarding',  requireAuth, upload.single('avatar'), ctrl.onboarding);
router.patch('/update-profile', requireAuth, upload.single('avatar'), ctrl.updateProfile);
router.post('/status',      requireAuth, ctrl.setStatus);

router.post('/forgot-password',
  [body('email').isEmail().withMessage('Valid email required')],
  validate, ctrl.forgotPassword
);
router.post('/verify-otp',
  [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate, ctrl.verifyOtp
);
router.post('/reset-password',
  [
    body('reset_token').notEmpty(),
    body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate, ctrl.resetPassword
);

module.exports = router;
