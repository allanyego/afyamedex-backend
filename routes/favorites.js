const express = require("express");

const router = express.Router();

const createResponse = require("./helpers/create-response");
const controller = require("../controllers/favorites");
const auth = require("../middleware/auth");
const isClientError = require("../util/is-client-error");
const { USER } = require("../util/constants");

router.get("/", auth, async (req, res, next) => {
  const favorited = req.query.favorited;

  try {
    res.json(
      createResponse({
        data: await controller.get({
          user: res.locals.userId,
          favorited,
        }),
      })
    );
  } catch (error) {
      next(error);
  }
});

router.post("/:userId", auth, async function (req, res, next) {
  if (res.locals.userAccountType !== USER.ACCOUNT_TYPES.PATIENT) {
    return res.status(401).json(
      createResponse({
        error: "unauthorized operation: allowed for patients",
      })
    );
  }

  try {
    res.status(200).json(
      createResponse({
        data: await controller.favorite({
            user: res.locals.userId,
            favorited: req.params.userId,
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