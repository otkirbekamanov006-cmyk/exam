<<<<<<< HEAD
const router = require('express').Router();
const c = require('./auth.controller');
const v = require('../../validations/auth.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { loginLimiter, otpLimiter } = require('../../middlewares/rateLimit');
const asyncHandler = require('../../utils/asyncHandler');

router.post('/register', validate({ body: v.register }), asyncHandler(c.register));
router.post('/verify', otpLimiter(), validate({ body: v.verify }), asyncHandler(c.verify));
router.post('/resend-code', otpLimiter(), validate({ body: v.emailOnly }), asyncHandler(c.resendCode));
router.post('/login', loginLimiter, validate({ body: v.login }), asyncHandler(c.login));
router.post('/forgot-password', otpLimiter(), validate({ body: v.emailOnly }), asyncHandler(c.forgotPassword));
router.post('/reset-password', otpLimiter(), validate({ body: v.resetPassword }), asyncHandler(c.resetPassword));
router.get('/me', authenticate, asyncHandler(c.me));

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  verifySchema,
  resendCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../../validations/schemas');

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify', validate(verifySchema), authController.verify);
router.post('/resend-code', validate(resendCodeSchema), authController.resendCode);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', auth(), authController.me);

module.exports = router;
>>>>>>> 76df369 (faylni ozgartrdim)
