var express = require("express");

const usersRouter = require("./users");
const appointmentsRouter = require("./appointments");
const conditionsRouter = require("./conditions");
const messagesRouter = require("./messages");

var router = express.Router();

router.use("/users", usersRouter);
router.use("/appointments", appointmentsRouter);
router.use("/conditions", conditionsRouter);
router.use("/messages", messagesRouter);

module.exports = router;
