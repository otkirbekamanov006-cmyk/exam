const { Joi } = require('./common');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');

// Serverdagi joriy sanani YYYY-MM-DD formatida olish.
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const eventDate = Joi.string()
  .trim()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const d = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return helpers.error('date.base');
    if (value > today()) return helpers.error('date.max');
    return value;
  })
  .messages({ 'string.pattern.base': 'event_date YYYY-MM-DD formatida bo\'lishi kerak' });

const categoryId = Joi.number().integer().positive();
const title = Joi.string().trim().min(5).max(100);
const description = Joi.string().trim().min(10).max(1000);
const location = Joi.string().trim().min(3).max(150);

// 'lost' (yo'qolgan) turidagi e'longa maxfiy savol yoki javob qo'shilsa, tekshiruv xatosi qaytariladi.
const onlyForFound = Joi.any().forbidden()
  .messages({ 'any.unknown': '{#label} faqat \'found\' turidagi e\'lon uchun yuboriladi' });

const create = Joi.object({
  type: Joi.string().trim().lowercase().valid('lost', 'found').required()
    .messages({ 'any.only': 'type faqat \'lost\' yoki \'found\' bo\'lishi mumkin' }),
  category_id: categoryId.required(),
  title: title.required(),
  description: description.required(),
  location: location.required(),
  event_date: eventDate.required(),
  // 'found' (topilgan) turida savol va javob shart; 'lost' (yo'qolgan) turida ular yuborilmaydi.
  secret_question: Joi.any().when('type', {
    is: 'found',
    then: Joi.string().trim().min(10).max(200).required(),
    otherwise: onlyForFound,
  }),
  secret_answer: Joi.any().when('type', {
    is: 'found',
    then: Joi.string().trim().min(2).max(50).required(),
    otherwise: onlyForFound,
  }),
});

const update = Joi.object({
  title,
  description,
  location,
  category_id: categoryId,
  status: Joi.string().valid('closed')
    .messages({ 'any.only': 'status faqat \'closed\' qiymatiga o\'zgartirilishi mumkin' }),
}).min(1);

const list = Joi.object({
  type: Joi.string().trim().lowercase().valid('lost', 'found'),
  category_id: categoryId,
  search: Joi.string().trim().max(100).allow(''),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().max(50).default(10),
});

const report = Joi.object({
  message: Joi.string().trim().min(5).max(1000).required(),
});

// category_id ma'lumotlar bazasida mavjudligini tekshiradigan alohida middleware.
const categoryExists = async (req, res, next) => {
  try {
    const id = req.body.category_id;
    if (id === undefined) return next();
    const { rows } = await db.query('SELECT 1 FROM categories WHERE id = $1', [id]);
    if (!rows[0]) {
      throw ApiError.badRequest('Validatsiya xatosi', [{ field: 'category_id', message: 'Bunday kategoriya mavjud emas' }]);
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { create, update, list, report, categoryExists };
