const router = require('express').Router();
const c = require('./items.controller');
const v = require('../../validations/item.validation');
const { idParam } = require('../../validations/common');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { uploadItemImages, requireImages } = require('../../config/multer');
const asyncHandler = require('../../utils/asyncHandler');

router.get('/', validate({ query: v.list }), asyncHandler(c.list));
router.get('/my', authenticate, asyncHandler(c.listMine)); // /:id dan oldin turishi shart
router.get('/:id', validate({ params: idParam }), asyncHandler(c.getOne));

router.post(
  '/',
  authenticate,
  uploadItemImages, // multer: images, 1–3 ta, jpeg/png/webp, ≤ 2 MB
  requireImages,
  validate({ body: v.create }),
  v.categoryExists,
  asyncHandler(c.create)
);

router.patch(
  '/:id',
  authenticate,
  validate({ params: idParam, body: v.update }),
  v.categoryExists,
  asyncHandler(c.update)
);
router.delete('/:id', authenticate, validate({ params: idParam }), asyncHandler(c.remove));
router.post('/:id/report', authenticate, validate({ params: idParam, body: v.report }), asyncHandler(c.report));

module.exports = router;
