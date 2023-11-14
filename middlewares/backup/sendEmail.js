const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const sendSMS = require("./sendSMS");

dotenv.config();
const sendEmail = (mailOptions, smsOptions) => {
    if (smsOptions) {
        sendSMS(smsOptions);
    }
  const transporter = nodemailer.createTransport({
    host: "premium174.web-hosting.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_EMAIL_PASSWORD,
    },
  });

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
    } else {
      return "";
    }
  });
};

module.exports = sendEmail;
