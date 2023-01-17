function getViewData(paymentForm, viewFormData) {
  const viewData = viewFormData;
  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };
  viewData.paymentInformation = {
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value
    }
  };
  return viewData;
}

function processFormCheckoutPro(req, paymentForm, viewFormData) {
  const viewData = getViewData(paymentForm, viewFormData);

  return {
    error: false,
    viewData: viewData
  };
}

module.exports = processFormCheckoutPro;
