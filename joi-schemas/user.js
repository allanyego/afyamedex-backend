const Joi = require("joi");

const newSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  gender: Joi.string(),
  birthday: Joi.date(),
  password: Joi.string().required(),
});

const editSchema = Joi.object({
  fullName: Joi.string(),
  email: Joi.string(),
  bio: Joi.string(),
  accountType: Joi.string(),
  experience: Joi.string(),
  contact: Joi.object({
    phone: Joi.string(),
    email: Joi.string().email(),
  }),
  education: Joi.array().items(
    Joi.object({
      institution: Joi.string(),
      areaOfStudy: Joi.string(),
      startDate: Joi.string(),
      endDate: Joi.string(),
    })
  ),
  speciality: Joi.array().items(Joi.string()),
  conditions: Joi.array().items(Joi.string()),
});

const passwordResetSchema = Joi.object({
  resetCode: Joi.number().required(),
  newPassword: Joi.string().required(),
  username: Joi.string().required(),
});

module.exports = {
  newSchema,
  editSchema,
  passwordResetSchema,
};
