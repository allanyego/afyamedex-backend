const mongoose = require("mongoose");
const { APPOINTMENT } = require("../util/constants");

const {
  STATUSES: { UNAPPROVED, APPROVED, REJECTED },
  TYPES: { ONSITE_CONSULTATION, ONSITE_TESTS, VIRTUAL_CONSULTATION },
} = APPOINTMENT;

const appointmentSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [ONSITE_CONSULTATION, ONSITE_TESTS, VIRTUAL_CONSULTATION],
      required: true,
    },
    status: {
      type: String,
      enum: [UNAPPROVED, APPROVED, REJECTED],
      default: UNAPPROVED,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
