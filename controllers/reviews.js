const {
  Types: { ObjectId },
} = require("mongoose");
const Review = require("../models/review");
const User = require("../models/user");
const Appointment = require("../models/appointment");
const { USER, APPOINTMENT } = require("../util/constants");
const throwError = require("./helpers/throw-error");

async function add({ appointment, byUser, rating, feedback }) {
  if (await Review.findOne({ appointment })) {
    throwError("appointment already has a review");
  }

  let _appointment = await Appointment.findById(appointment);
  if (!_appointment) {
    throwError("no matching appointment found");
  }

  if (
    _appointment.status !== APPOINTMENT.STATUSES.CLOSED ||
    !_appointment.hasBeenBilled
  ) {
    throwError("not eligible for a review");
  }

  if (String(_appointment.patient) !== byUser) {
    throwError("unauthorized");
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
      { $match: { forUser: ObjectId(forUser) } },
      { $group: { _id: null, rating: { $avg: "$rating" } } },
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
