// set the error message received to be shown when the page is rendered
function postAuthorization(handlePaymentResult) {
  if (handlePaymentResult.error && handlePaymentResult.errorMessage) {
    return handlePaymentResult;
  }

  return null;
}

exports.postAuthorization = postAuthorization;
