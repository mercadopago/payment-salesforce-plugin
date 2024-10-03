const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const Order = require("dw/order/Order");
const OrderMgr = require("dw/order/OrderMgr");
const Logger = require("dw/system/Logger");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");
const savePaymentInformationToWallet = require("*/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation");

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
    if (
      paymentResponse.status_detail ===
      "pending_challenge" && paymentResponse.three_ds_info
    ) {
      paymentInstrument.custom.status = paymentResponse.status;
      paymentInstrument.custom.statusDetail = paymentResponse.status_detail;
      paymentInstrument.custom.externalResourceUrl =
      paymentResponse.three_ds_info.external_resource_url;
      paymentInstrument.custom.creq = paymentResponse.three_ds_info.creq;
    }
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

function verifyLoggedUserAndSaveCard(order) {
  return (order.customer.authenticated &&
    order.customer.registered &&
    order.paymentInstrument.custom.saveCardToWallet);
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

    if (verifyLoggedUserAndSaveCard(order)) {
      const saveResult = savePaymentInformationToWallet(order);

      if (saveResult) {
        log.error("Error saving card: " + saveResult);
        MercadopagoHelpers.sendMetric("fail to save card", saveResult, paymentResponse, "PAY_CCD_CARD_ID");
      } else {
        MercadopagoHelpers.sendMetric("success to save card", "Card saved successfully", paymentResponse, "PAY_CCD_CARD_ID");
      }
    }

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
  const msgErrorDefault = Resource.msg("seller_status_detail.cc_rejected_default", "mercadopago", null);

  return {
    fieldErrors: [],
    serverErrors: [Resource.msg(
      "status_detail." + statusDetail,
      "mercadopago",
      msgErrorDefault
    )],
    message: Resource.msg(
      "status_detail." + statusDetail,
      "mercadopago",
      msgErrorDefault
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

function getOrder(orderNumber) {
  const orderToken = session.privacy.currentOrderToken;
  return OrderMgr.getOrder(orderNumber, orderToken);
}

function getSavedCreditCardPayment(form) {
  return (
    form.savedCreditFields &&
    form.savedCreditFields.savedSecurityCode.valid &&
    form.savedCreditFields.savedSecurityCode.value &&
    form.savedCreditFields.savedSecurityCode.value !== "undefined" &&
    form.savedCreditFields.savedInstallments.valid &&
    form.savedCreditFields.savedInstallments.value !== null
  );
}

function callSendMetrics(paymentResponse, paymentType, message) {
  MercadopagoHelpers.sendMetric(
    paymentResponse.status, message, paymentResponse, paymentType);
}

// eslint-disable-next-line complexity
function authorizeCreditCard(orderNumber, paymentInstrument, paymentProcessor) {
  const order = getOrder(orderNumber);
  let paymentResponse;
  let paymentData;
  const form = session.forms.billing;
  const isSavedCreditCardPayment = getSavedCreditCardPayment(form);

  try {
    Transaction.wrap(() => {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    let installments;
    let issuer;
    let paymentType;
    let metricMessage;

    if (isSavedCreditCardPayment) {
      paymentType = "PAY_CCD_CARD_ID";
      metricMessage = "Successful payment with saved Card";
      installments = parseInt(form.savedCreditFields.savedInstallments.value, 10);
      issuer = "";
    } else {
      paymentType = "PAY_CCD_CARD";
      metricMessage = "Successful payment with new Card";
      installments = parseInt(form.creditCardFields.installments.value, 10);
      issuer = parseInt(form.creditCardFields.issuer.value, 10);
    }

    paymentData = MercadopagoHelpers.createPaymentPayload(
      order,
      installments,
      issuer
    );

    if (isSavedCreditCardPayment) {
      paymentData = MercadopagoHelpers.addInfoPayerToSavedCreditCard(order, paymentData);
    }

    log.info("Requesting MercadoPago's Api to creates new payment. Order number: " + orderNumber);
    paymentResponse = MercadopagoHelpers.payments.create(paymentData);
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
        callSendMetrics(paymentResponse, paymentType, paymentResponse.status_detail);
        return authorizationErrorHandler(paymentResponse.status_detail);
      }

      callSendMetrics(paymentResponse, paymentType, metricMessage);
    } else {
      return errorMercadopagoResponse();
    }
  } catch (e) {
    log.error("Error on authorizeCreditCard: " + e.message);
    MercadopagoHelpers.sendMetric("fail payment", e.message, paymentData, isSavedCreditCardPayment ? "PAY_CCD_CARD_ID" : "PAY_CCD_CARD");

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
