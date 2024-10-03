const CustomerMgr = require("dw/customer/CustomerMgr");
const COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function savePaymentInformation(order) {
  if (
    order.customer.authenticated &&
    order.customer.registered &&
    order.paymentInstrument.custom.saveCardToWallet &&
    order.paymentInstrument.paymentMethod === MercadopagoUtil.PAYMENT_METHOD.credit_card
  ) {
    try {
      const customer = CustomerMgr.getCustomerByCustomerNumber(
        order.customer.profile.customerNo
      );

      const basket = {
        billingAddress: order.billingAddress
      };

      const billingData
       = {
         paymentInformation: {
           cardNumber: {
             value: order.paymentInstrument.creditCardNumber
           },
           cardType: {
             value: order.paymentInstrument.creditCardType
           },
           expirationMonth: {
             value: order.paymentInstrument.creditCardExpirationMonth
           },
           expirationYear: {
             value: order.paymentInstrument.creditCardExpirationYear
           },
           creditCardToken: {
             value: order.paymentInstrument.creditCardToken
           }
         }
       };

      const saveCardResult = COHelpers.savePaymentInstrumentToWallet(
        billingData,
        basket,
        customer
      );

      order.customer.profile.wallet.paymentInstruments.add({
        creditCardHolder: saveCardResult.creditCardHolder,
        maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
        creditCardType: saveCardResult.creditCardType,
        creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
        creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
        UUID: saveCardResult.UUID,
        creditCardNumber: saveCardResult.creditCardNumber,
        creditCardToken: saveCardResult.creditCardToken,
        custom: {
          customerIdMercadoPago: saveCardResult.custom.customerIdMercadoPago,
          cardBin: saveCardResult.custom.cardBin,
          creditCardName: saveCardResult.custom.creditCardName
        },
        raw: saveCardResult
      });

      return null;
    } catch (error) {
      return error.message;
    }
  }

  return null;
}

module.exports = savePaymentInformation;
