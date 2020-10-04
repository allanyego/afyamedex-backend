const Joi = require("joi");

const newSchema = Joi.object({
  date: Joi.string().required(),
  time: Joi.string(),
  patient: Joi.string().required(),
  type: Joi.string().required(),
  subject: Joi.string().required(),
});

module.exports = {
  newSchema,
};
