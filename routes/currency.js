const express = require("express");

const currencyRouter = express.Router();

const errorCatcher = require("../middlewares/errorCatcher");
const { convert, getConversionRate } = require("../controllers/currency");

currencyRouter.get("/convert/:from/:to/:amount", errorCatcher(convert));
currencyRouter.get("/conversion-rate/:to", errorCatcher(getConversionRate));

module.exports = currencyRouter;
