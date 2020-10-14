var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const auth = require("../middleware/auth");
const schema = require("../joi-schemas/appointment");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/appointments");
const CustomError = require("../util/custom-error");
const { USER } = require("../util/constants");
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
    console.log("Joi error", error);
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

router.put("/:appointmentId", auth, async function (req, res, next) {
  if (res.locals.userAccountType === USER.ACCOUNT_TYPES.PATIENT) {
    return res.status(401).json(
      createResponse({
        error: "unauthorized",
      })
    );
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

    if (appointment.professional !== res.locals.userId) {
      return res.status(401).json(
        createResponse({
          error: "unathorized access",
        })
      );
    }

    res.json(
      createResponse({
        data: await controller.update(appointmentId, req.body),
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
