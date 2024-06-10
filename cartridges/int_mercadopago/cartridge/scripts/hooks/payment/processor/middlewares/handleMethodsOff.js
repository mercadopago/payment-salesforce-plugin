const Transaction = require("dw/system/Transaction");
const collections = require("*/cartridge/scripts/util/collections");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

function HandleMethodsOff(basket, paymentInformation) {
  const currentBasket = basket;

  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      if (!item.giftCertificateCode) {
        currentBasket.removePaymentInstrument(item);
      }
    });

    const paymentInstrument = currentBasket.createPaymentInstrument(
      MercadopagoUtil.PAYMENT_METHOD.methods_off,
      MercadopagoUtil.getTotalAmount(currentBasket)
    );

    paymentInstrument.custom.payerDocType = paymentInformation.docType.value;
    paymentInstrument.custom.payerDocNumber = paymentInformation.docNumber.value;
    paymentInstrument.custom.paymentOffMethodId = paymentInformation.paymentMethodId.value;
    paymentInstrument.custom.dateOfExpiration = MercadopagoUtil.GetFormatedDateToExpirationField(
      MercadopagoHelpers.getExpirationMethodsOff()
    );

    const method = MercadopagoHelpers.getPaymentMethodFromPlace(paymentInformation.paymentMethodId);

    paymentInstrument.custom.paymentPlace = method.place;
    paymentInstrument.custom.paymentOffMethodId = method.id;
  });

  return {
    fieldErrors: {},
    serverErrors: [],
    error: false
  };
}

module.exports = HandleMethodsOff;
