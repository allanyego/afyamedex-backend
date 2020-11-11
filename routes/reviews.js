const express = require("express");

const router = express.Router();

const schema = require("../joi-schemas/review");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/reviews");
const auth = require("../middleware/auth");
const isClientError = require("../util/is-client-error");
const { USER } = require("../util/constants");

router.get("/user/:userId?", auth, async (req, res, next) => {
  const rating = req.query.rating;
  const user = req.params.userId;

  const opts = {};
  if (user && !rating) {
    opts.forUser = user;
    opts.byUser = res.locals.userId;
  } else if (user && rating) {
    opts.forUser = user;
  } else {
    opts.forUser = res.locals.userId;
  }

  try {
    res.json(
      createResponse({
        data: await controller.get({
          ...opts,
          rating,
        }),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:appointmentId", auth, async (req, res, next) => {
  try {
    res.json(
      createResponse({
        data: await controller.get({
          appointment: req.params.appointmentId,
        }),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post("/:appointmentId", auth, async function (req, res, next) {
  if (res.locals.userAccountType !== USER.ACCOUNT_TYPES.PATIENT) {
    return res.status(401).json(
      createResponse({
        error: "unauthorized operation: allowed for patients",
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
          appointment: req.params.appointmentId,
          byUser: res.locals.userId,
          ...req.body,
        }),
      })
    );
  } catch (error) {
    if (isClientError(error)) {
      if (error.message === "unauthorized") {
        return res.status(401).json(
          createResponse({
            error: "unauthorized operation",
          })
        );
      }
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
