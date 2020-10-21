const bcrypt = require("bcrypt");

const User = require("../models/user");
const { USER } = require("../util/constants");
const CustomError = require("../util/custom-error");
const sign = require("../routes/helpers/sign");

async function add(data) {
  if (
    await User.findOne().or([
      { username: data.username },
      { email: data.email },
    ])
  ) {
    throw new CustomError("Possible duplicate.");
  }

  return await User.create(data);
}

async function get({ username, patient }) {
  const { PATIENT, PROFESSIONAL, INSTITUTION } = USER.ACCOUNT_TYPES;
  const ops = {};
  if (patient) {
    ops.accountType = PATIENT;
  } else {
    ops.accountType = {
      $in: [INSTITUTION, PROFESSIONAL],
    };
  }

  if (username) {
    ops.username = {
      $regex: username,
    };
  }

  return await User.find(ops).select("-password");
}

async function findByUsername(username) {
  return await User.findOne()
    .or([{ username: username }, { email: username }])
    .select("-password");
}

async function update(_id, data) {
  return await User.updateOne({ _id }, data);
}

async function findById(_id) {
  return await User.findById(_id).select("-password");
}

async function authenticate(data) {
  const { username, password } = data;
  let user = await User.findOne().or([
    { username: username },
    { email: username },
  ]);

  if (!user) {
    throw new CustomError("no user found matching credentials");
  }

  if (await bcrypt.compare(password, user.password)) {
    user = user.toJSON();
    delete user.password;
    // Append a token to the user
    user.token = sign(user);
    return user;
  } else {
    throw new CustomError("invalid credentials");
  }
}

module.exports = {
  add,
  get,
  findByUsername,
  update,
  findById,
  authenticate,
};
