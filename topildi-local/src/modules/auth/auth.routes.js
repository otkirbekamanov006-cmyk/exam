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