const base = module.superModule;

const HookMgr = require("dw/system/HookMgr");
const OrderMgr = require("dw/order/OrderMgr");
const Order = require("dw/order/Order");
const Status = require("dw/system/Status");
const PaymentMgr = require("dw/order/PaymentMgr");
const Transaction = require("dw/system/Transaction");
const PaymentInstrument = require("dw/order/PaymentInstrument");
const Logger = require("dw/system/Logger");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

const log = Logger.getLogger("int_mercadopago", "mercadopago");

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
        Transaction.wrap(() => {
          paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
        });
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
 * saves payment instruemnt to customers wallet
 * @param {Object} billingData - billing information entered by the user
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {dw.customer.Customer} customer - The current customer
 * @returns {dw.customer.CustomerPaymentInstrument} newly stored payment Instrument
 */
function savePaymentInstrumentToWallet(billingData, currentBasket, customer) {
  const wallet = customer.getProfile().getWallet();

  const payload = MercadopagoHelpers.saveCardPayload(
    billingData.paymentInformation.creditCardToken.value, customer.profile.email);

  try {
    log.info("Requesting Core API to Save Card data");
    const saveCardresponse = MercadopagoHelpers.customerCard.create(payload);
    log.info("MercadoPago response status_detail: " + saveCardresponse.status_detail);

    return Transaction.wrap(() => {
      const storedPaymentInstrument = wallet.createPaymentInstrument(
        PaymentInstrument.METHOD_CREDIT_CARD
      );

      storedPaymentInstrument.setCreditCardHolder(
        currentBasket.billingAddress.fullName
      );
      storedPaymentInstrument.setCreditCardNumber(
        billingData.paymentInformation.cardNumber.value
      );
      storedPaymentInstrument.setCreditCardType(
        billingData.paymentInformation.cardType.value
      );
      storedPaymentInstrument.setCreditCardExpirationMonth(
        billingData.paymentInformation.expirationMonth.value
      );
      storedPaymentInstrument.setCreditCardExpirationYear(
        billingData.paymentInformation.expirationYear.value
      );

      if (saveCardresponse && saveCardresponse.id) {
        storedPaymentInstrument.custom.customerIdMercadoPago = saveCardresponse.customer_id;
        storedPaymentInstrument.custom.cardBin = saveCardresponse.first_six_digits;
        storedPaymentInstrument.custom.creditCardName = saveCardresponse.issuer.name;
        storedPaymentInstrument.setCreditCardToken(saveCardresponse.id);
      }
      return storedPaymentInstrument;
    });
  } catch (error) {
    log.error("Error saving card: " + error.message);
  }

  return {
    error: false
  };
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {Object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
  const result = { error: false };

  try {
    Transaction.wrap(() => {
      const { paymentInstruments } = order;
      const [paymentInstrument] = paymentInstruments;

      if (paymentInstrument.custom.statusDetail === "pending_challenge") {
        OrderMgr.failOrder(order, true);
      } else {
        const placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
          throw new Error();
        }
      }

      if (fraudDetectionStatus.status === "flag") {
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
      } else {
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
      }

      order.setExportStatus(Order.EXPORT_STATUS_READY);
    });
  } catch (e) {
    Transaction.wrap(() => { OrderMgr.failOrder(order, true); });
    result.error = true;
  }

  return result;
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
  calculatePaymentTransaction: calculatePaymentTransaction,
  savePaymentInstrumentToWallet: savePaymentInstrumentToWallet,
  placeOrder: placeOrder
};

Object.keys(base).forEach((prop) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!module.exports.hasOwnProperty(prop)) {
    module.exports[prop] = base[prop];
  }
});
