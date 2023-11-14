// added by Abdelwahab
const dotenv = require("dotenv");
// dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sender = process.env.TWILIO_SENDER_NUMBER;

const client = require("twilio")(accountSid, authToken);
const sendSMS = (options) => {
  client.messages
    .create({ from: sender, body: options.body, to: options.to })
    .then((message) =>
      console.log("message sent successfully: ", message.sid)
    ).catch((error) => console.error("message was not sent: ", error));
};

module.exports = sendSMS;
