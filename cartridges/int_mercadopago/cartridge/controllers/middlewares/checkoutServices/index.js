const placeOrder = require("*/cartridge/controllers/middlewares/checkoutServices/placeOrder");
const thankYou = require("*/cartridge/controllers/middlewares/checkoutServices/thankYou");
const getPaymentInfo = require("*/cartridge/controllers/middlewares/checkoutServices/getPaymentInfo");
const authorizePayment = require("*/cartridge/controllers/middlewares/checkoutServices/authorizePayment");

module.exports = {
  placeOrder: placeOrder,
  thankYou: thankYou,
  getPaymentInfo: getPaymentInfo,
  authorizePayment: authorizePayment
};
