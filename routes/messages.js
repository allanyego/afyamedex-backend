var express = require("express");
var router = express.Router();

const schema = require("../joi-schemas/message");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/threads");
const auth = require("../middleware/auth");
const isClientError = require("../util/is-client-error");

router.get("/user-threads/:userId", auth, async function (req, res, next) {
  const { userId } = req.params;

  if (userId !== res.locals.userId) {
    return res.status(401).json(
      createResponse({
        error: "unauthorized access",
      })
    );
  }

  try {
    res.json({
      data: await controller.getUserThreads(userId),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:threadId", auth, async function (req, res, next) {
  try {
    res.json(
      createResponse({
        data: await controller.get(req.params.threadId),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, async function (req, res, next) {
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
    console.log(error);
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
