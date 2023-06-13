const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../mocks/util/importsUtil");

const scriptPath = "*/../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoHelpers.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/PaymentInstrument": importsUtil.PaymentInstrument,
  "dw/system/Site": importsUtil.Site(),
  "dw/system/Logger": importsUtil.Logger,
  "dw/web/URLUtils": importsUtil.URLUtils,
  "dw/svc/LocalServiceRegistry": {},
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/util/collections": importsUtil.collections
};

describe("Scripts utilities MercadopagoHelpers creating payment payload", () => {
  it("should not add expiration date for PIX payments when not configured", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const order = {
      allProductLineItems: [],
      getPaymentInstruments: () => [
        {
          paymentMethod: "PIX",
          custom: {
            payerDocType: ""
          }
        }
      ],
      billingAddress: {},
      defaultShipment: {
        shippingAddress: {}
      }
    };

    const payload = MercadopagoHelpers.createPaymentPayload(order);

    assert(!payload.date_of_expiration);
  });

  const expirationTests = {
    "15m": 900000,
    "30m": 1800000,
    "60m": 3600000,
    "12h": 43200000,
    "24h": 86400000,
    "2d": 172800000,
    "3d": 259200000,
    "4d": 345600000,
    "5d": 432000000,
    "6d": 518400000,
    "7d": 604800000
  };

  Object.entries(expirationTests).forEach((entry) => {
    const [config, milliseconds] = entry;
    it(`should add expiration date for PIX payments: ${config}`, () => {
      const po = {
        ...proxyquireObject,
        "dw/system/Site": importsUtil.Site({
          mercadopagoPixExpirationTime: { value: config }
        })
      };

      const MercadopagoHelpers = proxyquire(scriptPath, po);

      const order = {
        allProductLineItems: [],
        getPaymentInstruments: () => [
          {
            paymentMethod: "PIX",
            custom: {
              payerDocType: ""
            }
          }
        ],
        billingAddress: {},
        defaultShipment: {
          shippingAddress: {}
        }
      };

      const beforeExecutionDate = new Date();
      const payload = MercadopagoHelpers.createPaymentPayload(order);
      const afterExecutionDate = new Date();
      const targetDate = beforeExecutionDate.getTime() + milliseconds;
      const targetDateLimit = afterExecutionDate.getTime() + milliseconds;
      const dateOfExpiration = Date.parse(payload.date_of_expiration);

      assert(dateOfExpiration >= targetDate);
      assert(dateOfExpiration <= targetDateLimit);
    });
  });
});
