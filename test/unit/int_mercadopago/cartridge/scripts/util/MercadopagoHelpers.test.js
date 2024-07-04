const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../mocks/util/importsUtil");

const scriptPath = "../../../../../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoHelpers.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/PaymentInstrument": importsUtil.PaymentInstrument,
  "dw/system/Site": importsUtil.Site,
  "dw/system/Logger": importsUtil.Logger,
  "dw/web/URLUtils": importsUtil.URLUtils,
  "dw/svc/LocalServiceRegistry": {},
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/util/collections": importsUtil.collections,
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers
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

describe("Script utilities MercadopagoHelpers test function hasPaymentMethodType", () => {
  it("Should return true if payment method type is in payment method list", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const methodsList = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITH_OFF;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const enabled = MercadopagoHelpers.hasPaymentMethodType(methodsList, enabledMethods);

    assert.strictEqual(enabled, true);
  });
  it("Should return false if payment method type is not in payment method list", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const methodsList = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITHOUT_OFF;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const enabled = MercadopagoHelpers.hasPaymentMethodType(methodsList, enabledMethods);

    assert.strictEqual(enabled, false);
  });
});

describe("Sript utilities MercadopagoHelpers test function getMethodsOffOptions", () => {
  it("should return null if methods off are disabled", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const isMethodsOffEnabled = false;
    const paymentMethods = [];
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const methodsOffOptions = MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      enabledMethods
    );

    assert.strictEqual(methodsOffOptions, null);
  });

  it("should return null if no method off is active", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const isMethodsOffEnabled = false;
    const paymentMethods = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITH_OFF_INACTIVE;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const methodsOffOptions = MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      enabledMethods
    );

    assert.strictEqual(methodsOffOptions, null);
  });

  it("should return payment method list with payment places as a method when methods off enabled and a method contains payment places", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const isMethodsOffEnabled = true;
    const paymentMethods = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITH_OFF;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const methodsOffOptions = MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      enabledMethods
    );

    const paymentPlace = paymentMethods[3].payment_places[0];

    assert.deepEqual(methodsOffOptions[1], paymentPlace);
  });

  it("should return payment method list with only methods", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const isMethodsOffEnabled = true;
    const paymentMethods = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_NO_PLACES;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const methodsOffOptions = MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      enabledMethods
    );

    const expectedMethods = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_NO_PLACES_UNSORTED;

    assert.deepEqual(methodsOffOptions, expectedMethods);
  });

  it("should return payment method list without pix if present in payment methods", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const isMethodsOffEnabled = true;
    const paymentMethods = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITH_PIX;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const methodsOffOptions = MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      enabledMethods
    );

    assert.deepEqual(methodsOffOptions, importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITHOUT_PIX);
  });
});

describe("Script test method to returns Seller MP data", () => {
  it("Should returns data with success", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);
    const siteId = "MLC";
    assert.strictEqual(siteId, MercadopagoHelpers.getSiteId());
  });
});
