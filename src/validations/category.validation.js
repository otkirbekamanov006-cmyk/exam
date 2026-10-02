const { Joi } = require('./common');

const body = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
});

module.exports = { body };
