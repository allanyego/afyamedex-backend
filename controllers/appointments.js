const fs = require("fs");
const path = require("path");
const Appointment = require("../models/appointment");
const User = require("../models/user");
const { ALLOWED_FILE_TYPES, APPOINTMENT } = require("../util/constants");
const sendPushNotification = require("./helpers/send-push-notification");
const throwError = require("./helpers/throw-error");

const notificationTTL = 60 * 60 * 24 * 3; // Upto three days,

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

  const newAppointment = await Appointment.create(data);
  // Get professional's devices' tokens, if any, and send notification
  const professional = await User.findById(data.professional).select("devices");
  sendPushNotification(
    professional.devices,
    {
      notification: {
        title: "Appointment Request",
        body:
          "You have received a new request for an appointment. Open the app to respond.",
      },
    },
    {
      timeToLive: notificationTTL,
    }
  ).then((res) => null);

  return newAppointment;
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

async function getPaymentSummary(opts) {
  if (opts) {
    return await Appointment.find({
      ...opts,
      hasBeenBilled: true,
    })
      .populate("patient", fieldsToGet)
      .populate("professional", fieldsToGet);
  }

  const matchedAppointments = await Appointment.aggregate([
    { $match: { hasBeenBilled: true } },
    {
      $group: {
        _id: { patient: "$patient", professional: "$professional" },
        totalPayments: { $sum: "$amount" },
        appointmentCount: { $sum: 1 },
      },
    },
  ]);

  return matchedAppointments;
}

async function update(_id, data) {
  const appointment = await Appointment.findById(_id);

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

    await appointment.updateOne({
      amount: data.amount,
      status: data.status,
      testSummary: data.testSummary,
      testFile: fileName,
      dateBilled: data.dateBilled || null,
    });

    return {
      testFile: fileName,
    };
  }

  // Handle push notifications
  const { APPROVED, REJECTED } = APPOINTMENT.STATUSES;
  if (data.status === APPROVED || data.status === REJECTED) {
    // Find patient and send notification to registered tokens
    const patient = await User.findById(appointment.patient);
    sendPushNotification(
      patient.devices,
      {
        notification: {
          title: "Appointment Response",
          body: `Your appointment request has been ${
            data.status === APPROVED ? "approved" : "rejected"
          }.`,
        },
      },
      {
        timeToLive: notificationTTL,
      }
    ).then((res) => null);
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
  getPaymentSummary,
  update,
  findById,
};
