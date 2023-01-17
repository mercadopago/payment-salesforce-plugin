const Transaction = require("dw/system/Transaction");
const OrderMgr = require("dw/order/OrderMgr");
const Order = require("dw/order/Order");
const Resource = require("dw/web/Resource");
const Logger = require("*/cartridge/scripts/util/Logger");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");
const COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");

function getNotificationData() {
  const notificationData = JSON.parse(
    request.httpParameterMap.requestBodyAsString
  );
  Logger.info(
    Resource.msgf(
      "notification.received",
      "mercadopago",
      null,
      JSON.stringify(notificationData)
    )
  );
  return notificationData;
}

function getPaymentInfoInMercadopago(notificationId) {
  const paymentInfo = MercadopagoHelpers.payments.retrieve(notificationId);
  paymentInfo.payer = {};
  paymentInfo.additional_info = {};
  if (
    paymentInfo.payment_method_id ===
    MercadopagoUtil.PAYMENT_METHOD.pix.toLowerCase()
  ) {
    paymentInfo.point_of_interaction.transaction_data.qr_code = "";
    paymentInfo.point_of_interaction.transaction_data.qr_code_base64 = "";
  }
  return paymentInfo;
}

function validateAmountPaid(order, paymentInfo) {
  let totalOrder = 0;
  const paymentInstruments = order.getPaymentInstruments();
  for (let i = 0; i < paymentInstruments.length; i++) {
    const paymentInstrument = paymentInstruments[i];
    const paymentAmount = paymentInstrument.getPaymentTransaction().getAmount();
    totalOrder =
      Math.round((parseFloat(paymentAmount) + parseFloat(totalOrder)) * 100) /
      100;
  }
  const paidAmountMsg = Resource.msgf(
    "notification.paidAmount",
    "mercadopago",
    null,
    paymentInfo.transaction_amount,
    totalOrder
  );

  Logger.info(paidAmountMsg);

  const amountPaidValid = totalOrder === paymentInfo.transaction_amount;

  if (!amountPaidValid) {
    order.addNote(paidAmountMsg);
  }

  return amountPaidValid;
}

/**
 * Update payment information on the Salesforce platform
 * @param {dw.order.Order} order - Order for which to create charge for
 * @param {*} paymentInfo  - Object containing the payment information sent by MercadoPago
 */
function updatePaymentInfo(order, paymentInfo) {
  order.addNote("Mercadopago Notification status: ", paymentInfo.status);

  Transaction.wrap(() => {
    const msgPaymentStatus = Resource.msg(
      "status." + paymentInfo.status,
      "mercadopago",
      null
    );
    order.custom.paymentStatus =
      paymentInfo.status + " [ " + msgPaymentStatus + " ]";

    const lastDetail = paymentInfo.payments_details.pop();
    const msgPaymentReport = Resource.msg(
      "status_detail." + lastDetail.status_detail,
      "mercadopago",
      null
    );
    order.custom.paymentReport =
      lastDetail.status_detail + " [ " + msgPaymentReport + " ]";
  });
}

/**
 * Performs the treatment of orders declined
 * @param {dw.order.Order} order - Order for which to create charge for
 */
function declineOrder(order) {
  order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);

  try {
    if (order.status.value === Order.ORDER_STATUS_CREATED) {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
    } else if (
      order.status.value === Order.ORDER_STATUS_NEW ||
      order.status.value === Order.ORDER_STATUS_OPEN
    ) {
      Transaction.wrap(() => {
        OrderMgr.cancelOrder(order);
      });
    }
  } catch (e) {
    Logger.error(
      Resource.msgf("notification.errorMensage", "mercadopago", null, e.message)
    );
  }
}

/**
 * Performs the treatment of orders refunded
 * @param {dw.order.Order} order - Order for which to create charge for
 */
