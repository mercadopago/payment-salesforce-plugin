const publicKey = $(".js-mp-form").data("mpPreferences").mercadopagoPublicKey;

const savedCardFormFields = require("./mercadopagoSavedCardFormFields");

const mp = new MercadoPago(publicKey);

let savedCardForm;

function createCardForm(totalAmount) {
  savedCardForm = mp.cardForm({
    amount: totalAmount,
    autoMount: false,
    form: {
      id: "form-checkout",
      securityCode: {
        id: savedCardFormFields.getFieldByMpName("savedSecurityCode").fieldId,
        placeholder:
          savedCardFormFields.getFieldByMpName("savedSecurityCode").fieldPlaceHolder
      },
      installments: {
        id: savedCardFormFields.getFieldByMpName("savedInstallments").fieldId,
        placeholder:
          savedCardFormFields.getFieldByMpName("savedInstallments").fieldPlaceHolder
      },
      cardNumber: {
        id: savedCardFormFields.getFieldByMpName("cardNumber").fieldId,
        placeholder:
          savedCardFormFields.getFieldByMpName("cardNumber").fieldPlaceHolder
      },
      expirationMonth: {
        id: savedCardFormFields.getFieldByMpName("expirationMonth").fieldId
      },
      expirationYear: {
        id: savedCardFormFields.getFieldByMpName("expirationYear").fieldId
      },
      cardholderName: {
        id: savedCardFormFields.getFieldByMpName("cardholderName").fieldId,
        placeholder:
        savedCardFormFields.getFieldByMpName("cardholderName").fieldPlaceHolder
      },
      issuer: {
        id: savedCardFormFields.getFieldByMpName("issuer").fieldId,
        placeholder: savedCardFormFields.getFieldByMpName("issuer").fieldPlaceHolder
      }
    },
    callbacks: {
      onFormMounted: (error) => {
        if (error) {
          console.error(error); // eslint-disable-line
        }
      }
    }
  });

  return savedCardForm;
}

function unmountedCardForm() {
  try {
    if (savedCardForm) {
      savedCardForm.unmount();
    }
  } catch (error) {
    console.log(error); // eslint-disable-line
  }
}

function getCardForm() {
  return savedCardForm;
}

function formatInstallmentsMessage(element) {
  let text = element.recommended_message;
  if (element.installment_rate_collector[0] === "THIRD_PARTY") {
    text += " " + savedCardFormFields.getFieldByMpName("savedInstallments").itensText;
  }
  return text;
}

module.exports = {
  createCardForm: createCardForm,
  unmountedCardForm: unmountedCardForm,
  getCardForm: getCardForm,
  formatInstallmentsMessage: formatInstallmentsMessage
};
