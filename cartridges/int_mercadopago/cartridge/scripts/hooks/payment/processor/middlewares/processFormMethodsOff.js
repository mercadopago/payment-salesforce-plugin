const Resource = require("dw/web/Resource");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const formErrors = require("*/cartridge/scripts/formErrors");

function getViewData(paymentForm, viewFormData) {
  const viewData = viewFormData;
  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };
  viewData.paymentInformation = {
    docType: {
      value: paymentForm.methodsOffFields.docTypeMethodsOff.value,
      htmlName: paymentForm.methodsOffFields.docTypeMethodsOff.htmlName
    },
    docNumber: {
      value: paymentForm.methodsOffFields.docNumberMethodsOff.value,
      htmlName: paymentForm.methodsOffFields.docNumberMethodsOff.htmlName
    },
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value
    },
    paymentMethodId: {
      value: paymentForm.methodsOffFields.paymentMethodsOffChecked.value,
      htmlName: paymentForm.methodsOffFields.paymentMethodsOffChecked.htmlName
    }
  };
  return viewData;
}

function getMethodsOffErrors(paymentForm) {
  let fieldErrors = {};
  fieldErrors = formErrors.getFormErrors(paymentForm.methodsOffFields);
  if (paymentForm.methodsOffFields.paymentMethodsOffChecked.value == null) {
    fieldErrors[paymentForm.methodsOffFields.paymentMethodsOffChecked.htmlName] = Resource.msg(
      "error.methodsoff.options",
      "mercadopago",
      null
    );
  }
  return fieldErrors;
}

function processFormMethodsOff(req, paymentForm, viewFormData) {
  const methodsOffErrors = getMethodsOffErrors(paymentForm);

  if (Object.keys(methodsOffErrors).length) {
    return {
      fieldErrors: methodsOffErrors,
      error: true
    };
  }

  const viewData = getViewData(paymentForm, viewFormData);

  return {
    error: false,
    viewData: viewData
  };
}

module.exports = processFormMethodsOff;
