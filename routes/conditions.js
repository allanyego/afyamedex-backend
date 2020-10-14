var express = require("express");
var router = express.Router();

const auth = require("../middleware/auth");
const schema = require("../joi-schemas/condition");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/conditions");
const isClientError = require("../util/is-client-error");
const { USER } = require("../util/constants");

router.get("/", async function (req, res, next) {
  try {
    res.json(
      createResponse({
        data: await controller.get(),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:conditionId", async function (req, res, next) {
  try {
    res.json(
      createResponse({
        data: await controller.findById(req.params.conditionId),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, async function (req, res, next) {
  if (res.locals.userAccountType === USER.ACCOUNT_TYPES.PATIENT) {
    return res.status(401).json(
      createResponse({
        error: "Unauthorized operation",
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
        data: await controller.add(req.body),
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
