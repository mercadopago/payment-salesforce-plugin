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
    });
  }

  res.render("checkout/thankYou.isml", {
    orderID: orderID,
    orderToken: orderToken
  });

  return next();
}

module.exports = thankYou;
