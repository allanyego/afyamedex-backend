var express = require("express");
const bcrypt = require("bcrypt");

var router = express.Router();

const schema = require("../joi-schemas/user");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/users");
const sign = require("./helpers/sign");
const auth = require("../middleware/auth");
const isClientError = require("../util/is-client-error");
<<<<<<< HEAD
const { passwordResetSchema } = require("../joi-schemas/user");
=======
const { USER } = require("../util/constants");
>>>>>>> 0e446a83d85ce918a3b45e05662c24addbf8e5d8

router.get("/", async function (req, res, next) {
  const { username, patient } = req.query;

  try {
    res.json(
      createResponse({
        data: await controller.get({
          username,
          patient,
        }),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:userId", async function (req, res, next) {
  try {
    res.json(
      createResponse({
        data: await controller.findById(req.params.userId),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post("/signin", async function (req, res, next) {
  try {
    res.json({
      data: await controller.authenticate(req.body),
    });
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

// Reset password
router.post("/reset-password", async (req, res, next) => {
  if (!req.body.username) {
    return res.status(400).json(
      createResponse({
        error: "username is required",
      })
    );
  }

  try {
    res.json(
      createResponse({
        data: await controller.resetPassword(req.body.username),
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

// Verify password reset
router.post("/confirm-reset", async (req, res, next) => {
  try {
    await passwordResetSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json(
      createResponse({
        error: error.message,
      })
    );
  }

  try {
    res.json(
      createResponse({
        data: await controller.confirmReset(req.body),
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

router.post("/", async function (req, res, next) {
  try {
    await schema.newSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json(
      createResponse({
        error: error.message,
      })
    );
  }

  const hashedPassword = await bcrypt.hash(
    req.body.password,
    Number(process.env.SALT_ROUNDS)
  );

  try {
    let newUser = await controller.add({
      ...req.body,
      password: hashedPassword,
    });

    newUser = newUser.toJSON();
    delete newUser.password;
    newUser.token = sign(newUser);

    res.status(201).json(
      createResponse({
        data: newUser,
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

router.put("/:userId", auth, async function (req, res, next) {
  try {
    await schema.editSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json(
      createResponse({
        error: error.message,
      })
    );
  }

  try {
    res.json(
      createResponse({
        data: await controller.update(req.params.userId, req.body),
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

router.post("/reviews/:userId", auth, async function (req, res, next) {
  try {
    await schema.reviewSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json(
      createResponse({
        error: error.message,
      })
    );
  }

  const user = await controller.findById(req.params.userId);
  if (!user) {
    return res.json(
      createResponse({
        error: "No user found by specified id.",
      })
    );
  }

  user.reviews.push(req.body);

  try {
    await user.save();
    res.json(
      createResponse({
        data: "Review posted.",
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
