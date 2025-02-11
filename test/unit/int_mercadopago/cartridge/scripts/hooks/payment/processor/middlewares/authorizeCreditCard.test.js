const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/authorizeCreditCard.js";

const savePaymentInformation = sinon.stub();
savePaymentInformation.prototype.savePaymentInformation = sinon.stub().returns(null);

const proxyquireObject = {
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation": savePaymentInformation,
  "dw/system/Transaction": importsUtil.Transaction,
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/Order": importsUtil.Order,
  "dw/order/OrderMgr": importsUtil.OrderMgr,
  "dw/system/Logger": importsUtil.Logger
};

global.session = {
  forms: {
    billing: {
      creditCardFields: {
        installments: {
          value: "1"
        },
        issuer: {
          value: "1"
        }
      }
    }
  },
  privacy: {
    currentOrderToken: "123"
  }
};

describe("Hook MERCADOPAGO_PAYMENTS middleware authorizeCreditCard test", () => {
  const authorizeCreditCard = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const paymentInstrument = paymentDataUtil.getPaymentInstrument();
    const orderNumber = "00002672";
    const PAYMENT_PROCESSOR = {
      ID: "MERCADOPAGO_PAYMENTS"
    };

    const result = authorizeCreditCard(
      orderNumber,
      paymentInstrument,
      PAYMENT_PROCESSOR
    );

    assert.equal(result.error, false);
  });
});
