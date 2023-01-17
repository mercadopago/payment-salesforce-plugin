const base = require("BaseCartridge/checkout/billing");
/**
 * @function updatePaymentInformation
 * @description Update payment details summary based on payment method
 * @param {Object} order - checkout model to use as basis of new truth
 */
base.methods.updatePaymentInformation = (order) => {
  // update payment details
  const $paymentSummary = $(".payment-details");

  let htmlToAppend = "";
  if (
    order.billing.payment &&
    order.billing.payment.selectedPaymentInstruments &&
    order.billing.payment.selectedPaymentInstruments.length > 0
  ) {
    order.billing.payment.selectedPaymentInstruments.forEach(
      (selectedPaymentInstrument) => {
        if (selectedPaymentInstrument.paymentMethod === "CREDIT_CARD") {
          htmlToAppend +=
            "<span>" +
            order.resources.cardType +
            " " +
            selectedPaymentInstrument.type +
            "</span><div>" +
            selectedPaymentInstrument.maskedCreditCardNumber +
            "</div><div><span>" +
            order.resources.cardEnding +
            " " +
            selectedPaymentInstrument.expirationMonth +
            "/" +
            selectedPaymentInstrument.expirationYear +
            "</span></div>";
        } else if (selectedPaymentInstrument.paymentMethod === "PIX") {
          const pixImage = $(".pix-option")[0].currentSrc;
          htmlToAppend += "<img src='" + pixImage + "' ";
          htmlToAppend += "height='32' ";
          htmlToAppend += "alt='PIX' ";
          htmlToAppend += "title='PIX' ";
          htmlToAppend += "style='margin-top: 10px' ";
          htmlToAppend += "/>";
          htmlToAppend += "<div class='pix-info summary-details'>";
          htmlToAppend += "<p>Ao final da compra, você receberá o código para fazer o pagamento no banco que escolher.</p>";
          htmlToAppend += "<p class='info-detail'>O Pix possui limite diário de transferência. Consulte o seu banco para mais informações</p>";
          htmlToAppend += "</div>";
        } else if (selectedPaymentInstrument.paymentMethod === "CHECKOUT_PRO") {
          const mercadoPagoImage = $(".checkout-pro-option")[0].currentSrc;
          htmlToAppend += "<img src='" + mercadoPagoImage + "' ";
          htmlToAppend += "height='32' ";
          htmlToAppend += "alt='CHECKOUT_PRO' ";
          htmlToAppend += "title='CHECKOUT_PRO' ";
          htmlToAppend += "style='margin-top: 10px' ";
          htmlToAppend += "/>";
        }
      }
    );
  }
  $paymentSummary.empty().append(htmlToAppend);
};
module.exports = base;
