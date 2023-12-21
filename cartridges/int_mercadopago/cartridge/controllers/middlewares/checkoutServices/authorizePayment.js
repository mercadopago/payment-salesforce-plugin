const OrderMgr = require("dw/order/OrderMgr");
const Status = require("dw/system/Status");
const Logger = require("dw/system/Logger");
const BasketMgr = require("dw/order/BasketMgr");
const Transaction = require("dw/system/Transaction");
const Resource = require("dw/web/Resource");
const URLUtils = require("dw/web/URLUtils");

const PaymentNotification = require("*/cartridge/controllers/middlewares/notification/paymentNotifications");

const log = Logger.getLogger("int_mercadopago", "mercadopago");

function authorizePayment(req, res, next) {
  const viewData = res.getViewData();
  const queryParamenters = viewData.queryString.split("&");
  const paramMap = {};

  queryParamenters.forEach((queryParamenter) => {
    const [key, value] = queryParamenter.split("=");
    paramMap[key] = value;
  });

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

        if (paymentInfo.status === "rejected" || statusDetail === "pending_challenge") {
          viewData.error = "true";
          viewData.errorMessage = Resource.msg("challenge.rejected", "mercadopago", null);
          viewData.resetCardToken = "true";
          res.json(viewData);
        } else {
          Transaction.wrap(() => {
            OrderMgr.undoFailOrder(order);
            const placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
              throw new Error();
            }
            const basket = BasketMgr.getCurrentBasket();
            const tempOrder = OrderMgr.createOrder(basket);
            OrderMgr.failOrder(tempOrder, false);
          });
          viewData.error = "false";
          viewData.continueURL = URLUtils.https("CheckoutServices-ThankYou", "orderID", order.orderNo, "orderToken", order.orderToken).toString();
          res.json(viewData);
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
