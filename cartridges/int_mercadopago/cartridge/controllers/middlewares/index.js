const checkoutIndex = require("*/cartridge/controllers/middlewares/checkout/index");
const checkoutServiceIndex = require("*/cartridge/controllers/middlewares/checkoutServices/index");
const notificationIndex = require("*/cartridge/controllers/middlewares/notification/index");
const checkoutShippingServiceIndex = require("*/cartridge/controllers/middlewares/checkoutShippingServices/index");
const paymentInstrumentsIndex = require("*/cartridge/controllers/middlewares/paymentInstruments/index");

module.exports = {
  checkout: checkoutIndex,
  checkoutService: checkoutServiceIndex,
  notification: notificationIndex,
  checkoutShippingService: checkoutShippingServiceIndex,
  paymentInstruments: paymentInstrumentsIndex
};
