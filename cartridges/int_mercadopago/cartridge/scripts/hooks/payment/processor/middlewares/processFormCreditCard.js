const Resource = require("dw/web/Resource");
const COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const array = require("*/cartridge/scripts/util/array");

function getPaymentInstrument(req, viewData) {
  const { paymentInstruments } = req.currentCustomer.wallet;
  return array.find(
    paymentInstruments,
    (item) => viewData.storedPaymentUUID === item.UUID
  );
}

function getViewDataAuthenticated(req, viewFormData) {
  const paymentInstrument = getPaymentInstrument(req, viewFormData);

  const viewData = viewFormData;
  viewData.storedPaymentUUID = req.form.storedPaymentUUID;
  viewData.paymentInformation = {
    cardNumber: {
      value: paymentInstrument.creditCardNumber
    },
    cardType: {
      value: paymentInstrument.creditCardType
    },
    securityCode: {
      value: req.form.securityCode
    },
    expirationMonth: {
      value: paymentInstrument.creditCardExpirationMonth
    },
    expirationYear: {
      value: paymentInstrument.creditCardExpirationYear
    },
    creditCardToken: paymentInstrument.raw.creditCardToken
  };
  return viewData;
}

function isAuthenticated(req) {
  return (
    req.form.storedPaymentUUID &&
    req.currentCustomer.raw.authenticated &&
    req.currentCustomer.raw.registered
  );
}

function getViewData(req, paymentForm, viewFormData) {
  const viewData = viewFormData;
  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };
  viewData.paymentInformation = {
    cardType: {
      value: paymentForm.creditCardFields.cardType.value,
      htmlName: paymentForm.creditCardFields.cardType.htmlName
    },
    cardNumber: {
      value: paymentForm.creditCardFields.cardNumber.value,
      htmlName: paymentForm.creditCardFields.cardNumber.htmlName
    },
    securityCode: {
      value: paymentForm.creditCardFields.securityCode.value,
      htmlName: paymentForm.creditCardFields.securityCode.htmlName
    },
    expirationMonth: {
      value: parseInt(
        paymentForm.creditCardFields.expirationMonth.selectedOption,
        10
      ),
      htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
    },
    expirationYear: {
      value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
      htmlName: paymentForm.creditCardFields.expirationYear.htmlName
    },
    token: {
      value: paymentForm.creditCardFields.cardToken.value,
      htmlName: paymentForm.creditCardFields.cardToken.htmlName
    },
    docType: {
      value: paymentForm.creditCardFields.docType.value,
      htmlName: paymentForm.creditCardFields.docType.htmlName
    },
    docNumber: {
      value: paymentForm.creditCardFields.docNumber.value,
      htmlName: paymentForm.creditCardFields.docNumber.htmlName
    },
    email: {
      value: paymentForm.creditCardFields.email.value
    },
    paymentMethodId: {
      value: paymentForm.creditCardFields.paymentMethodId.value,
      htmlName: paymentForm.creditCardFields.paymentMethodId.htmlName
    },
    paymentTypeId: {
      value: paymentForm.creditCardFields.paymentTypeId.value,
      htmlName: paymentForm.creditCardFields.paymentTypeId.htmlName
    },
    cardTypeName: {
      value: paymentForm.creditCardFields.cardTypeName.value,
      htmlName: paymentForm.creditCardFields.cardTypeName.htmlName
    },
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value
    }
  };
  viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

  if (isAuthenticated(req)) {
    getViewDataAuthenticated(req, viewData);
  }

  return viewData;
}

function getCreditCardErrors(req, paymentForm) {
  let fieldErrors = {};

  if (!req.form.storedPaymentUUID) {
    if (!paymentForm.creditCardFields.docType.htmlValue) {
      paymentForm.creditCardFields.docNumber.valid = true;
      paymentForm.creditCardFields.docType.valid = true;
    }

    fieldErrors = COHelpers.validateCreditCard(paymentForm);
  }

  if (paymentForm.creditCardFields.docNumber.value) {
    const docNumber = MercadopagoUtil.validateDocument(
      paymentForm.creditCardFields.docNumber.value,
      paymentForm.creditCardFields.docType.htmlValue
    );
    if (docNumber) {
      paymentForm.creditCardFields.docNumber.value = docNumber;
    } else {
      fieldErrors[paymentForm.creditCardFields.docNumber.htmlName] =
        Resource.msg("error.324", "mercadopago", null);
    }
  }

  return fieldErrors;
}

function processFormCreditCard(req, paymentForm, viewFormData) {
  const creditCardErrors = getCreditCardErrors(req, paymentForm);

  if (Object.keys(creditCardErrors).length) {
    return {
      fieldErrors: creditCardErrors,
      error: true
    };
  }

  const viewData = getViewData(req, paymentForm, viewFormData);

  return {
    error: false,
    viewData: viewData
  };
}

module.exports = processFormCreditCard;
