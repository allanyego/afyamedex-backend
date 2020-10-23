const nodemailer = require("nodemailer");

const { SMTP_USERNAME: user, SMTP_PASSWORD: pass } = process.env;

const mailer = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user,
    pass,
  },
});

module.exports = mailer;
