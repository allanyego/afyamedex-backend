const Joi = require("joi");

const sharedSchema = {
  name: Joi.string().required(),
  description: Joi.string().required(),
  symptoms: Joi.string().required(),
  remedies: Joi.string().required(),
};

const newSchema = Joi.object({
  ...sharedSchema,
  startThread: Joi.boolean(),
});

const editSchema = Joi.object({
  sharedSchema,
});

module.exports = {
  newSchema,
  editSchema,
};
