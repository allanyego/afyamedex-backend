const mongoose = require("mongoose");

const { USER } = require("../util/constants");

const { ADMIN, PROFESSIONAL, PATIENT, INSTITUTION } = USER.ACCOUNT_TYPES;

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ["female", "male", ""],
      default: "",
    },
    birthday: {
      type: Date,
    },
    bio: {
      type: String,
    },
    conditions: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      default: null,
    },
    picture: {
      type: String,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    available: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: [ADMIN, PROFESSIONAL, PATIENT, INSTITUTION, null],
      default: null,
    },
    experience: Number,
    speciality: {
      type: String,
      default: null,
    },
    devices: {
      type: [
        {
          token: String,
        },
      ],
      default: [],
    },
    education: {
      type: [
        new mongoose.Schema({
          institution: String,
          areaOfStudy: String,
          startDate: String,
          endDate: String,
        }),
      ],
      default: [],
    },
    resetCode: {
      type: String,
      default: null,
    },
    resetCodeExpiration: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
