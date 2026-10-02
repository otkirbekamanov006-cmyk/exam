const router = require('express').Router();
const c = require('./claims.controller');
const v = require('../../validations/claim.validation');
const { idParam } = require('../../validations/common');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const asyncHandler = require('../../utils/asyncHandler');

// Ushbu router ilovada /api manziliga ulanadi.
router.post('/items/:id/claims', authenticate, validate({ params: idParam, body: v.create }), asyncHandler(c.create));
router.get('/items/:id/claims', authenticate, validate({ params: idParam }), asyncHandler(c.listForItem));
router.get('/claims/my', authenticate, asyncHandler(c.listMine));
router.patch('/claims/:id/approve', authenticate, validate({ params: idParam }), asyncHandler(c.approve));
router.patch('/claims/:id/reject', authenticate, validate({ params: idParam }), asyncHandler(c.reject));

module.exports = router;
