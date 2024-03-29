const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");
const basketUtil = require("../../../../../../mocks/util/basketUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/handleMercadoCredito.js";

const proxyquireObject = {
  "*/cartridge/scripts/util/collections": importsUtil.collections,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "dw/system/Transaction": importsUtil.Transaction
};

describe("Hook MERCADOPAGO_PAYMENTS middleware handleMercadoCredito test", () => {
  const handleMercadoCredito = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const paymentInformation = paymentDataUtil.getPaymentInfoPix();
    const basket = basketUtil;

    const result = handleMercadoCredito(basket, paymentInformation);

    assert.equal(result.error, false);
  });
});
