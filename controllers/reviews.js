const {
  Schema: {
    Types: { ObjectId },
  },
} = require("mongoose");
const Review = require("../models/review");
const User = require("../models/user");
const Appointment = require("../models/appointment");
const CustomError = require("../util/custom-error");
const { USER, APPOINTMENT } = require("../util/constants");

async function add({ appointment, byUser, rating, feedback }) {
  if (await Review.findOne({ appointment })) {
    throw new CustomError("appointment already has a review");
  }

  let _appointment = await Appointment.findById(appointment);
  if (!_appointment) {
    throw new CustomError("no matching appointment found");
  }

  if (
    _appointment.status !== APPOINTMENT.STATUSES.CLOSED ||
    !_appointment.hasBeenBilled
  ) {
    throw new CustomError("not eligible for a review");
  }

  if (String(_appointment.patient) !== byUser) {
    throw new CustomError("unauthorized");
  }

  const newReview = await Review.create({
    forUser: _appointment.professional,
    appointment,
    byUser,
    rating,
    feedback,
  });
  _appointment.hasReview = true;
  await _appointment.save();
  return newReview;
}

async function get({ forUser, rating = undefined, appointment = undefined }) {
  if (appointment) {
    return await Review.findOne({
      appointment,
    });
  }

  if (rating) {
    return await Review.aggregate([
      { $match: { _id: ObjectId(forUser) } },
      { $group: { rating: { $avg: "rating" } } },
    ]);
  }

  return await Review.find({
    forUser,
  }).populate("byUser", "_id fullName");
}

module.exports = {
  add,
  get,
};
