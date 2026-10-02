const router = require('express').Router();
const c = require('./categories.controller');
const v = require('../../validations/category.validation');
const { idParam } = require('../../validations/common');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authorize } = require('../../middlewares/role');
const asyncHandler = require('../../utils/asyncHandler');

const adminOnly = [authenticate, authorize('admin')];

router.get('/', asyncHandler(c.getAll));
router.post('/', adminOnly, validate({ body: v.body }), asyncHandler(c.create));
router.put('/:id', adminOnly, validate({ params: idParam, body: v.body }), asyncHandler(c.update));
router.delete('/:id', adminOnly, validate({ params: idParam }), asyncHandler(c.remove));

module.exports = router;
