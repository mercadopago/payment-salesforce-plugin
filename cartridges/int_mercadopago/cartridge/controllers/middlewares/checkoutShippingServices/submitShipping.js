const BasketMgr = require("dw/order/BasketMgr");

function submitShipping(req, res, next) {
  const viewData = res.getViewData();

  const currentBasket = BasketMgr.getCurrentBasket();
  const paymentAmount = currentBasket.totalGrossPrice.value;

  viewData.paymentAmount = paymentAmount;
  res.setViewData(viewData);

  return next();
}

module.exports = submitShipping;
