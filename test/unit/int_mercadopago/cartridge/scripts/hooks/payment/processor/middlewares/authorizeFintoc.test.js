const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/authorizeFintoc.js";

const proxyquireObject = {
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "dw/system/Transaction": importsUtil.Transaction,
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/Order": importsUtil.Order,
  "dw/order/OrderMgr": importsUtil.OrderMgr,
  "dw/system/Logger": importsUtil.Logger
};

global.session = {
  privacy: {
    currentOrderToken: "123"
  }
};

describe("Hook MERCADOPAGO_PAYMENTS middleware authorizeFintoc test", () => {
  const authorizeFintoc = proxyquire(hookPath, proxyquireObject);

  it("should authorize payment successfully", () => {
    const paymentInstrument = paymentDataUtil.getPaymentInstrument();
    const orderNumber = "00002671";
    const PAYMENT_PROCESSOR = {
      ID: "MERCADOPAGO_PAYMENTS"
    };

    const result = authorizeFintoc(
      orderNumber,
      paymentInstrument,
      PAYMENT_PROCESSOR
    );

    assert.strictEqual(result.error, false);
  });

  it("should handle payment error", () => {
    const paymentInstrument = paymentDataUtil.getPaymentInstrument();
    const orderNumber = "00002671";
    const PAYMENT_PROCESSOR = {
      ID: "MERCADOPAGO_PAYMENTS"
    };

    // Mock paymentResponse as null to simulate error
    const originalCreate = importsUtil.MercadopagoHelpers.payments.create;
    importsUtil.MercadopagoHelpers.payments.create = () => null;

    const result = authorizeFintoc(
      orderNumber,
      paymentInstrument,
      PAYMENT_PROCESSOR
    );

    assert.strictEqual(result.error, true);

    // Restore original
    importsUtil.MercadopagoHelpers.payments.create = originalCreate;
  });

  it("should handle exception", () => {
    const paymentInstrument = paymentDataUtil.getPaymentInstrument();
    const orderNumber = "invalid";
    const PAYMENT_PROCESSOR = {
      ID: "MERCADOPAGO_PAYMENTS"
    };

    // Mock OrderMgr.getOrder to throw error
    const originalGetOrder = importsUtil.OrderMgr.getOrder;
    importsUtil.OrderMgr.getOrder = () => {
      throw new Error("Test Error");
    };

    const result = authorizeFintoc(
      orderNumber,
      paymentInstrument,
      PAYMENT_PROCESSOR
    );

    assert.equal(result.error, true);

    // Restore original
    importsUtil.OrderMgr.getOrder = originalGetOrder;
  });
});
