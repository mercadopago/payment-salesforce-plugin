const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/authorizeMercadoCredito.js";

const proxyquireObject = {
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "dw/system/Transaction": importsUtil.Transaction,
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/Order": importsUtil.Order,
  "dw/order/OrderMgr": importsUtil.OrderMgr,
  "dw/system/Logger": importsUtil.Logger
};

describe("Hook MERCADOPAGO_PAYMENTS middleware authorizeMercadoCredito test", () => {
  const authorizeMercadoCredito = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const paymentInstrument = paymentDataUtil.getPaymentInstrument();
    const orderNumber = "00002671";
    const PAYMENT_PROCESSOR = {
      ID: "MERCADOPAGO_PAYMENTS"
    };

    const result = authorizeMercadoCredito(
      orderNumber,
      paymentInstrument,
      PAYMENT_PROCESSOR
    );

    assert.equal(result.error, false);
  });
});
