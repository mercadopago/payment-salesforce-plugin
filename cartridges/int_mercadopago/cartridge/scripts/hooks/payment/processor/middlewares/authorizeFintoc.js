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
    if (paymentResponse.status_detail === "pending_waiting_transfer" && paymentResponse.payment_method.data) {
      paymentInstrument.custom.status = paymentResponse.status;
      paymentInstrument.custom.statusDetail = paymentResponse.status_detail;
      paymentInstrument.custom.fintocExternalReferenceId =
        paymentResponse.payment_method.data.external_reference_id;
      paymentInstrument.custom.fintocExternalUrl =
        paymentResponse.payment_method.data.external_resource_url || "";
    }
    paymentInstrument.paymentTransaction.transactionID = paymentResponse.id;
    order.custom.paymentStatus = paymentResponse.status + " [ " + msgPaymentStatus + " ]";
    order.custom.paymentReport = paymentResponse.status_detail + " [ " + msgPaymentReport + " ]";
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

function errorMercadopagoResponse() {
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

function authorizeFintoc(orderNumber, paymentInstrument, paymentProcessor) {
  try {
    Transaction.wrap(() => {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    const orderToken = session.privacy.currentOrderToken;
    const order = OrderMgr.getOrder(orderNumber, orderToken);
    const paymentData = MercadopagoHelpers.createPaymentPayload(order);

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
        return errorHandler();
      }
    } else {
      return errorMercadopagoResponse();
    }
  } catch (e) {
    log.error("Error on authorizeFintoc: " + e.message);
    return errorHandler();
  }

  return {
    error: false
  };
}

module.exports = authorizeFintoc;
