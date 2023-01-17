const Transaction = require("dw/system/Transaction");
const collections = require("*/cartridge/scripts/util/collections");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function handleCreditCard(basket, paymentInformation) {
  const currentBasket = basket;

  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      if (!item.giftCertificateCode) {
        currentBasket.removePaymentInstrument(item);
      }
    });

    const paymentInstrument = currentBasket.createPaymentInstrument(
      MercadopagoUtil.PAYMENT_METHOD.credit_card,
      MercadopagoUtil.getTotalAmount(currentBasket)
    );

    paymentInstrument.setCreditCardExpirationMonth(
      paymentInformation.expirationMonth.value
    );
    paymentInstrument.setCreditCardExpirationYear(
      paymentInformation.expirationYear.value
    );
    paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber.value);
    paymentInstrument.setCreditCardType(paymentInformation.paymentMethodId.value);
    paymentInstrument.setCreditCardToken(paymentInformation.token.value);

    paymentInstrument.custom.paymentTypeId = paymentInformation.paymentTypeId.value;
    paymentInstrument.custom.cardTypeName = paymentInformation.cardTypeName.value;

    paymentInstrument.custom.payerEmail = paymentInformation.email.value;
    paymentInstrument.custom.payerDocType = paymentInformation.docType.value;
    paymentInstrument.custom.payerDocNumber = paymentInformation.docNumber.value;
  });

  return {
    fieldErrors: {},
    serverErrors: [],
    error: false
  };
}

module.exports = handleCreditCard;
