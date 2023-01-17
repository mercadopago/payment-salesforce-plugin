const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/authorizeCheckoutPro.js";

const proxyquireObject = {
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "dw/system/Transaction": importsUtil.Transaction,
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/Order": importsUtil.Order,
  "dw/order/OrderMgr": importsUtil.OrderMgr,
  "*/cartridge/scripts/util/Logger": importsUtil.Logger
};

describe("Hook MERCADOPAGO_PAYMENTS middleware authorizeCheckoutPro test", () => {
  const authorizeCheckoutPro = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const paymentInstrument = paymentDataUtil.getPaymentInstrument();
    const orderNumber = "00002671";
    const PAYMENT_PROCESSOR = {
      ID: "MERCADOPAGO_PAYMENTS"
    };

    const result = authorizeCheckoutPro(
      orderNumber,
      paymentInstrument,
      PAYMENT_PROCESSOR
    );

    assert.equal(result.error, false);
  });
});
