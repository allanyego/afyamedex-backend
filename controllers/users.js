const bcrypt = require("bcrypt");
const tokenGen = require("generate-sms-verification-code");
const User = require("../models/user");
const Invite = require("../models/invite");
const { USER, TEST_RESET_CODE } = require("../util/constants");
const sign = require("../routes/helpers/sign");
const isProduction = require("../util/is-production");
const mailer = require("../util/mailer");
const throwError = require("./helpers/throw-error");

// Helper to normalize string properties
const normalizeUser = (data) => {
  if (data.email) {
    data.email = data.email.toLowerCase();
  }
  if (data.username) {
    data.username = data.username.toLowerCase();
  }
  if (data.fullName) {
    data.fullName = data.fullName.toLowerCase();
  }

  return data;
};

// Helper to check if user attributes are taken
const checkIfTaken = async (data) => {
  const { username, email, phone } = data;
  if (username && (await User.findOne({ username }))) {
    throwError("Username taken.");
  }

  if (
    email &&
    ((await User.findOne({ email: data.email })) ||
      (await Invite.findOne({ email: data.email })))
  ) {
    throwError("Email in use.");
  }

  if (phone && (await User.findOne({ phone: data.phone }))) {
    throwError("Phone number connected to an account.");
  }
};

// Helper to create a user
async function _create(data) {
  let user = await User.create(data);
  user = user.toObject();
  delete user.password;
  user.token = sign(user);
  return user;
}

// Helper to create admin user
async function createAdmin(data) {
  const invite = await Invite.findOne({
    email: data.email,
  });

  if (!invite) {
    throwError("No active invite for this email.");
  }
  if (!(await bcrypt.compare(data.code, invite.code))) {
    throwError("The invite code you provided is invalid.");
  }

  const user = await _create({
    ...data,
    accountType: USER.ACCOUNT_TYPES.ADMIN,
  });
  await invite.remove();
  return user;
}

async function create(data) {
  normalizeUser(data);

  if (data.code) {
    // Admin registration
    return await createAdmin(data);
  }

  await checkIfTaken(data);
  return await _create(data);
}

async function find({
  username,
  patient = false,
  includeDisabled = false,
  unset = false,
}) {
  const { PATIENT, PROFESSIONAL, INSTITUTION } = USER.ACCOUNT_TYPES;

  const opts = {};
  if (unset) {
    opts.accountType = null;
  } else {
    if (patient) {
      opts.accountType = PATIENT;
    } else {
      opts.accountType = {
        $in: [INSTITUTION, PROFESSIONAL],
      };
    }

    if (username) {
      opts.username = {
        $regex: username,
      };
    }
  }

  if (!includeDisabled) {
    opts.disabled = false;
  }

  return await User.find(opts).select("-password");
}

async function findByUsername(username, includeDisabled) {
  const opts = {};
  if (!includeDisabled) {
    opts.disabled = false;
  }

  return await User.findOne(opts)
    .or([{ username: username }, { email: username }])
    .select("-password");
}

// Invite a new ADMIN user
async function inviteAdmin(email) {
  email = normalizeUser({ email }).email;

  await checkIfTaken({ email });

  if (await Invite.findOne({ email })) {
    throwError("User already has an active invite.");
  }

  let code;
  if (!isProduction()) {
    code = TEST_RESET_CODE;
  } else {
    code = tokenGen(6, { type: "number" });
  }

  isProduction() &&
    (await mailer.sendMail({
      to: email,
      from: "afyamedex@gmail.com",
      subject: "Admin invite",
      text:
        `You have been invited to join the Afyamedex administrative team. ` +
        `Use this code to create an account: ${code}.`,
      html:
        `You have been invited to join the Afyamedex administrative team. ` +
        `Use this code to create an account: <strong>${code}<strong>.`,
    }));

  await Invite.create({
    email,
    code: await bcrypt.hash(String(code), Number(process.env.SALT_ROUNDS)),
  });

  return "Invite email sent successfully.";
}

async function updateUser(_id, data) {
  normalizeUser(data);

  await checkIfTaken(data);
  await User.updateOne({ _id }, data);
  const res = {
    updated: true,
  };

  if (data.accountType) {
    // generate a new token with new account details
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
    throwError("No matching user found .");
  }

  if (await bcrypt.compare(password, user.password)) {
    // Check if user already requested reset
    // For now, just remove the reset code
    // Later implement notification logic
    if (user.resetCodeExpiration && user.resetCodeExpiration < Date.now()) {
      user.resetCode = null;
      user.resetCodeExpiration = null;
      await user.save();
    }

    user = user.toJSON();
    delete user.password;
    // Append a token to the user
    user.token = sign(user);
    return user;
  } else {
    throwError("Invalid credentials.");
  }
}

async function resetPassword(username) {
  username = normalizeUser({ username }).username;

  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });

  if (!user) {
    throwError("No matching user found.");
  }

  // Check if user already requested reset
  if (user.resetCodeExpiration && user.resetCodeExpiration < Date.now()) {
    throwError("present_active_request");
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
        from: "afyamedex@gmail.com",
        subject: "Password reset",
        text: `You password reset code is ${code}. This expires in 48 hours.`,
        html:
          `You password reset code is <strong>${code}</strong>. ` +
          `This expires in <strong>48 hours</strong>.`,
      });
    }
  } catch (error) {
    console.log("mail error", error);
    throwError("There was an error sending a reset email");
  }
  // Save to db
  user.resetCode = await bcrypt.hash(code, Number(process.env.SALT_ROUNDS));
  user.resetCodeExpiration =
    Date.now() + Number(process.env.RESET_EXPIRATION_DURATION);
  await user.save();

  return "reset request success";
}

async function confirmReset({ resetCode, newPassword, username }) {
  username = normalizeUser({ username }).username;
  // Find user with code
  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });

  if (!user || !user.resetCode) {
    throwError("This user has no active reset request.");
  }

  if (!(await bcrypt.compare(resetCode, user.resetCode))) {
    throwError("Invalid reset code.");
  }

  // Check if expired and possibly remove code
  if (user.resetCodeExpiration <= Date.now()) {
    user.resetCode = null;
    user.resetCodeExpiration = null;
    await user.save();
    throwError("Reset code has expired.");
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
  authenticate,
  confirmReset,
  create,
  find,
  findByUsername,
  updateUser,
  findById,
  inviteAdmin,
  resetPassword,
};
