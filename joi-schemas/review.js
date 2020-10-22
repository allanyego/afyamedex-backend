const Joi = require("joi");

const newSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    feedback: Joi.string().allow(""),
});

module.exports = {
  newSchema,
};
