const CC = require("currency-converter-lt");
const currencyConverter = new CC();

const convert = async (req, res) => {
  const { from, to, amount } = req.params;
  if (
    !from ||
    !to ||
    !amount ||
    `${from}`.trim() === "" ||
    `${to}`.trim() === "" ||
    `${amount}`.trim() === ""
  ) {
    return res.status(400).json({
      message: "Please provide all the required fields",
    });
  }
  const newPriceRemote = await currencyConverter
    .from("from")
    .to(to)
    .amount(+amount)
    .convert();
  return res.status(200).json({
    status: 200,
    data: newPriceRemote,
    msg: {
      arabic: "تم تحويل العملة بنجاح",
      english: "currency converted successfully",
    },
  });
};

const getConversionRate = async (req, res) => {
  const { to } = req.params;
  if (!to || `${to}`.trim() === "") {
    return res.status(400).json({
      message: "Please provide all the required fields",
    });
  }
  const conversionRate = await currencyConverter
    .from("OMR")
    .to(to)
    .amount(1)
    .convert();
  return res.status(200).json({
    status: 200,
    data: conversionRate,
    msg: {
      arabic: "تم تحويل العملة بنجاح",
      english: "currency converted successfully",
    },
  });
};
module.exports = {
  convert,
  getConversionRate,
};
