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

module.exports = server.exports();
