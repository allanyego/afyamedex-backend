var express = require("express");
const bcrypt = require("bcrypt");

var router = express.Router();

const schema = require("../joi-schemas/user");
const createResponse = require("./helpers/create-response");
const controller = require("../controllers/users");
const sign = require("./helpers/sign");
const auth = require("../middleware/auth");

router.get("/", async function (req, res, next) {
  const { username, accountType } = req.query;

  try {
    res.json(
      createResponse({
        data: await controller.get({
          username,
          accountType,
        }),
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post("/signin", async function (req, res, next) {
  const { username, password } = req.body;
  let user = await controller.findByUsername(username);

  if (!user) {
    return res.json(
      createResponse({
        error: "No user found matching credentials.",
      })
    );
  }

  if (await bcrypt.compare(password, user.password)) {
    user = user.toJSON();
    delete user.password;
    // Append a token to the user
    user.token = sign(user);
    res.json(
      createResponse({
        data: user,
      })
    );
  } else {
    res.json(
      createResponse({
        error: "Invalid credentials.",
      })
    );
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

  const hashedPassword = await bcrypt.hash(req.body.password, 3);

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
    if (error.message === "Possible duplicate.") {
      return res.json(
        createResponse({
          error: "There is a stream existing with similar details.",
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
    res.status(201).json(
      createResponse({
        data: await controller.update(req.params.userId, req.body),
      })
    );
  } catch (error) {
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
    next(error);
  }
});

module.exports = router;
