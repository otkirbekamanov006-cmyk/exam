const express = require('express');
const router = express.Router();
const claimController = require('./claim.controller');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { claimSchema, claimIdSchema } = require('../../validations/schemas');

// GET /api/claims/my — User
router.get('/my', auth(), claimController.getMyClaims);

// PATCH /api/claims/:id/approve — E'lon egasi
router.patch('/:id/approve', auth(), claimController.approveClaim);

// PATCH /api/claims/:id/reject — E'lon egasi
router.patch('/:id/reject', auth(), claimController.rejectClaim);

module.exports = router;