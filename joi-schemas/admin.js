const Joi = require("joi");

const adminInviteSchema = Joi.object({
  email: Joi.string().email().required().trim(),
});

const adminEditSchema = Joi.object({
  disabled: Joi.boolean(),
});

module.exports = {
  adminInviteSchema,
  adminEditSchema,
};
