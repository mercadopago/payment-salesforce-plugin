const server = require("server");

server.extend(module.superModule);

const _require = require("*/cartridge/controllers/middlewares/index");

const { checkoutService } = _require;

server.append(
  "PlaceOrder",
  server.middleware.https,
  checkoutService.placeOrder
);

server.get("ThankYou", server.middleware.https, checkoutService.thankYou);

server.get("GetPaymentInfo", server.middleware.https, checkoutService.getPaymentInfo);

server.post("AuthorizePayment", server.middleware.https, checkoutService.authorizePayment);

module.exports = server.exports();
