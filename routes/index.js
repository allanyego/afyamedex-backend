var express = require("express");

const usersRouter = require("./users");
const appointmentsRouter = require("./appointments");
const conditionsRouter = require("./conditions");
const messagesRouter = require("./messages");
const reviewsRouter = require("./reviews");
const favoritesRouter = require("./favorites");

var router = express.Router();

router.use("/users", usersRouter);
router.use("/appointments", appointmentsRouter);
router.use("/conditions", conditionsRouter);
router.use("/messages", messagesRouter);
router.use("/reviews", reviewsRouter);
router.use("/favorites", favoritesRouter);

module.exports = router;
