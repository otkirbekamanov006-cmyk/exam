const { Joi } = require('./common');

const create = Joi.object({
  answer: Joi.string().trim().min(2).max(50).required(),
  message: Joi.string().trim().max(1000).allow(''),
});

module.exports = { create };
