const mongoose = require("mongoose");
const { APPOINTMENT } = require("../util/constants");

const {
  STATUSES: { UNAPPROVED, APPROVED, REJECTED, CLOSED },
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
    duration: {
      type: Number,
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
      enum: [UNAPPROVED, APPROVED, REJECTED, CLOSED],
      default: UNAPPROVED,
    },
    hasBeenBilled: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: null,
    },
    hasReview: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: String,
      default: null,
    },
    testFile: {
      type: String,
      default: null,
    },
    testSummary: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
