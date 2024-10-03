const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const collections = require("*/cartridge/scripts/util/collections");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

function createNewPaymentInstrument(currentBasket, paymentInformation) {
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
  paymentInstrument.custom.paymentTypeId = paymentInformation.paymentTypeId.value;
  paymentInstrument.custom.cardTypeName = paymentInformation.cardTypeName.value;
  paymentInstrument.custom.payerEmail = paymentInformation.email.value;
  paymentInstrument.setCreditCardType(paymentInformation.paymentMethodId.value);
  
  if (paymentInformation.token) {
    paymentInstrument.custom.payerDocType = paymentInformation.docType.value;
    paymentInstrument.custom.payerDocNumber = paymentInformation.docNumber.value;
    paymentInstrument.custom.saveCardToWallet = paymentInformation.saveCard.value;
    paymentInstrument.setCreditCardToken(paymentInformation.token.value);
  } else {
    const createTokenPayload = MercadopagoHelpers.createTokenPayload(
      paymentInformation.creditCardToken.value, paymentInformation.securityCode.value);

    try {
      const result = MercadopagoHelpers.getCardTokenSavedCard(createTokenPayload);
      if (!result.error) {
        paymentInstrument.setCreditCardToken(result.id);
      }
    } catch (error) {
      return error;
    }
  }
}

function handleCreditCard(basket, paymentInformation) {
  const currentBasket = basket;
  let error = false;
  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      if (!item.giftCertificateCode) {
        currentBasket.removePaymentInstrument(item);
      }
    });

    error = createNewPaymentInstrument(currentBasket, paymentInformation);
  });

  if (error) {
    return {
      fieldErrors: {},
      serverErrors: [Resource.msg("error.400", "mercadopago", null)],
      error: true
    };
  }

  return {
    fieldErrors: {},
    serverErrors: [],
    error: false
  };
}

module.exports = handleCreditCard;
