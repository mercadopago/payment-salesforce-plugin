const base = module.superModule;
const collections = require("*/cartridge/scripts/util/collections");

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
  return collections.map(selectedPaymentInstruments, (paymentInstrument) => {
    const results = {
      paymentMethod: paymentInstrument.paymentMethod,
      amount: paymentInstrument.paymentTransaction.amount.value
    };
    if (paymentInstrument.paymentMethod === "CREDIT_CARD") {
      results.lastFour = paymentInstrument.creditCardNumberLastDigits;
      results.owner = paymentInstrument.creditCardHolder;
      results.expirationYear = paymentInstrument.creditCardExpirationYear;
      results.type = paymentInstrument.custom.cardTypeName;
      results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
      results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
    } else if (paymentInstrument.paymentMethod === "GIFT_CERTIFICATE") {
      results.giftCertificateCode = paymentInstrument.giftCertificateCode;
      results.maskedGiftCertificateCode =
        paymentInstrument.maskedGiftCertificateCode;
    } else if (paymentInstrument.paymentMethod === "PIX") {
      results.pixQrCode = paymentInstrument.custom.pixQrCode;
      results.pixQrCodeBase64 = paymentInstrument.custom.pixQrCodeBase64;
    } else if (paymentInstrument.paymentMethod === "CHECKOUT_PRO") {
      results.checkoutProLink = paymentInstrument.custom.checkoutProLink;
    }

    return results;
  });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
  base.call(this, currentBasket, currentCustomer, countryCode);
  const { paymentInstruments } = currentBasket;

  this.selectedPaymentInstruments = paymentInstruments
    ? getSelectedPaymentInstruments(paymentInstruments)
    : null;

  this.paymentStatuses = {
    PAYMENT_STATUS_NOTPAID: 0,
    PAYMENT_STATUS_PAID: 2,
    PAYMENT_STATUS_PARTPAID: 1
  };

  this.paymentStatus = Object.hasOwnProperty.call(
    currentBasket,
    "paymentStatus"
  )
    ? currentBasket.paymentStatus.value
    : null;
}

module.exports = Payment;
