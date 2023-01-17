const authorizePix = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizePix");
const authorizeCreditCard = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizeCreditCard");
const authorizeCheckoutPro = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizeCheckoutPro");

const handlePix = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handlePix");
const handleCreditCard = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handleCreditCard");
const handleCheckoutPro = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handleCheckoutPro");

const processFormPix = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormPix");
const processFormCreditCard = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormCreditCard");

const processFormCheckoutPro = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormCheckoutPro");

const savePaymentInformation = require("*/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation");

module.exports = {
  authorizePix: authorizePix,
  authorizeCreditCard: authorizeCreditCard,
  authorizeCheckoutPro: authorizeCheckoutPro,
  handlePix: handlePix,
  handleCheckoutPro: handleCheckoutPro,
  handleCreditCard: handleCreditCard,
  processFormPix: processFormPix,
  processFormCreditCard: processFormCreditCard,
  processFormCheckoutPro: processFormCheckoutPro,
  savePaymentInformation: savePaymentInformation
};
