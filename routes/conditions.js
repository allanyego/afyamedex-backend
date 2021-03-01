const path = require("path");
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const schema = require("../joi-schemas/condition");
const adminSchema = require("../joi-schemas/admin");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/conditions");
const usersController = require("../controllers/users");
const isClientError = require("../util/is-client-error");
const { USER } = require("../util/constants");
const multer = require("../middleware/multer");
const sendVideo = require("../middleware/send-video");

router.get("/", auth, async function (req, res, next) {
  const isAdmin = res.locals.userAccountType === USER.ACCOUNT_TYPES.ADMIN;

  try {
    res.json(
      createResponse({
        data: await controller.find({
          search: req.query.search || null,
          includeDisabled: isAdmin,
        }),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:conditionId", auth, async function (req, res, next) {
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

router.get(
  "/media/:conditionId",
  async function (req, res, next) {
    try {
      const condition = await controller.findById(req.params.conditionId);
      const { mediaKind, mediaFile } = condition;

      if (mediaKind === "image") {
        res.sendFile(
          path.join(__dirname, "..", "uploads", "condition-files", mediaFile)
        );
      } else {
        res.locals.media = media;
        next();
      }
    } catch (error) {
      next(error);
    }
  },
  sendVideo
);

router.post(
  "/",
  auth,
  multer("single", "media"),
  async function (req, res, next) {
    const accType = res.locals.userAccountType;
    if (!accType || accType === USER.ACCOUNT_TYPES.PATIENT) {
      return res.status(401).json(
        createResponse({
          error: "Unauthorized operation",
        })
      );
    }

    const user = await usersController.findById(res.locals.userId);

    if (user.disabled) {
      return res.json(
        createResponse({
          error: "Account disabled. Can't post.",
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
          data: await controller.create({
            ...req.body,
            file: req.file,
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

router.put("/:conditionId", auth, async function (req, res, next) {
  const accType = res.locals.userAccountType;
  const isAdmin = accType === USER.ACCOUNT_TYPES.ADMIN;

  try {
    if (isAdmin) {
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
        data: await controller.updateCondition(
          req.params.conditionId,
          req.body
        ),
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
