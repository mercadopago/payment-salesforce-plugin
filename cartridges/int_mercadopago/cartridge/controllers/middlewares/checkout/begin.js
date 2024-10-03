const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function begin(req, res, next) {
  if (res.viewData.customer.customerPaymentInstruments) {
    res.viewData.customer.customerPaymentInstruments.forEach((item) => {
      item.creditCardType = item.custom.creditCardName;
    });
  }
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
    siteId: siteId,
    savedCardsInstallments: MercadopagoHelpers.getSavedCardsInstallments(
      viewData.customer.customerPaymentInstruments,
      viewData.order.priceTotal
    )
  };

  res.setViewData(viewData);
  return next();
}

module.exports = begin;
