const server = require("server");

const _require = require("*/cartridge/controllers/middlewares/index");

const { notification } = _require;

server.post(
  "PaymentNotifications",
  server.middleware.https,
  notification.paymentNotifications
);

module.exports = server.exports();
