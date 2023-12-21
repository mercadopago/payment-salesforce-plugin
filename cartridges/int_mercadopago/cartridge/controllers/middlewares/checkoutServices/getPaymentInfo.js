const Resource = require("dw/web/Resource");
const PaymentNotification = require("*/cartridge/controllers/middlewares/notification/paymentNotifications");

function getPaymentInfo(req, res, next) {
  const viewData = res.getViewData();
  let poolingStatus = {};
  if (viewData.queryString) {
    const transactionID = viewData.queryString.split("=")[1];
    const notificationId = Resource.msg("notification.prefix", "mercadopago", null).concat(transactionID);

    poolingStatus = PaymentNotification.getPaymentInfoInMercadopago(notificationId);
    viewData.poolingStatus = poolingStatus.status;
    viewData.error = "false";
  } else {
    viewData.error = "true";
  }

  res.json(viewData);

  return next();
}

module.exports = getPaymentInfo;
