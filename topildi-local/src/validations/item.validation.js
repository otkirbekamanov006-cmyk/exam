const Joi = require('joi');

const createItemSchema = Joi.object({
  body: Joi.object({
    category_id: Joi.number().integer().positive().required(),
    type: Joi.string().valid('lost', 'found').required(),
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    location: Joi.string().min(3).max(150).required(),
    event_date: Joi.date().iso().required(),
    secret_question: Joi.string().max(200).allow('').optional(),
    secret_answer: Joi.string().min(2).required(),
  }).required(),
});

const updateStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }).required(),
  body: Joi.object({
    status: Joi.string().valid('active', 'returned', 'closed').required(),
  }).required(),
});

module.exports = {
  createItemSchema,
  updateStatusSchema,
};
