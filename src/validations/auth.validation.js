const { Joi, email, password, code } = require('./common');

const register = Joi.object({
  full_name: Joi.string().trim().min(3).max(50).required(),
  email: email.required(),
  phone: Joi.string()
    .trim()
    .pattern(/^\+998\d{9}$/)
    .required()
    .messages({ 'string.pattern.base': 'Telefon +998XXXXXXXXX formatida bo\'lishi kerak' }),
  password: password.required(),
});

const verify = Joi.object({ email: email.required(), code: code.required() });
const emailOnly = Joi.object({ email: email.required() });
const login = Joi.object({ email: email.required(), password: Joi.string().required() });
const resetPassword = Joi.object({
  email: email.required(),
  code: code.required(),
  newPassword: password.required(),
});

module.exports = { register, verify, emailOnly, login, resetPassword };
