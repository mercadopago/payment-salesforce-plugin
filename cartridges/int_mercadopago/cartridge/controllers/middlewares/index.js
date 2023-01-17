const checkoutIndex = require("*/cartridge/controllers/middlewares/checkout/index");
const checkoutServiceIndex = require("*/cartridge/controllers/middlewares/checkoutServices/index");
const notificationIndex = require("*/cartridge/controllers/middlewares/notification/index");

module.exports = {
  checkout: checkoutIndex,
  checkoutService: checkoutServiceIndex,
  notification: notificationIndex
};
