const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const Order = require("dw/order/Order");
const OrderMgr = require("dw/order/OrderMgr");
const Logger = require("*/cartridge/scripts/util/Logger");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

function setPaymentValid(
  paymentInstrument,
  paymentResponse,
  order,
  parseResponseStatus
) {
  paymentInstrument.paymentTransaction.transactionID = paymentResponse.id;
  paymentInstrument.custom.checkoutProLink = paymentResponse.init_point;

  const msgPaymentStatus = Resource.msg("status.pending", "mercadopago", null);
  const msgPaymentReport = Resource.msg(
    "status_detail.pending_contingency",
    "mercadopago",
    null
  );
  order.custom.paymentStatus = "pending [ " + msgPaymentStatus + " ]";
  order.custom.paymentReport = "pending_contingency [ " + msgPaymentReport + " ]";
  order.addNote("Mercadopago payment response", parseResponseStatus);
  order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
}

function savePaymentInformation(paymentInstrument, paymentResponse, order) {
  Transaction.begin();
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
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    error = true;
  }
  Transaction.commit();
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
    Logger.error(JSON.stringify(detailedError));
  } catch (ex) {
    Logger.error(ex);
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
    Logger.error(JSON.stringify(e));
    return errorHandler();
  }

  return {
    error: false
  };
}

module.exports = authorizeCheckoutPro;
