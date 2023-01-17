const base = module.superModule;

const HookMgr = require("dw/system/HookMgr");
const OrderMgr = require("dw/order/OrderMgr");
const PaymentMgr = require("dw/order/PaymentMgr");
const Transaction = require("dw/system/Transaction");
const PaymentInstrument = require("dw/order/PaymentInstrument");

function callHookProcessor(orderNumber, paymentInstrument, paymentProcessor) {
  const paymentProcessorHook = paymentProcessor.ID.toLowerCase();
  if (HookMgr.hasHook("app.payment.processor." + paymentProcessorHook)) {
    return HookMgr.callHook(
      "app.payment.processor." + paymentProcessorHook,
      "Authorize",
      orderNumber,
      paymentInstrument,
      paymentProcessor
    );
  }
  return HookMgr.callHook("app.payment.processor.default", "Authorize");
}

function verifyAuthorizationError(authorizationResult, order) {
  if (authorizationResult.error) {
    if (authorizationResult.detailedError) {
      session.privacy.detailedError = authorizationResult.detailedError;
    }
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    return true;
  }
  return false;
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
  const result = {};

  if (order.totalNetPrice !== 0.0) {
    const { paymentInstruments } = order;

    if (paymentInstruments.length === 0) {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      result.error = true;
    }

    session.privacy.currentOrderToken = order.getOrderToken();

    for (let i = 0; i < paymentInstruments.length; i++) {
      const paymentInstrument = paymentInstruments[i];
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod
      );
      let authorizationResult;
      if (paymentProcessor === null) {
        Transaction.begin();
        paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
        Transaction.commit();
      } else {
        authorizationResult = callHookProcessor(
          orderNumber,
          paymentInstrument,
          paymentProcessor
        );

        // Clean up previous session
        delete session.privacy.detailedError;
        delete session.privacy.orderNumber;

        if (verifyAuthorizationError(authorizationResult, order)) {
          result.error = true;
          [result.errorMessage] = authorizationResult.serverErrors;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
  const paymentAmount = currentBasket.totalGrossPrice.value;
  const { countryCode } = req.geolocation;
  const currentCustomer = req.currentCustomer.raw;
  const { paymentInstruments } = currentBasket;

  const applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount
  );

  let invalid = true;

  for (let i = 0; i < paymentInstruments.length; i++) {
    const paymentInstrument = paymentInstruments[i];

    if (
      PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(
        paymentInstrument.paymentMethod
      )
    ) {
      invalid = false;
    }

    const paymentMethod = PaymentMgr.getPaymentMethod(
      paymentInstrument.getPaymentMethod()
    );

    if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
      invalid = false;
    }

    if (invalid) {
      break; // there is an invalid payment instrument
    }
  }

  return { error: invalid };
}

/**
 * Sets the payment transaction amount
 * @returns {Object} an error object
 */
function calculatePaymentTransaction() {
  // overring logic because it doesn't support gift-certificates
  return {
    error: false
  };
}

module.exports = {
  handlePayments: handlePayments,
  validatePayment: validatePayment,
  calculatePaymentTransaction: calculatePaymentTransaction
};

Object.keys(base).forEach((prop) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!module.exports.hasOwnProperty(prop)) {
    module.exports[prop] = base[prop];
  }
});
