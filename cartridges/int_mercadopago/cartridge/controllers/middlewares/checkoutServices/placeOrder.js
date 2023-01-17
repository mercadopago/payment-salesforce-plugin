const server = require("server");
const OrderMgr = require("dw/order/OrderMgr");
const MercadopagoUtil = require("*/cartridge/scripts/util/MercadopagoUtil");

function addResetCardToken(res, viewData) {
  const paymentForm = server.forms.getForm("billing");
  if (
    paymentForm.paymentMethod.htmlValue ===
    MercadopagoUtil.PAYMENT_METHOD.credit_card
  ) {
    viewData.resetCardToken = "true";
    res.setViewData(viewData);
  }
}

function addCheckoutProParams(viewData) {
  const paymentForm = server.forms.getForm("billing");
  if (
    paymentForm.paymentMethod.htmlValue ===
    MercadopagoUtil.PAYMENT_METHOD.checkout_pro
  ) {
    const order = OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
    const { paymentInstruments } = order;
    const [paymentInstrument] = paymentInstruments;
    const { transactionID } = paymentInstrument.paymentTransaction;
    viewData.transactionID = transactionID;
    viewData.checkoutProLink = paymentInstrument.custom.checkoutProLink;
  }
}

function placeOrder(req, res, next) {
  const viewData = res.getViewData();

  if (viewData.error) {
    addResetCardToken(res, viewData);
  } else {
    addCheckoutProParams(viewData);
  }

  return next();
}

module.exports = placeOrder;
