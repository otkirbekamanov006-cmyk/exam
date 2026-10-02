const ApiError = require('../utils/ApiError');

/**
 * So'rov ma'lumotlarini Joi sxemalari asosida tekshiradi.
 * schemas ichida berilgan body, params va query qismlarinigina tekshiradi.
 * Tekshiruvdan o'tgan, kerak bo'lsa o'zgartirilgan qiymatlarni req obyektiga qayta yozadi.
 */
const validate = (schemas) => (req, res, next) => {
  const errors = [];

  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const { error, value } = schemas[key].validate(req[key] || {}, {
      abortEarly: false,
      stripUnknown: true,
      errors: { wrap: { label: false } },
    });
    if (error) {
      error.details.forEach((d) => {
        errors.push({ field: d.path.join('.') || key, message: d.message });
      });
    } else if (key === 'query') {
      // Express 4 da req.query oddiy qiymat sifatida berilmaydi; o'zgartirilgan natijani alohida saqlaymiz.
      req.validatedQuery = value;
    } else {
      req[key] = value;
    }
  }

  if (errors.length) return next(ApiError.badRequest('Validatsiya xatosi', errors));
  next();
};

module.exports = validate;
