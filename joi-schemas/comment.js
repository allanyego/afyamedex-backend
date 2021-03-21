const Joi = require("joi");

const newSchema = Joi.object({
  user: Joi.string().required(),
  body: Joi.string().required(),
});

module.exports = {
  newSchema,
};
