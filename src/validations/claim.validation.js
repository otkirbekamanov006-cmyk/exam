<<<<<<< HEAD
const { Joi } = require('./common');

const create = Joi.object({
  answer: Joi.string().trim().min(2).max(50).required(),
  message: Joi.string().trim().max(1000).allow(''),
});

module.exports = { create };
=======
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
>>>>>>> 76df369 (faylni ozgartrdim)
