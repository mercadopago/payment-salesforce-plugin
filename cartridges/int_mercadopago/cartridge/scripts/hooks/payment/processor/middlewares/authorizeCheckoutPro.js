const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const Order = require("dw/order/Order");
const OrderMgr = require("dw/order/OrderMgr");
const Logger = require("dw/system/Logger");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

const log = Logger.getLogger("int_mercadopago", "mercadopago");

function setPaymentValid(
  paymentInstrument,
  paymentResponse,
  order,
  parseResponseStatus
) {
  const msgPaymentStatus = Resource.msg("status.pending", "mercadopago", null);
  const msgPaymentReport = Resource.msg(
    "status_detail.pending_contingency",
    "mercadopago",
    null
  );
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.transactionID = paymentResponse.id;
    paymentInstrument.custom.checkoutProLink = paymentResponse.init_point;
    order.custom.paymentStatus = "pending [ " + msgPaymentStatus + " ]";
    order.custom.paymentReport = "pending_contingency [ " + msgPaymentReport + " ]";
    order.addNote("Mercadopago payment response", parseResponseStatus);
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
  });
}

function savePaymentInformation(paymentInstrument, paymentResponse, order) {
  let error = false;

  const parseResponseStatus = "pending";

  const isValidPaymentStatus = paymentResponse.id;

  if (isValidPaymentStatus) {
    setPaymentValid(
      paymentInstrument,
      paymentResponse,
      order,
      parseResponseStatus
    );
  } else {
    Transaction.wrap(() => {
      order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    });
    error = true;
  }
  return {
    error: error
  };
}

function errorHandler(detailedError) {
  return {
    fieldErrors: [],
    serverErrors: [Resource.msg("error.technical", "checkout", null)],
    detailedError: detailedError,
    error: true
  };
}

function errrorMercadopagoResponse() {
  let detailedError;
  try {
    const mpError = JSON.parse(session.privacy.mercadopagoErrorMessage);
    if (mpError && mpError.cause && mpError.cause[0] && mpError.cause[0].code) {
      detailedError = mpError.cause[0].code.toString();
    }
    log.error(JSON.stringify(detailedError));
  } catch (ex) {
    log.error(ex);
  } finally {
    delete session.privacy.mercadopagoErrorMessage;
  }
  return errorHandler(detailedError);
}

function authorizeCheckoutPro(
  orderNumber,
  paymentInstrument,
  paymentProcessor
) {
  try {
    Transaction.wrap(() => {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    const order = OrderMgr.getOrder(orderNumber);
    const paymentData = MercadopagoHelpers.createPreferencePayload(order);
    const paymentResponse = MercadopagoHelpers.preference.create(paymentData);

    if (paymentResponse) {
      const result = savePaymentInformation(
        paymentInstrument,
        paymentResponse,
        order
      );
      if (result.error) {
        return errorHandler();
      }
    } else {
      return errrorMercadopagoResponse();
    }
  } catch (e) {
    log.error("Error on authorizeCheckoutPro: " + e.message);
    return errorHandler();
  }

  return {
    error: false
  };
}

module.exports = authorizeCheckoutPro;
