const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const Order = require("dw/order/Order");
const OrderMgr = require("dw/order/OrderMgr");
const Logger = require("dw/system/Logger");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

const log = Logger.getLogger("int_mercadopago", "mercadopago");

function setPaymentValid(
  paymentInstrument,
  paymentResponse,
  order,
  parseResponseStatus
) {
  const msgPaymentStatus = Resource.msg(
    "status." + paymentResponse.status,
    "mercadopago",
    null
  );
  const msgPaymentReport = Resource.msg(
    "status_detail." + paymentResponse.status_detail,
    "mercadopago",
    null
  );
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.transactionID = paymentResponse.id;
    order.custom.paymentStatus =
      paymentResponse.status + " [ " + msgPaymentStatus + " ]";
    order.custom.paymentReport =
      paymentResponse.status_detail + " [ " + msgPaymentReport + " ]";
    order.addNote(
      "Mercadopago payment response",
      parseResponseStatus + " [ " + paymentResponse.status_detail + " ]"
    );
    if (parseResponseStatus === "authorized") {
      order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    } else {
      order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    }
  });
}

function savePaymentInformation(paymentInstrument, paymentResponse, order) {
  log.info("Starting order update " + order.orderNo + " after MercadoPago response");
  let error = false;
  const parseResponseStatus = MercadopagoUtil.parseOrderStatus(
    paymentResponse.status
  );
  const isValidPaymentStatus =
    parseResponseStatus === "authorized" || parseResponseStatus === "pending";

  if (isValidPaymentStatus) {
    setPaymentValid(
      paymentInstrument,
      paymentResponse,
      order,
      parseResponseStatus
    );
    log.info("Order " + order.orderNo + " updated successfully");
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

function authorizationErrorHandler(statusDetail) {
  return {
    fieldErrors: [],
    serverErrors: [Resource.msg(
      "status_detail." + statusDetail,
      "mercadopago",
      null
    )],
    message: Resource.msg(
      "status_detail." + statusDetail,
      "mercadopago",
      null
    ),
    detailedError: statusDetail,
    error: true
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

function getOrder(orderNumber) {
  const orderToken = session.privacy.currentOrderToken;
  return OrderMgr.getOrder(orderNumber, orderToken);
}

function authorizeCreditCard(orderNumber, paymentInstrument, paymentProcessor) {
  const order = getOrder(orderNumber);
  try {
    Transaction.wrap(() => {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    const form = session.forms.billing;
    const installments = parseInt(form.creditCardFields.installments.value, 10);
    const issuer = parseInt(form.creditCardFields.issuer.value, 10);
    const paymentData = MercadopagoHelpers.createPaymentPayload(
      order,
      installments,
      issuer
    );
    log.info("Requesting MercadoPago's Api to creates new payment. Order number: " + orderNumber);
    const paymentResponse = MercadopagoHelpers.payments.create(paymentData);
    log.info("MercadoPago response status_detail is [" +
      paymentResponse.status_detail +
      "] for transaction [" + paymentResponse.id + "] and order number [" +
      orderNumber + "]");

    if (paymentResponse) {
      const result = savePaymentInformation(
        paymentInstrument,
        paymentResponse,
        order
      );
      if (result.error) {
        return authorizationErrorHandler(paymentResponse.status_detail);
      }
    } else {
      return errrorMercadopagoResponse();
    }
  } catch (e) {
    log.error("Error on authorizeCreditCard: " + e.message);
    Transaction.wrap(() => {
      order.addNote("Error on authorizeCreditCard", e.message);
    });
    return errorHandler();
  }

  return {
    error: false
  };
}

module.exports = authorizeCreditCard;
