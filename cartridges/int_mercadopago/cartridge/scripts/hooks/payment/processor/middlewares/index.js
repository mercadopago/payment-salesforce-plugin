const authorizePix = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizePix");
const authorizeCreditCard = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizeCreditCard");
const authorizeCheckoutPro = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizeCheckoutPro");
const authorizeMercadoCredito = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizeMercadoCredito");
const authorizeMethodsOff = require("*/cartridge/scripts/hooks/payment/processor/middlewares/authorizeMethodsOff");

const handlePix = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handlePix");
const handleCreditCard = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handleCreditCard");
const handleCheckoutPro = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handleCheckoutPro");
const handleMercadoCredito = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handleMercadoCredito");
const handleMethodsOff = require("*/cartridge/scripts/hooks/payment/processor/middlewares/handleMethodsOff");

const processFormPix = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormPix");
const processFormCreditCard = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormCreditCard");
const processFormCheckoutPro = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormCheckoutPro");
const processFormMercadoCredito = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormMercadoCredito");
const processFormMethodsOff = require("*/cartridge/scripts/hooks/payment/processor/middlewares/processFormMethodsOff");

const savePaymentInformation = require("*/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation");

module.exports = {
  authorizePix: authorizePix,
  authorizeCreditCard: authorizeCreditCard,
  authorizeCheckoutPro: authorizeCheckoutPro,
  authorizeMercadoCredito: authorizeMercadoCredito,
  authorizeMethodsOff: authorizeMethodsOff,
  handlePix: handlePix,
  handleCreditCard: handleCreditCard,
  handleCheckoutPro: handleCheckoutPro,
  handleMercadoCredito: handleMercadoCredito,
  handleMethodsOff: handleMethodsOff,
  processFormPix: processFormPix,
  processFormCreditCard: processFormCreditCard,
  processFormCheckoutPro: processFormCheckoutPro,
  processFormMercadoCredito: processFormMercadoCredito,
  processFormMethodsOff: processFormMethodsOff,
  savePaymentInformation: savePaymentInformation
};
