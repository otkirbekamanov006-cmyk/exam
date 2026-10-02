<<<<<<< HEAD
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
=======
const deleteFiles = require('../utils/deleteFiles');

/**
 * Joi schema bilan so'rovni tekshiradi.
 * schema — Joi.object() bo'lib, req.body + req.params + req.query ni tekshiradi.
 * source — qaysi joydan tekshirish: 'body' | 'query' | 'params' | 'all' (default)
 */
const validate = (schema, source = 'all') => (req, res, next) => {
  let dataToValidate;
  if (source === 'body') dataToValidate = req.body;
  else if (source === 'query') dataToValidate = req.query;
  else if (source === 'params') dataToValidate = req.params;
  else dataToValidate = { ...req.body, ...req.params, ...req.query };

  const { error, value } = schema.validate(dataToValidate, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    // Yuklangan fayllar bo'lsa, ularni diskdan o'chiramiz
    if (req.files && req.files.length) deleteFiles(req.files);
    if (req.file) deleteFiles([req.file]);

    const errors = error.details.map((detail) => ({
      field: detail.path.join('.') || detail.context?.key || 'unknown',
      message: detail.message.replace(/['"]/g, '')
    }));

    return res.status(400).json({
      success: false,
      message: 'Validatsiya xatosi',
      errors
    });
  }

  // Tozalangan qiymatlarni qayta o'rnatamiz
  if (source === 'body' || source === 'all') Object.assign(req.body, value);
  if (source === 'query' || source === 'all') {
    // query ga faqat query maydoni tegishli qiymatlarni
    const queryKeys = Object.keys(req.query);
    queryKeys.forEach(k => { if (value[k] !== undefined) req.query[k] = value[k]; });
  }

  next();
};

module.exports = validate;
>>>>>>> 76df369 (faylni ozgartrdim)
