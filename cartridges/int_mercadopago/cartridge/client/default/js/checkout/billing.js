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
          const mercadoPagoText = $(".mp-text-messages").data("mpTextMessages")["field.checkoutpro.title"];
          htmlToAppend += "<div style='padding-top: 10px'>";
          htmlToAppend += "<img src='" + mercadoPagoImage + "' ";
          htmlToAppend += "height='32' ";
          htmlToAppend += "alt='CHECKOUT_PRO' ";
          htmlToAppend += "title='CHECKOUT_PRO' ";
          htmlToAppend += "/>";
          htmlToAppend += "<div>";
          htmlToAppend += "<p style='line-height: 21px;margin-top: 10px'>" + mercadoPagoText;
          htmlToAppend += "</p>";
          htmlToAppend += "</div>";
        } else if (selectedPaymentInstrument.paymentMethod === "MERCADO_CREDITO") {
          const mercadoPagoImage = $(".checkout-pro-option")[0].currentSrc;
          const mercadoCreditoTitleText = $(".checkout-credits-tab-text")[0].innerText;
          const mercadoCreditoText = $(".mp-text-messages").data("mpTextMessages")["field.mercadocredito.billing.message"];
          htmlToAppend += "<div style='padding-top: 10px'>";
          htmlToAppend += "<img src='" + mercadoPagoImage + "' ";
          htmlToAppend += "height='32' ";
          htmlToAppend += "alt='CHECKOUT_PRO' ";
          htmlToAppend += "title='CHECKOUT_PRO' ";
          htmlToAppend += "/>";
          htmlToAppend += "<span style='padding-left: 8px'>" + mercadoCreditoTitleText + "</span>";
          htmlToAppend += "</div>";
          htmlToAppend += "<div>";
          htmlToAppend += "<p style='line-height: 21px;margin-top: 10px'>" + mercadoCreditoText;
          htmlToAppend += "</p>";
          htmlToAppend += "</div>";
        } else if (selectedPaymentInstrument.paymentMethod === "CASH") {
          const { paymentPlace, dateOfExpiration } = selectedPaymentInstrument;
          const methodsOffInfo = $(".mp-text-messages").data("mpTextMessages")["field.methodsoff.invoice.place"];
          const methodsOffExpire = $(".mp-text-messages").data("mpTextMessages")["field.methodsoff.invoice.expire"];
          htmlToAppend += "<div class='methods-off-info' style='margin-top: 15px;'>";
          htmlToAppend += "<span><strong>" + methodsOffInfo + paymentPlace + "</strong></span>";
          htmlToAppend += "</div>";
          htmlToAppend += "<div class='methods-off-info' style='margin-top: 6px;'>";
          htmlToAppend += "<span>" + methodsOffExpire + dateOfExpiration + "</span>";
          htmlToAppend += "</div>";
        } else if (selectedPaymentInstrument.paymentMethod === "FINTOC") {
            const fintocImage = $(".fintoc-option")[0].currentSrc;
            const fintocText = $(".mp-text-messages").data("mpTextMessages")["field.fintoc.billing.message"];
            htmlToAppend += `
            <img 
                src='${fintocImage}' 
                height='32' 
                alt='FINTOC' 
                title='FINTOC' 
                style='margin-top: 10px' 
            />
            <div>
                <p style='line-height: 21px; margin-top: 10px; font-weight: 600;'>
                    ${fintocText}
                </p>
            </div>
        `;
        }
      }
    );
  }
  $paymentSummary.empty().append(htmlToAppend);
};

base.methods.clearSavedCreditCardForm = () => {
  $('select[name$="_expirationMonth"]').val("");
  $('select[name$="_expirationYear"]').val("");
  $('input[name$="_securityCode"]').val("");
};

base.addNewPaymentInstrument = () => {
  $(".btn.add-payment").on("click", (e) => {
    e.preventDefault();
    $(".payment-information").data("is-new-payment", true);
    base.methods.clearSavedCreditCardForm();
    $(".credit-card-form").removeClass("checkout-hidden");
    $(".user-payment-instruments").addClass("checkout-hidden");
  });
};

/**
 * Validate and update payment instrument form fields
 * @param {Object} order - the order model
 */
base.methods.validateAndUpdateBillingPaymentInstrument = (order) => {
  const { billing } = order;
  if (!billing.payment || !billing.payment.selectedPaymentInstruments
      || billing.payment.selectedPaymentInstruments.length <= 0) return;

  const form = $("form[name=dwfrm_billing]");
  if (!form) return;

  const instrument = billing.payment.selectedPaymentInstruments[0];
  $("select[name$=expirationMonth]", form).val(instrument.expirationMonth);
  $("select[name$=expirationYear]", form).val(instrument.expirationYear);
  // Force security code clear
  $("input[name$=securityCode]", form).val("");
};

module.exports = base;
