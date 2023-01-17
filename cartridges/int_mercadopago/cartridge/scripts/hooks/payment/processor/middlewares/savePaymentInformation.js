const CustomerMgr = require("dw/customer/CustomerMgr");
const COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function savePaymentInformation(req, basket, billingData) {
  if (
    !billingData.storedPaymentUUID &&
    req.currentCustomer.raw.authenticated &&
    req.currentCustomer.raw.registered &&
    billingData.saveCard &&
    billingData.paymentMethod.value ===
      MercadopagoUtil.PAYMENT_METHOD.credit_card
  ) {
    const customer = CustomerMgr.getCustomerByCustomerNumber(
      req.currentCustomer.profile.customerNo
    );

    const saveCardResult = COHelpers.savePaymentInstrumentToWallet(
      billingData,
      basket,
      customer
    );

    req.currentCustomer.wallet.paymentInstruments.push({
      creditCardHolder: saveCardResult.creditCardHolder,
      maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
      creditCardType: saveCardResult.creditCardType,
      creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
      creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
      UUID: saveCardResult.UUID,
      creditCardNumber: saveCardResult.creditCardNumber,
      raw: saveCardResult
    });
  }
}

module.exports = savePaymentInformation;
