const server = require("server");

server.extend(module.superModule);

const _require = require("*/cartridge/controllers/middlewares/index");

const { checkoutShippingService } = _require;

server.append(
  "SubmitShipping",
  server.middleware.https,
  checkoutShippingService.submitShipping
);

module.exports = server.exports();
