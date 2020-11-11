var express = require("express");
const bcrypt = require("bcrypt");

var router = express.Router();

const schema = require("../joi-schemas/user");
const adminSchema = require("../joi-schemas/admin");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/users");
const sign = require("./helpers/sign");
const auth = require("../middleware/auth");
const isClientError = require("../util/is-client-error");
const { passwordResetSchema } = require("../joi-schemas/user");
const { USER } = require("../util/constants");

router.get("/", auth, async function (req, res, next) {
  const { username, patient, unset } = req.query;
  const isAdmin = res.locals.userAccountType === USER.ACCOUNT_TYPES.ADMIN;

  try {
    res.json(
      createResponse({
        data: await controller.find({
          username,
          patient: !!patient || false,
          includeDisabled: isAdmin,
          unset: isAdmin && unset,
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
    res.status(201).json(
      createResponse({
        data: await controller.create({
          ...req.body,
          password: hashedPassword,
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

// Admin invite
router.post("/invite", auth, async (req, res, next) => {
  if (res.locals.userAccountType !== USER.ACCOUNT_TYPES.ADMIN) {
    return res.status(401).json(
      createResponse({
        error: "Unathorized operation",
      })
    );
  }

  try {
    await adminSchema.adminInviteSchema.validateAsync(req.body);
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
        data: await controller.inviteAdmin(req.body.email),
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

// Update user details
router.put("/:userId", auth, async function (req, res, next) {
  const { userAccountType, userId } = res.locals;
  const isAdmin = userAccountType === USER.ACCOUNT_TYPES.ADMIN;
  const isCurrent = userId === req.params.userId;

  if (!isCurrent && !isAdmin) {
    return res.status(401).json(
      createResponse({
        error: "Unauthorized operation.",
      })
    );
  }

  try {
    if (isAdmin && !isCurrent) {
      await adminSchema.adminEditSchema.validateAsync(req.body);
    } else {
      await schema.editSchema.validateAsync(req.body);
    }
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
        data: await controller.updateUser(req.params.userId, req.body),
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
