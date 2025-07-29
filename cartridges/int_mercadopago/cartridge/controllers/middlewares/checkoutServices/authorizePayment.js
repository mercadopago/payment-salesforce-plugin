const OrderMgr = require("dw/order/OrderMgr");
const Status = require("dw/system/Status");
const Logger = require("dw/system/Logger");
const BasketMgr = require("dw/order/BasketMgr");
const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const URLUtils = require("dw/web/URLUtils");
const MercadopagoHelpers = require("*/cartridge/scripts/util/MercadopagoHelpers");

const PaymentNotification = require("*/cartridge/controllers/middlewares/notification/paymentNotifications");

const log = Logger.getLogger("int_mercadopago", "mercadopago");

const FINTOC_TARGET = "PAY_FINTOC";

function sendMetrics(paymentInfo, message) {
  const data = MercadopagoHelpers.mountMetricData(paymentInfo);
  try {
    MercadopagoHelpers.sendMetric(
      data.status_detail,
      message,
      data,
      FINTOC_TARGET
    );

    log.info("sendMetrics", data.status, data.status_detail);
  } catch (error) {
    log.error("sendMetrics", error.message);
  }
}

const setError = (viewData, messageKey, resource) => {
  viewData.error = "true";
  viewData.errorMessage = Resource.msg(messageKey, resource, null);
};

function parseQueryParameters(queryString) {
  const paramMap = {};
  const queryParamenters = queryString.split("&");
  queryParamenters.forEach((queryParamenter) => {
    const [key, value] = queryParamenter.split("=");
    paramMap[key] = value;
  });
  return paramMap;
}

function handleRejectedPayment(viewData, statusDetail, res, paymentInfo) {
  switch (statusDetail) {
    case "pending_challenge":
      setError(viewData, "challenge.rejected", "mercadopago");
      viewData.resetCardToken = "true";
      break;
    case "pending_waiting_transfer":
      setError(viewData, "fintoc.rejected", "mercadopago");
      break;
    case "rejected_high_risk":
      sendMetrics(paymentInfo, statusDetail);
      setError(viewData, "fintoc.rejected.highrisk", "mercadopago");
      break;
    default:
      if (
        paymentInfo.payments_details &&
        paymentInfo.payments_details.length > 0 &&
        paymentInfo.payments_details[0].payment_method_id === "fintoc"
      ) {
        sendMetrics(paymentInfo, statusDetail);
      }
      setError(viewData, "generic.rejected", "mercadopago");
      break;
  }
  res.json(viewData);
}

function processOrder(order, viewData, paymentInfo, paramMap, res) {
  Transaction.wrap(() => {
    OrderMgr.undoFailOrder(order);
    const placeOrderStatus = OrderMgr.placeOrder(order);
    if (placeOrderStatus === Status.ERROR) {
      throw new Error();
    }

    const basket = BasketMgr.getCurrentBasket();
    if (basket) {
      const productLineItems = basket.getProductLineItems();
      const itemsToRemove = [];

      const iterator = productLineItems.iterator();
      while (iterator.hasNext()) {
        itemsToRemove.push(iterator.next());
      }

      itemsToRemove.forEach((lineItem) => {
        basket.removeProductLineItem(lineItem);
      });
    }
  });

  viewData.error = "false";
  viewData.continueURL = URLUtils.https("CheckoutServices-ThankYou", "orderID", order.orderNo, "orderToken", order.orderToken).toString();
  res.json(viewData);
}

function authorizePayment(req, res, next) {
  const viewData = res.getViewData();
  const paramMap = parseQueryParameters(viewData.queryString);

  try {
    const order = OrderMgr.getOrder(paramMap.orderID, paramMap.orderToken);
    const paymentInstruments = order.getPaymentInstruments();
    for (let index = 0; index < paymentInstruments.length; index++) {
      const { transactionID } = paymentInstruments[index].paymentTransaction;
      const notificationId = Resource.msg("notification.prefix", "mercadopago", null).concat(transactionID);
      const paymentInfo = PaymentNotification.getPaymentInfoInMercadopago(notificationId);
      const statusDetail = paymentInfo.payments_details[0].status_detail;
      if (paymentInfo && paymentInfo.external_reference === paramMap.orderID) {
        const localeID = viewData.locale;
        PaymentNotification.savePaymentInformation(order, paymentInfo, localeID);
        viewData.transactionID = paramMap.transactionID;
        viewData.status = paymentInfo.status;
        viewData.statusDetail = statusDetail;
        if (paymentInfo.status === "rejected") {
          handleRejectedPayment(viewData, statusDetail, res, paymentInfo);
        } else {
          processOrder(order, viewData, paymentInfo, paramMap, res);
        }
      }
    }
  } catch (error) {
    log.error(error.message);
    viewData.error = "true";
    res.json(viewData);
  }

  return next();
}

module.exports = authorizePayment;
