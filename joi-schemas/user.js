const Joi = require("joi");

const newSchema = Joi.object({
  fullName: Joi.string().required().trim(),
  email: Joi.string().email().required().trim(),
  username: Joi.string().required().alphanum().trim(),
  gender: Joi.string(),
  birthday: Joi.date(),
  password: Joi.string().required(),
  code: Joi.string().min(6),
  accountType: Joi.string(),
});

const editSchema = Joi.object({
  fullName: Joi.string().trim(),
  email: Joi.string().trim(),
  bio: Joi.string(),
  accountType: Joi.string(),
  experience: Joi.number(),
  phone: Joi.string().allow(""),
  available: Joi.boolean(),
  education: Joi.array().items(Joi.object()),
  speciality: Joi.string(),
  conditions: Joi.array().items(Joi.string()),
});

const passwordResetSchema = Joi.object({
  resetCode: Joi.number().required(),
  newPassword: Joi.string().required(),
  username: Joi.string().required().trim(),
});

const notificationSchema = Joi.object({
  token: Joi.string().required(),
});

module.exports = {
  newSchema,
  editSchema,
  notificationSchema,
  passwordResetSchema,
};
