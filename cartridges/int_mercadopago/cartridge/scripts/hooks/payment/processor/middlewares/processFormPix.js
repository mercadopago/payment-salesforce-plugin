const Resource = require("dw/web/Resource");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function getViewData(paymentForm, viewFormData) {
  const viewData = viewFormData;
  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };
  viewData.paymentInformation = {
    email: {
      value: paymentForm.pixFields.email.value,
      htmlName: paymentForm.pixFields.email.htmlName
    },
    firstName: {
      value: paymentForm.pixFields.firstName.value,
      htmlName: paymentForm.pixFields.firstName.htmlName
    },
    lastName: {
      value: paymentForm.pixFields.lastName.value,
      htmlName: paymentForm.pixFields.lastName.htmlName
    },
    docType: {
      value: paymentForm.pixFields.docTypePix.value,
      htmlName: paymentForm.pixFields.docTypePix.htmlName
    },
    docNumber: {
      value: paymentForm.pixFields.docNumberPix.value,
      htmlName: paymentForm.pixFields.docNumberPix.htmlName
    },
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value
    }
  };
  return viewData;
}

function getPixErrors(paymentForm) {
  const fieldErrors = {};

  if (paymentForm.pixFields.docNumberPix.value) {
    const docNumber = MercadopagoUtil.validateDocument(
      paymentForm.pixFields.docNumberPix.value,
      paymentForm.pixFields.docTypePix.htmlValue
    );
    if (docNumber) {
      paymentForm.pixFields.docNumberPix.value = docNumber;
    } else {
      fieldErrors[paymentForm.pixFields.docNumberPix.htmlName] = Resource.msg(
        "error.2067",
        "mercadopago",
        null
      );
    }
  }

  return fieldErrors;
}

function processFormPix(req, paymentForm, viewFormData) {
  const pixErrors = getPixErrors(paymentForm);

  if (Object.keys(pixErrors).length) {
    return {
      fieldErrors: pixErrors,
      error: true
    };
  }

  const viewData = getViewData(paymentForm, viewFormData);

  return {
    error: false,
    viewData: viewData
  };
}

module.exports = processFormPix;
