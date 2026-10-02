const express = require('express');
const router = express.Router();
const itemController = require('./item.controller');
const claimController = require('../claims/claim.controller');
const auth = require('../../middlewares/auth');
const upload = require('../../config/multer');
const validate = require('../../middlewares/validate');
const { itemSchema, updateItemSchema, itemQuerySchema, reportSchema, claimSchema } = require('../../validations/schemas');

// ─── Items ───────────────────────────────────────────────────────────────────

// GET /api/items — Hamma
router.get('/', validate(itemQuerySchema), itemController.getItems);

// GET /api/items/my — User (/:id dan oldin bo'lishi shart!)
router.get('/my', auth(), itemController.getMyItems);

// GET /api/items/:id — Hamma
router.get('/:id', itemController.getItemById);

// POST /api/items — User (multipart/form-data, 1-3 rasm)
router.post(
  '/',
  auth(),
  (req, res, next) => {
    upload.array('images', 3)(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Fayl hajmi 2 MB dan oshmasligi kerak' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Ko\'pi bilan 3 ta rasm yuklanadi' });
      }
      if (err.message === 'Faqat rasm yuklash mumkin') {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    });
  },
  validate(itemSchema),
  itemController.createItem
);

// PATCH /api/items/:id — Egasi
router.patch('/:id', auth(), validate(updateItemSchema), itemController.updateItem);

// DELETE /api/items/:id — Egasi yoki Admin
router.delete('/:id', auth(), itemController.deleteItem);

// POST /api/items/:id/report — User (faqat 'lost' e'lonlar)
router.post('/:id/report', auth(), validate(reportSchema), itemController.reportItem);

// ─── Item-scoped Claims ──────────────────────────────────────────────────────

// POST /api/items/:id/claims — User
router.post('/:id/claims', auth(), validate(claimSchema), claimController.createClaim);

// GET /api/items/:id/claims — E'lon egasi
router.get('/:id/claims', auth(), claimController.getItemClaims);

module.exports = router;