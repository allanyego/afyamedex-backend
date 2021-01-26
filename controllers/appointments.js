const fs = require("fs");
const path = require("path");
const Appointment = require("../models/appointment");
const { ALLOWED_FILE_TYPES } = require("../util/constants");
const throwError = require("./helpers/throw-error");

async function add(data) {
  if (
    await Appointment.findOne({
      date: data.date,
      time: data.time,
      professional: data.professional,
    })
  ) {
    throwError("Selected time slot is occupied.");
  }
  return await Appointment.create(data);
}

const fieldsToGet = "_id fullName";

async function get(_id) {
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

async function getPayments(userId) {
  return await Appointment.find({
    professional: userId,
    hasBeenBilled: true,
  })
    .populate("professional", fieldsToGet)
    .populate("patient", fieldsToGet);
}

async function update(_id, data) {
  // Check it has a test file
  if (data.file) {
    const ext = data.file.originalname.split(".").pop();
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      throwError(
        "file format should be one of: " + ALLOWED_FILE_TYPES.join(", ")
      );
    }

    const fileName = `${_id}.${ext}`;
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "test-files",
      fileName
    );
    await new Promise((res, rej) => {
      fs.writeFile(filePath, data.file.buffer, (err) => {
        if (err) {
          rej(err);
        }

        res();
      });
    });

    await Appointment.updateOne(
      { _id },
      {
        amount: data.amount,
        status: data.status,
        testSummary: data.testSummary,
        testFile: fileName,
        dateBilled: data.dateBilled || null,
      }
    );

    return {
      testFile: fileName,
    };
  }

  return await Appointment.updateOne({ _id }, data);
}

async function findById(id) {
  return await Appointment.findById(id)
    .populate("patient", fieldsToGet)
    .populate("professional", fieldsToGet);
}

module.exports = {
  add,
  get,
  getPayments,
  update,
  findById,
};
