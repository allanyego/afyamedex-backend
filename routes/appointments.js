const path = require("path");
var express = require("express");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var router = express.Router();

const auth = require("../middleware/auth");
const schema = require("../joi-schemas/appointment");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/appointments");
const { USER, APPOINTMENT } = require("../util/constants");
const isClientError = require("../util/is-client-error");
const multer = require("../middleware/multer");

router.get("/:userId", auth, async function (req, res, next) {
  if (res.locals.userId !== req.params.userId) {
    return res.status(401).json(
      createResponse({
        error: "unauthorized access",
      })
    );
  }

  try {
    res.json(
      createResponse({
        data: await controller.get(req.params.userId),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:userId/payments", auth, async function (req, res, next) {
  try {
    res.json(
      createResponse({
        data: await controller.getPayments(res.locals.userId),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/payments/summary", auth, async function (req, res, next) {
  let opts = null;
  const { professional, patient } = req.query;
  console.log("Got request", { professional, patient }, req.query);
  if (professional && patient) {
    opts = { patient, professional };
  }

  try {
    res.json(
      createResponse({
        data: await controller.getPaymentSummary(opts),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get(
  "/appointment/:appointmentId",
  auth,
  async function (req, res, next) {
    const _appointment = await controller.findById(req.params.appointmentId);

    if (!_appointment) {
      return res.json(
        createResponse({
          error: "No matching appoinment found.",
        })
      );
    }

    const { patient, professional } = _appointment;

    if (
      res.locals.userId !== String(patient._id) &&
      res.locals.userId !== String(professional._id)
    ) {
      return res.status(401).json(
        createResponse({
          error: "Unauthorized access.",
        })
      );
    }

    try {
      res.json(
        createResponse({
          data: _appointment,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

router.get("/test-file/:testFile", auth, async function (req, res, next) {
  try {
    res.sendFile(
      path.join(__dirname, "..", "uploads", "test-files", req.params.testFile)
    );
  } catch (error) {
    next(error);
  }
});

router.get("/checkout/:appointmentId", auth, async (req, res, next) => {
  try {
    const appointment = await controller.findById(req.params.appointmentId);

    if (!appointment) {
      return res.json(
        createResponse({
          error: "No matching appointment found.",
        })
      );
    }

    if (String(appointment.patient._id) !== res.locals.userId) {
      return res.status(401).json(
        createResponse({
          error: "Unathorized operation.",
        })
      );
    }

    if (
      appointment.status !== APPOINTMENT.STATUSES.CLOSED ||
      appointment.hasBeenBilled
    ) {
      return res.json(
        createResponse({
          error: "Appointment not in eligible for checkout.",
        })
      );
    }

    let amount;
    let intent;

    if (appointment.type === APPOINTMENT.TYPES.ONSITE_TESTS) {
      amount = appointment.amount;
    } else {
      let duration = Number(appointment.duration);
      duration = duration > 10 ? duration : 10;
      amount = duration * Number(process.env.CHARGE_RATE);
    }

    try {
      intent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        metadata: {
          integration_check: "accept_a_payment",
        },
      });
    } catch (error) {
      if (error.type === "card_error") {
        return res.json(
          createResponse({
            error: error.message,
          })
        );
      }
      console.log("Stripe payment error", error);
      return res.json(
        createResponse({
          error: "there was an error processing the payment",
        })
      );
    }

    res.json(
      createResponse({
        data: {
          clientSecret: intent.client_secret,
          amount: intent.amount,
        },
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post("/:professionalId", auth, async function (req, res, next) {
  if (res.locals.userAccountType !== USER.ACCOUNT_TYPES.PATIENT) {
    return res.json(
      createResponse({
        error: "operation allowed for patients only",
      })
    );
  }

  try {
    await schema.newSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json(
      createResponse({
        error: error.message,
      })
    );
  }

  try {
    res.status(201).json(
      createResponse({
        data: await controller.add({
          ...req.body,
          professional: req.params.professionalId,
        }),
      })
    );
  } catch (error) {
    if (isClientError(error)) {
      return res.json(
        createResponse({
          error: error.message,
        })
      );
    }

    next(error);
  }
});

router.put(
  "/:appointmentId",
  auth,
  multer("single", "testFile"),
  async function (req, res, next) {
    // A patient tries an operation other than closing appointment
    if (res.locals.userAccountType === USER.ACCOUNT_TYPES.PATIENT) {
      const status = req.body.status;
      if (status && status !== APPOINTMENT.STATUSES.CLOSED) {
        return res.status(401).json(
          createResponse({
            error: "Unauthorized operation.",
          })
        );
      }
    }

    try {
      const { appointmentId } = req.params;
      const appointment = await controller.findById(appointmentId);
      if (!appointment) {
        return res.json(
          createResponse({
            error: "No matching appointment found.",
          })
        );
      }

      res.json(
        createResponse({
          data: await controller.update(appointmentId, {
            ...req.body,
            file: req.file || null,
          }),
        })
      );
    } catch (error) {
      if (isClientError(error)) {
        return res.json(
          createResponse({
            error: error.message,
          })
        );
      }

      next(error);
    }
  }
);

module.exports = router;