function refundOrder(order) {
  order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);

  try {
    if (order.status.value === Order.ORDER_STATUS_CREATED) {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
    } else if (
      order.status.value === Order.ORDER_STATUS_NEW ||
      order.status.value === Order.ORDER_STATUS_OPEN
    ) {
      Transaction.wrap(() => {
        OrderMgr.cancelOrder(order);
      });
    }
  } catch (e) {
    Logger.error(
      Resource.msgf("notification.errorMensage", "mercadopago", null, e.message)
    );
  }
}

/**
 * Performs the treatment of orders authorized
 * @param {dw.order.Order} order - Order for which to create charge for
 */
function authorizeOrder(order, localeID) {
  order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);

  if (order.status.value !== Order.ORDER_STATUS_CREATED) {
    return;
  }

  try {
    const placeOrderResult = COHelpers.placeOrder(order, {
      status: true
    });

    if (placeOrderResult.error) {
      Logger.error(
        Resource.msgf(
          "notification.errorMensage",
          "mercadopago",
          null,
          placeOrderResult
        )
      );
    } else {
      COHelpers.sendConfirmationEmail(order, localeID);
    }
  } catch (e) {
    Logger.error(
      Resource.msgf("notification.errorMensage", "mercadopago", null, e.message)
    );
  }
}

function changeStatusOrder(order, paymentInfo, localeID) {
  const orderStatus = MercadopagoUtil.parseOrderStatus(paymentInfo.status);
  if (orderStatus === "authorized") {
    const paymentValid = validateAmountPaid(order, paymentInfo);
    if (paymentValid) {
      authorizeOrder(order, localeID);
    } else {
      declineOrder(order);
    }
  } else if (orderStatus === "declined") {
    declineOrder(order);
  } else if (orderStatus === "refunded") {
    refundOrder(order);
  }
}

function savePaymentInformation(order, paymentInfo, localeID) {
  Transaction.begin();

  order.addNote("Mercadopago notification: ", JSON.stringify(paymentInfo));

  const paymentStatusSequence = {
    pending: ["authorized", "declined", "refunded"],
    authorized: ["declined", "refunded"],
    approved: ["declined", "refunded"]
  };

  const currentPaymentStatus = order.custom.paymentStatus;
  const newPaymentStatus = MercadopagoUtil.parseOrderStatus(paymentInfo.status);

  let willUpdateStatus = false;

  if (!currentPaymentStatus) {
    willUpdateStatus = true;
  } else {
    const statusList = Object.keys(paymentStatusSequence);
    let status = "";
    for (let i = 0; i < statusList.length; i++) {
      status = statusList[i];
      if (currentPaymentStatus.indexOf(status) === 0) {
        willUpdateStatus =
          paymentStatusSequence[status].includes(newPaymentStatus);
        break;
      }
    }
  }

  if (willUpdateStatus) {
    updatePaymentInfo(order, paymentInfo);
    changeStatusOrder(order, paymentInfo, localeID);
  }

  Transaction.commit();
}

/**
 * Entry point for processing webhooks payment notifications.
 * The Mercadopago platform sends right after receiving a payment,
 * some webhooks containing status updates of this payment.
 * This controller will update this payment of the Salesforce platform.
 */
function paymentNotifications(req, res, next) {
  try {
    const notification = getNotificationData();
    const notificationId = notification && notification.notification_id;

    if (typeof notificationId !== "string") {
      Logger.info("NotificationId invalid!");
      return;
    }

    const paymentInfo = getPaymentInfoInMercadopago(notificationId);

    if (paymentInfo) {
      const order = OrderMgr.getOrder(paymentInfo.external_reference);

      if (order) {
        const localeID = req.locale.id;
        savePaymentInformation(order, paymentInfo, localeID);
      } else {
        Logger.info("Order not found!");
      }
    } else {
      Logger.info("Payment not found!");
    }
  } catch (error) {
    Logger.error(
      Resource.msgf(
        "notification.errorMensage",
        "mercadopago",
        null,
        error.message
      )
    );
    response.setStatus(500);
  }

  res.render("checkout/notifications.isml");

  next();
}

module.exports = paymentNotifications;
