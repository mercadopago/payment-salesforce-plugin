const { https } = require("./objects/urlUtils");

function getFormCreditCard() {
  return {
    cardType: {
      value: "visa",
      htmlName: "dwfrm_billing_creditCardFields_cardType"
    },
    cardNumber: {
      value: "4235647728025682",
      htmlName: "dwfrm_billing_creditCardFields_cardNumber"
    },
    securityCode: {
      value: "123",
      htmlName: "dwfrm_billing_creditCardFields_securityCode"
    },
    expirationMonth: {
      selectedOption: "07",
      htmlName: "dwfrm_billing_creditCardFields_expirationMonth"
    },
    expirationYear: {
      value: "2030",
      htmlName: "dwfrm_billing_creditCardFields_expirationYear"
    },
    cardToken: {
      value: "123456789",
      htmlName: "dwfrm_billing_creditCardFields_token"
    },
    docType: {
      selectedOption: "CPF",
      htmlName: "dwfrm_billing_creditCardFields_docType"
    },
    docNumber: {
      value: "12345678909",
      htmlName: "dwfrm_billing_creditCardFields_docNumber"
    },
    email: {
      value: "joao@silva.com",
      htmlName: "dwfrm_billing_creditCardFields_email"
    },
    cardTypeName: {
      value: "Visa",
      htmlName: "dwfrm_billing_creditCardFields_cardTypeName"
    },
    paymentTypeId: {
      value: "credit_card",
      htmlName: "dwfrm_billing_creditCardFields_paymentTypeId"
    },
    paymentMethodId: {
      value: "visa"
    },
    saveCard: {
      checked: false
    }
  };
}

function getFormPix() {
  return {
    email: {
      value: "joao@silva.com",
      htmlName: "dwfrm_billing_pixFields_email"
    },
    firstName: {
      value: "João",
      htmlName: "dwfrm_billing_pixFields_firstName"
    },
    lastName: {
      value: "Silva",
      htmlName: "dwfrm_billing_pixFields_lastName"
    },
    docTypePix: {
      selectedOption: "CPF",
      htmlName: "dwfrm_billing_pixFields_docTypePix"
    },
    docNumberPix: {
      value: "12345678909",
      htmlName: "dwfrm_billing_pixFields_docNumberPix"
    }
  };
}

function getFormMethodsOff() {
  return {
    docTypeMethodsOff: {
      selectedOption: "CPF",
      htmlName: "dwfrm_billing_methodsOffFields_docTypeMethods"
    },
    docNumberMethodsOff: {
      value: "12345678909",
      htmlName: "dwfrm_billing_methodsOffFields_docNumberMethodsOff"
    },
    paymentMethodId: {
      value: "oxxo",
      htmlName: "dwfrm_billing_methodsFields_paymentMethodId"
    },
    paymentMethodsOffChecked: {
      value: "oxxo",
      htmlName: "dwfrm_billing_methodsFields_paymentMethodsOffChecked"
    }
  };
}

function getPaymentInfoPix() {
  return {
    email: {
      value: "joao@silva.com",
      htmlName: "dwfrm_billing_pixFields_email"
    },
    firstName: {
      value: "João",
      htmlName: "dwfrm_billing_pixFields_firstName"
    },
    lastName: {
      value: "Silva",
      htmlName: "dwfrm_billing_pixFields_lastName"
    },
    docType: {
      selectedOption: "CPF",
      htmlName: "dwfrm_billing_pixFields_docTypePix"
    },
    docNumber: {
      value: "12345678909",
      htmlName: "dwfrm_billing_pixFields_docNumberPix"
    }
  };
}

function getPaymentInfoMethodsOff() {
  return {
    docType: {
      selectedOption: "CPF",
      htmlName: "dwfrm_billing_methodsOffFields_docTypeMethodsOff"
    },
    docNumber: {
      value: "12345678909",
      htmlName: "dwfrm_billing_methodsFields_docNumberMethodsOff"
    },
    paymentMethodId : {
      value: "oxxo",
      htmlName: "dwfrm_billing_methodsFields_paymentMethodId"
    }
  };
}

function getPaymentInfoCreditCard() {
  return {
    cardType: {
      value: "visa",
      htmlName: "dwfrm_billing_creditCardFields_cardType"
    },
    cardNumber: {
      value: "4235647728025682",
      htmlName: "dwfrm_billing_creditCardFields_cardNumber"
    },
    securityCode: {
      value: "123",
      htmlName: "dwfrm_billing_creditCardFields_securityCode"
    },
    expirationMonth: {
      selectedOption: 7,
      htmlName: "dwfrm_billing_creditCardFields_expirationMonth"
    },
    expirationYear: {
      value: 2030,
      htmlName: "dwfrm_billing_creditCardFields_expirationYear"
    },
    token: {
      value: "123456789",
      htmlName: "dwfrm_billing_creditCardFields_token"
    },
    docType: {
      selectedOption: "CPF",
      htmlName: "dwfrm_billing_creditCardFields_docType"
    },
    docNumber: {
      value: "12345678909",
      htmlName: "dwfrm_billing_creditCardFields_docNumber"
    },
    email: {
      value: "joao@silva.com",
      htmlName: "dwfrm_billing_creditCardFields_email"
    },
    cardTypeName: {
      value: "Visa",
      htmlName: "dwfrm_billing_creditCardFields_cardTypeName"
    },
    paymentTypeId: {
      value: "credit_card",
      htmlName: "dwfrm_billing_creditCardFields_paymentTypeId"
    },
    paymentMethodId: {
      value: "visa"
    }
  };
}

function getPaymentInstrument() {
  return {
    creditCardType: "",
    paymentTransaction: {
      paymentProcessor: "",
      transactionID: ""
    },
    custom: {
      pixQrCode: "",
      pixQrCodeBase64: "",
      cardType: ""
    }
  };
}

module.exports = {
  getFormCreditCard: getFormCreditCard,
  getFormPix: getFormPix,
  getFormMethodsOff: getFormMethodsOff,
  getPaymentInfoCreditCard: getPaymentInfoCreditCard,
  getPaymentInfoPix: getPaymentInfoPix,
  getPaymentInfoMethodsOff: getPaymentInfoMethodsOff,
  getPaymentInstrument: getPaymentInstrument
};
