const bcrypt = require("bcrypt");
const tokenGen = require("generate-sms-verification-code");
const User = require("../models/user");
const { USER, TEST_RESET_CODE } = require("../util/constants");
const CustomError = require("../util/custom-error");
const sign = require("../routes/helpers/sign");
const isProduction = require("../util/is-production");
const mailer = require("../util/mailer");

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
  await User.updateOne({ _id }, data);
  // generate a new token with new account details
  const res = {
    updated: true,
  };

  if (data.accountType) {
    res.token = sign({
      _id,
      accountType: data.accountType,
    });
  }

  return res;
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

async function resetPassword(username) {
  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });

  if (!user) {
    throw new CustomError("no user found");
  }

  // Check if user already requested reset
  if (user.resetCodeExpiration && user.resetCodeExpiration < Date.now()) {
    throw new CustomError("present_active_request");
  }

  // Generate reset code
  let code;
  if (!isProduction()) {
    code = TEST_RESET_CODE;
  } else {
    code = tokenGen(6, { type: "number" });
  }
  // Send email
  try {
    if (isProduction()) {
      await mailer.sendMail({
        to: user.email,
        from: "Afyamedex",
        subject: "Password reset",
        text: `You password reset code is ${code}. This expires in 48 hours.`,
      });
    }
  } catch (error) {
    console.log("mail error", error);
    throw new CustomError("There was an error sending a reset email");
  }
  // Save to db
  user.resetCode = code;
  user.resetCodeExpiration =
    Date.now() + Number(process.env.RESET_EXPIRATION_DURATION);
  await user.save();

  return "reset request success";
}

async function confirmReset({ resetCode, newPassword, username }) {
  // Find user with code
  const user = await User.findOne({
    resetCode,
    $or: [{ username }, { email: username }],
  });
  // Check if expired and possibly remove code
  if (user.resetCodeExpiration <= Date.now()) {
    user.resetCode = null;
    user.resetCodeExpiration = null;
    await user.save();
    throw new CustomError("code expired");
  }
  // Hash and set new password for user
  user.password = await bcrypt.hash(
    newPassword,
    Number(process.env.SALT_ROUNDS)
  );
  user.resetCode = null;
  user.resetCodeExpiration = null;
  await user.save();
  return "password changed successfully";
}

module.exports = {
  add,
  get,
  findByUsername,
  update,
  findById,
  authenticate,
  resetPassword,
  confirmReset,
};
