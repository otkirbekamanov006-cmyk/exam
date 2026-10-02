const Joi = require('joi');

// Barcha tekshiruv sxemalarida ishlatiladigan umumiy o'zbekcha xato xabarlari.
const messages = {
  'any.required': '{#label} maydoni majburiy',
  'any.unknown': '{#label} maydoni yuborilmasligi kerak',
  'any.only': '{#label} qiymati noto\'g\'ri',
  'string.base': '{#label} matn bo\'lishi kerak',
  'string.empty': '{#label} bo\'sh bo\'lmasligi kerak',
  'string.min': '{#label} kamida {#limit} belgidan iborat bo\'lishi kerak',
  'string.max': '{#label} ko\'pi bilan {#limit} belgidan iborat bo\'lishi kerak',
  'string.email': 'Email formati noto\'g\'ri',
  'string.pattern.base': '{#label} formati noto\'g\'ri',
  'number.base': '{#label} son bo\'lishi kerak',
  'number.integer': '{#label} butun son bo\'lishi kerak',
  'number.positive': '{#label} musbat son bo\'lishi kerak',
  'number.max': '{#label} {#limit} dan katta bo\'lmasligi kerak',
  'object.min': 'Kamida bitta maydon yuborilishi kerak',
  'date.base': '{#label} YYYY-MM-DD formatidagi sana bo\'lishi kerak',
  'date.format': '{#label} YYYY-MM-DD formatida bo\'lishi kerak',
  'date.max': '{#label} kelajakdagi sana bo\'lishi mumkin emas',
};

const J = Joi.defaults((schema) => schema.messages(messages));

const id = J.number().integer().positive().required();
const idParam = J.object({ id });

const email = J.string().trim().lowercase().email().max(100);
const password = J.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .messages({ 'string.pattern.base': 'Parol kamida 1 ta harf va 1 ta raqamdan iborat bo\'lishi kerak' });
const code = J.string()
  .pattern(/^\d{6}$/)
  .messages({ 'string.pattern.base': 'Kod aynan 6 ta raqamdan iborat bo\'lishi kerak' });

module.exports = { Joi: J, id, idParam, email, password, code };
