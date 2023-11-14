const express = require("express");
const {charge, checkoutSuccess, booking, bookingSuccess} = require("../controllers/payment");
const errorCatcher = require("../middlewares/errorCatcher");

const paymentRouter = express.Router();

paymentRouter.post("/charge", errorCatcher(charge));
paymentRouter.post("/successCheckout", errorCatcher(checkoutSuccess));
paymentRouter.post("/booking", errorCatcher(booking));
paymentRouter.post("/bookingSuccess", errorCatcher(bookingSuccess));

module.exports = paymentRouter;
