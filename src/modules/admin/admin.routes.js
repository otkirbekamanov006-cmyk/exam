const router = require('express').Router();
const c = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/role');
const asyncHandler = require('../../utils/asyncHandler');

router.get('/stats', authenticate, authorize('admin'), asyncHandler(c.stats));

module.exports = router;
