<<<<<<< HEAD
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
=======
const Joi = require('joi');

const registerSchema = Joi.object({
  body: Joi.object({
    full_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[0-9]{9,13}$/).required(),
    password: Joi.string().min(6).required(),
  }).required(),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).required(),
});

const verifySchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required(),
  }).required(),
});

const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
  }).required(),
});

const resetPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required(),
    password: Joi.string().min(6).required(),
  }).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
>>>>>>> 76df369 (faylni ozgartrdim)
