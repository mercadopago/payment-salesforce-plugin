const OrderMgr = require("dw/order/OrderMgr");
const Transaction = require("dw/system/Transaction");

function thankYou(req, res, next) {
  const { orderID, orderToken, tryAgain } = req.querystring;

  if (!tryAgain) {
    const order = OrderMgr.getOrder(orderID, orderToken);
    const { paymentInstruments } = order;
    const [paymentInstrument] = paymentInstruments;
    Transaction.wrap(() => {
      paymentInstrument.custom.checkoutProLink = "";
      paymentInstrument.custom.creq = "";
      paymentInstrument.custom.externalResourceUrl = "";
      paymentInstrument.custom.status = "";
      paymentInstrument.custom.statusDetail = "";
      paymentInstrument.custom.mercadoCreditoLink = "";
    });
  }

  res.render("checkout/thankYou.isml", {
    orderID: orderID,
    orderToken: orderToken
  });

  return next();
}

module.exports = thankYou;
