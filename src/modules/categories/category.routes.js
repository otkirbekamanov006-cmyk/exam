const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { categorySchema, categoryIdSchema } = require('../../validations/schemas');

// GET /api/categories — Hamma
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories — Admin
router.post('/', auth(['admin']), validate(categorySchema), async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json({ success: true, message: 'Kategoriya yaratildi', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return next(new ApiError(409, 'Bu nomdagi kategoriya allaqachon mavjud'));
    }
    next(error);
  }
});

// PUT /api/categories/:id — Admin
router.put('/:id', auth(['admin']), validate(categorySchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) return next(new ApiError(400, 'ID musbat butun son bo\'lishi kerak'));

    const { name } = req.body;
    const result = await db.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    if (result.rows.length === 0) return next(new ApiError(404, 'Kategoriya topilmadi'));

    res.json({ success: true, message: 'Kategoriya yangilandi', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return next(new ApiError(409, 'Bu nomdagi kategoriya allaqachon mavjud'));
    }
    next(error);
  }
});

// DELETE /api/categories/:id — Admin
router.delete('/:id', auth(['admin']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) return next(new ApiError(400, 'ID musbat butun son bo\'lishi kerak'));

    // Bog'liq e'lonlar borligini tekshiramiz
    const itemCheck = await db.query('SELECT id FROM items WHERE category_id = $1 LIMIT 1', [id]);
    if (itemCheck.rows.length > 0) {
      return next(new ApiError(409, 'Bu kategoriyaga bog\'liq e\'lonlar mavjud, o\'chirib bo\'lmaydi'));
    }

    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return next(new ApiError(404, 'Kategoriya topilmadi'));

    res.json({ success: true, message: 'Kategoriya o\'chirildi' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
