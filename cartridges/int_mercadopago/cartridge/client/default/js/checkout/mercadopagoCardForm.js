const publicKey = $(".js-mp-form").data("mpPreferences").mercadopagoPublicKey;

const cardFormFields = require("./mercadopagoCardFormFields");

const mp = new MercadoPago(publicKey);

let cardForm;

function createCardForm(totalAmount) {
  cardForm = mp.cardForm({
    amount: totalAmount,
    autoMount: false,
    form: {
      id: "form-checkout",
      cardholderName: {
        id: cardFormFields.getFieldByMpName("cardholderName").fieldId,
        placeholder:
          cardFormFields.getFieldByMpName("cardholderName").fieldPlaceHolder
      },
      cardholderEmail: {
        id: cardFormFields.getFieldByMpName("cardholderEmail").fieldId,
        placeholder:
          cardFormFields.getFieldByMpName("cardholderEmail").fieldPlaceHolder
      },
      cardNumber: {
        id: cardFormFields.getFieldByMpName("cardNumber").fieldId,
        placeholder:
          cardFormFields.getFieldByMpName("cardNumber").fieldPlaceHolder
      },
      expirationMonth: {
        id: cardFormFields.getFieldByMpName("expirationMonth").fieldId
      },
      expirationYear: {
        id: cardFormFields.getFieldByMpName("expirationYear").fieldId
      },
      securityCode: {
        id: cardFormFields.getFieldByMpName("securityCode").fieldId,
        placeholder:
          cardFormFields.getFieldByMpName("securityCode").fieldPlaceHolder
      },
      installments: {
        id: cardFormFields.getFieldByMpName("installments").fieldId,
        placeholder:
          cardFormFields.getFieldByMpName("installments").fieldPlaceHolder
      },
      identificationType: {
        id: cardFormFields.getFieldByMpName("identificationType").fieldId,
        placeholder:
          cardFormFields.getFieldByMpName("identificationType").fieldPlaceHolder
      },
      identificationNumber: {
        id: cardFormFields.getFieldByMpName("identificationNumber").fieldId,
        placeholder: cardFormFields.getFieldByMpName("identificationNumber")
          .fieldPlaceHolder
      },
      issuer: {
        id: cardFormFields.getFieldByMpName("issuer").fieldId,
        placeholder: cardFormFields.getFieldByMpName("issuer").fieldPlaceHolder
      }
    },
    callbacks: {
      onFormMounted: (error) => {
        if (error) return;
        $("#cardNumber").removeAttr("data-name");
        $("#cardNumber").attr(
          "name",
          "dwfrm_billing_creditCardFields_cardNumber"
        );
        $("#expirationYear").removeAttr("data-name");
        $("#expirationYear").attr(
          "name",
          "dwfrm_billing_creditCardFields_expirationYear"
        );
        $("#expirationMonth").removeAttr("data-name");
        $("#expirationMonth").attr(
          "name",
          "dwfrm_billing_creditCardFields_expirationMonth"
        );
        $("#securityCode").removeAttr("data-name");
        $("#securityCode").attr(
          "name",
          "dwfrm_billing_creditCardFields_securityCode"
        );
        $("#issuer").removeAttr("data-name");
        $("#issuer").attr(
          "name",
          "dwfrm_billing_creditCardFields_issuer"
        );
      },
      onPaymentMethodsReceived: (error, data) => {
        if (error) {
          return;
        }
        $("#paymentMethodId").val(data[0].id);
        $("#paymentTypeId").val(data[0].payment_type_id);
        $("#cardTypeName").val(data[0].name);
      },
      onIdentificationTypesReceived: (error, identificationTypes) => {
        if (!identificationTypes.length) {
          $("#payer-documents").hide();
        }
      }
    }
  });

  return cardForm;
}

function unmountedCardForm() {
  try {
    if (cardForm) {
      cardForm.unmount();
    }
  } catch (error) {
    console.log(error); // eslint-disable-line
  }
}

function getCardForm() {
  return cardForm;
}

module.exports = {
  createCardForm: createCardForm,
  unmountedCardForm: unmountedCardForm,
  getCardForm: getCardForm
};
