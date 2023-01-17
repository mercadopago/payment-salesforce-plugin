const Transaction = require("dw/system/Transaction");
const collections = require("*/cartridge/scripts/util/collections");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function HandlePix(basket, paymentInformation) {
  const currentBasket = basket;

  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      if (!item.giftCertificateCode) {
        currentBasket.removePaymentInstrument(item);
      }
    });

    const paymentInstrument = currentBasket.createPaymentInstrument(
      MercadopagoUtil.PAYMENT_METHOD.pix,
      MercadopagoUtil.getTotalAmount(currentBasket)
    );

    paymentInstrument.custom.payerDocType = paymentInformation.docType.value;
    paymentInstrument.custom.payerDocNumber =
      paymentInformation.docNumber.value;
    paymentInstrument.custom.payerFirstName =
      paymentInformation.firstName.value;
    paymentInstrument.custom.payerLastName = paymentInformation.lastName.value;
    paymentInstrument.custom.payerEmail = paymentInformation.email.value;
  });

  return {
    fieldErrors: {},
    serverErrors: [],
    error: false
  };
}

module.exports = HandlePix;
