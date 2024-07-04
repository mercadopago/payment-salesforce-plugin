const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function begin(req, res, next) {
  const viewData = res.getViewData();
  const paymentMethods = MercadopagoHelpers.paymentMethods.retrieve();
  const methodsOffEnabled = ["ticket", "atm", "bank_transfer"];
  const isMethodsOffEnabled = MercadopagoHelpers.hasPaymentMethodType(
    paymentMethods,
    methodsOffEnabled
  );
  const siteId = MercadopagoHelpers.getSiteId();
  viewData.mercadopago = {
    errorMessages: MercadopagoUtil.getErrorMessages(),
    textMessages: MercadopagoUtil.getTextMessages(),
    preferences: MercadopagoHelpers.getPreferences(),
    isPixEnabled: MercadopagoHelpers.hasPaymentMethod(paymentMethods, "pix"),
    isCreditsEnabled: MercadopagoHelpers.hasPaymentMethod(paymentMethods, "consumer_credits"),
    isMethodsOffEnabled: isMethodsOffEnabled,
    methodsOffOptions: MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      methodsOffEnabled
    ),
    siteId: siteId
  };

  res.setViewData(viewData);
  return next();
}

module.exports = begin;
