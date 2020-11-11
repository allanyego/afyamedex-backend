const sgMail = require("@sendgrid/mail");

const { SENDGRID_API_KEY } = process.env;
sgMail.setApiKey(SENDGRID_API_KEY);

const sendMail = async ({
  to,
  from, // Use the email address or domain you verified above
  subject,
  text,
  html = null,
}) => {
  return await sgMail.send({
    to,
    from,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendMail,
};
