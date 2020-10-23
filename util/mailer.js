const nodemailer = require("nodemailer");

const { SMTP_USERNAME: user, SMTP_PASSWORD: pass } = process.env;

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user,
    pass,
  },
});

module.exports = mailer;
