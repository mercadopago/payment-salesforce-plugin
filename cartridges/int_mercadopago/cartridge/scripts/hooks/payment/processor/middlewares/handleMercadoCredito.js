const Transaction = require("dw/system/Transaction");
const collections = require("*/cartridge/scripts/util/collections");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function handleMercadoCredito(basket) {
  const currentBasket = basket;

  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      if (!item.giftCertificateCode) {
        currentBasket.removePaymentInstrument(item);
      }
    });

    currentBasket.createPaymentInstrument(
      MercadopagoUtil.PAYMENT_METHOD.mercado_credito,
      MercadopagoUtil.getTotalAmount(currentBasket)
    );
  });

  return {
    fieldErrors: {},
    serverErrors: [],
    error: false
  };
}

module.exports = handleMercadoCredito;
