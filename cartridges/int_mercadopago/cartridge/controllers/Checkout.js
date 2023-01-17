const server = require("server");

server.extend(module.superModule);

const _require = require("*/cartridge/controllers/middlewares/index");

const { checkout } = _require;

server.append("Begin", server.middleware.https, checkout.begin);

module.exports = server.exports();
