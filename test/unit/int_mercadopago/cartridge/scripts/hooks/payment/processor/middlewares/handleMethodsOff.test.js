const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");
const basketUtil = require("../../../../../../mocks/util/basketUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/handleMethodsOff.js";

const proxyquireObject = {
  "*/cartridge/scripts/util/collections": importsUtil.collections,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "dw/system/Transaction": importsUtil.Transaction,
  "dw/system/Site": importsUtil.Site,
  "dw/web/Resource": importsUtil.Resource,
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
};

describe("Hook MERCADOPAGO_PAYMENTS middleware handleMethodsOff test", () => {
  const handleMethodsOff = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const paymentInformation = paymentDataUtil.getPaymentInfoMethodsOff();
    const basket = basketUtil;

    const result = handleMethodsOff(basket, paymentInformation);

    assert.equal(result.error, false);
  });
});
