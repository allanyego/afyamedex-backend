const Appointment = require("../models/appointment");
const CustomError = require("../util/custom-error");

async function add(data) {
  if (
    await Appointment.findOne({
      date: data.date,
      time: data.time,
      professional: data.professional,
    })
  ) {
    throw new CustomError("occupied");
  }
  return await Appointment.create(data);
}

async function get(_id) {
  const fieldsToGet = "_id fullName";
  return await Appointment.find({
    $or: [
      {
        professional: {
          $eq: _id,
        },
      },
      {
        patient: {
          $eq: _id,
        },
      },
    ],
  })
    .populate("professional", fieldsToGet)
    .populate("patient", fieldsToGet);
}

async function update(_id, data) {
  return await Appointment.updateOne({ _id }, data);
}

async function findById(id) {
  return await Appointment.findById(id);
}

module.exports = {
  add,
  get,
  update,
  findById,
};
