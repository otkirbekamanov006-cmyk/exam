const Joi = require('joi');

const createClaimSchema = Joi.object({
  params: Joi.object({
    itemId: Joi.number().integer().positive().required(),
  }).required(),
  body: Joi.object({
    answer: Joi.string().min(1).required(),
    message: Joi.string().max(500).allow('').optional(),
  }).required(),
});

module.exports = {
  createClaimSchema,
};
