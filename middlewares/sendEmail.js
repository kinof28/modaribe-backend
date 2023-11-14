const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const sendSMS = require("./sendSMS");

dotenv.config();
const sendEmail = (mailOptions, smsOptions) => {
  const transporter = nodemailer.createTransport({
    host: "premium174.web-hosting.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_EMAIL_PASSWORD,
    },
  });
  try {
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
      } else {
        return "";
      }
    });
  } catch (error) {
    console.log(error);
  } finally {
    if (smsOptions) {
        try {
        sendSMS(smsOptions);
      } catch (error) {
        console.error(error);
      }
    }
  }
};

module.exports = sendEmail;
