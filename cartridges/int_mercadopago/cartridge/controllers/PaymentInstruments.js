const server = require("server");

server.extend(module.superModule);

const _require = require("*/cartridge/controllers/middlewares/index");

const { paymentInstruments } = _require;

server.append("DeletePayment", server.middleware.https, paymentInstruments.deletePayment);

module.exports = server.exports();
