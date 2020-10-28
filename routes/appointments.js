const path = require("path");
var express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var router = express.Router();

const auth = require("../middleware/auth");
const schema = require("../joi-schemas/appointment");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/appointments");
const CustomError = require("../util/custom-error");
const { USER, APPOINTMENT } = require("../util/constants");
const isClientError = require("../util/is-client-error");

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

router.get("/test-file/:testFile", auth, async function (req, res, next) {
  try {
    res.sendFile(path.join(__dirname, "..", "uploads", req.params.testFile));
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
          error: "no matching appointment found",
        })
      );
    }

    if (String(appointment.patient) !== res.locals.userId) {
      return res.status(401).json(
        createResponse({
          error: "unathorized operation",
        })
      );
    }

    if (
      appointment.status !== APPOINTMENT.STATUSES.CLOSED ||
      appointment.hasBeenBilled
    ) {
      return res.json(
        createResponse({
          error: "appointment not in eligible for checkout",
        })
      );
    }

    let amount;
    let intent;

    if (appointment.type === APPOINTMENT.TYPES.ONSITE_TESTS) {
      amount = appointment.amount;
    } else {
      amount =
        Number(appointment.minutesBilled) * Number(process.env.CHARGE_RATE);
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

// router.get("/:appointmentId", async function (req, res, next) {
//   try {
//     res.json(
//       createResponse({
//         data: await controller.findById(req.params.conditionId),
//       })
//     );
//   } catch (error) {
//     next(error);
//   }
// });

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

router.put("/:appointmentId", auth, upload.single("testFile"), async function (
  req,
  res,
  next
) {
  // A patient tries an operation other than closing appointment
  if (res.locals.userAccountType === USER.ACCOUNT_TYPES.PATIENT) {
    const status = req.body.status;
    if (status && status !== APPOINTMENT.STATUSES.CLOSED) {
      return res.status(401).json(
        createResponse({
          error: "unauthorized operation",
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
          error: "no appointment match found",
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
});

module.exports = router;
