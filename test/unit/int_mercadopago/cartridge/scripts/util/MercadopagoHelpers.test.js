const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../mocks/util/importsUtil");

const scriptPath = "../../../../../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoHelpers.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "dw/order/PaymentInstrument": importsUtil.PaymentInstrument,
  "dw/system/Site": importsUtil.Site,
  "dw/system/System": importsUtil.System,
  "dw/system/Logger": importsUtil.Logger,
  "dw/web/URLUtils": importsUtil.URLUtils,
  "dw/svc/LocalServiceRegistry": importsUtil.LocalServiceRegistry,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/util/collections": importsUtil.collections,
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
  "dw/order/TaxMgr": { getTaxationPolicy: () => "GROSS", TAX_POLICY_GROSS: "GROSS" }
};

describe("Scripts utilities MercadopagoHelpers creating payment payload - item pricing", () => {
  const po = {
    ...proxyquireObject,
    "*/cartridge/scripts/util/MercadopagoUtil": {
      ...importsUtil.MercadopagoUtil,
      validateAndReturnAttribute: (object, prop) => (object ? object[prop] : null)
    }
  };

  const buildOrder = (productLineItems = []) => ({
    allProductLineItems: productLineItems,
    getPaymentInstruments: () => [{ paymentMethod: "PIX", custom: { payerDocType: "" } }],
    billingAddress: { countryCode: { displayValue: "BR" } },
    customer: { profile: {}, registered: false },
    defaultShipment: { shippingAddress: {} }
  });

  const buildProduct = (basePrice, quantityValue, id = "P001") => ({
    productID: id,
    productName: "Test Product",
    product: { name: "Test Product", longDescription: null, primaryCategory: null },
    basePrice: { value: basePrice },
    quantityValue
  });

  it("should use basePrice.value as unit_price (no division)", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, po);
    const order = buildOrder([buildProduct(49.99, 1)]);
    const payload = MercadopagoHelpers.createPaymentPayload(order);

    assert.strictEqual(payload.additional_info.items[0].unit_price, 49.99);
    assert.strictEqual(payload.additional_info.items[0].quantity, 1);
  });

  it("should use basePrice.value per unit without dividing by quantity", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, po);
    const order = buildOrder([buildProduct(10, 3)]);
    const payload = MercadopagoHelpers.createPaymentPayload(order);

    assert.strictEqual(payload.additional_info.items[0].unit_price, 10);
    assert.strictEqual(payload.additional_info.items[0].quantity, 3);
  });

  it("should use basePrice.value for dízima-resistant prices (3.33 × 3)", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, po);
    const order = buildOrder([buildProduct(3.33, 3)]);
    const payload = MercadopagoHelpers.createPaymentPayload(order);

    assert.strictEqual(payload.additional_info.items[0].unit_price, 3.33);
    assert.strictEqual(payload.additional_info.items[0].quantity, 3);
  });

  it("should map all products to additional_info.items with correct unit_price", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, po);
    const order = buildOrder([buildProduct(30, 2, "A"), buildProduct(40, 1, "B")]);
    const payload = MercadopagoHelpers.createPaymentPayload(order);

    assert.strictEqual(payload.additional_info.items.length, 2);
    assert.strictEqual(payload.additional_info.items[0].unit_price, 30);
    assert.strictEqual(payload.additional_info.items[1].unit_price, 40);
  });
});

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
      billingAddress: {
        countryCode: {
          displayValue: "BR"
        }
      },
      customer: {
        profile: {},
        registered: false
      },
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
        billingAddress: {
          countryCode: {
            displayValue: "BR"
          }
        },
        customer: {
          profile: {},
          registered: false
        },
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

  it("should return payment method list without fintoc if present in payment methods", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const isMethodsOffEnabled = true;
    const paymentMethods = importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITH_FINTOC;
    const enabledMethods = importsUtil.MercadopagoHelpers.ENABLED_METHODS_OFF;

    const methodsOffOptions = MercadopagoHelpers.getMethodsOffOptions(
      isMethodsOffEnabled,
      paymentMethods,
      enabledMethods
    );

    assert.deepEqual(methodsOffOptions,
      importsUtil.MercadopagoHelpers.PAYMENT_METHODS_WITHOUT_FINTOC);
  });
});

describe("Script utilities MercadopagoHelpers test function getInstallments", () => {
  it("should call installments service with provided bin and amount", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const bin = "123456";
    const amount = "$123.45";

    const expectedCall = {
      endpoint: "/payment_methods/installments?public_key=mercadopagoPublicKey&bin=123456&amount=123.45",
      httpMethod: "GET"
    };

    sinon.spy(MercadopagoHelpers, "doCallService");

    MercadopagoHelpers.getInstallments(bin, amount);

    const actual = MercadopagoHelpers.doCallService.getCall(-1).args[0];

    assert.deepEqual(actual, expectedCall);
  });
});

describe("Script utilities MercadopagoHelpers test function getSavedCardInstallments", () => {
  it("should get saved installments for provided instrument and amount", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);

    const paymentInstruments = importsUtil.MercadopagoHelpers.PAYMENT_INSTRUMENTS;
    const amount = "$100.00";

    const expectedInstallments = importsUtil.MercadopagoHelpers.INSTALLMENTS;

    const savedInstallments = MercadopagoHelpers.getSavedCardsInstallments(
      paymentInstruments,
      amount
    );

    assert.deepEqual(savedInstallments, expectedInstallments);
  });
});

describe("Script test method to returns Seller MP data", () => {
  it("Should returns data with success", () => {
    const MercadopagoHelpers = proxyquire(scriptPath, proxyquireObject);
    const siteId = "MLC";
    assert.strictEqual(siteId, MercadopagoHelpers.getSiteId());
  });
});

describe("Scripts utilities MercadopagoHelpers creating preference payload - item pricing", () => {
  const TAX_POLICY_GROSS = "GROSS";

  // Minimal Money mock supporting subtract/add chaining (mirrors SFCC Money arithmetic)
  const createMoney = (v) => ({
    value: v,
    subtract: (other) => createMoney(parseFloat((v - other.value).toFixed(2))),
    add: (other) => createMoney(parseFloat((v + other.value).toFixed(2)))
  });

  const buildProduct = (basePrice, quantityValue, id = "P001") => ({
    productID: id,
    productName: "Test Product",
    product: { name: "Test Product", longDescription: null, primaryCategory: null },
    basePrice: { value: basePrice },
    quantityValue
  });

  const buildOrder = (productLineItems = [], {
    shipping = 0,
    merchandizeTotal = 0,
    adjustedMerchandizeTotal = 0,
    totalTax = 0,
    giftCerts = []
  } = {}) => ({
    allProductLineItems: productLineItems,
    orderNo: "00001",
    orderToken: "token",
    remoteHost: "127.0.0.1",
    adjustedShippingTotalPrice: { value: shipping },
    merchandizeTotalPrice: createMoney(merchandizeTotal),
    adjustedMerchandizeTotalPrice: createMoney(adjustedMerchandizeTotal),
    totalTax: totalTax !== null ? { value: totalTax } : null,
    getPaymentInstruments: () => [{ paymentMethod: "checkout_pro", custom: { payerDocType: "" } }],
    getGiftCertificatePaymentInstruments: () => ({
      toArray: () => giftCerts.map((amount) => ({ paymentTransaction: { amount: createMoney(amount) } }))
    }),
    billingAddress: { countryCode: { displayValue: "BR" } },
    customer: { profile: {}, registered: false },
    defaultShipment: { shippingAddress: {} }
  });

  const buildPO = (totalAmount, { isGrossTax = true } = {}) => ({
    ...proxyquireObject,
    "*/cartridge/scripts/util/MercadopagoUtil": {
      ...importsUtil.MercadopagoUtil,
      getTotalAmount: () => ({ value: totalAmount })
    },
    "dw/order/TaxMgr": {
      getTaxationPolicy: () => (isGrossTax ? TAX_POLICY_GROSS : "NET"),
      TAX_POLICY_GROSS
    }
  });

  // ─── Scenarios ───────────────────────────────────────────────────────────
  //
  // PayPal-style approach (no division):
  //   unit_price       = basePrice.value  (catalog price per unit, no division)
  //   salesTax         = totalTax         (only for Net Tax mode)
  //   nonShippingDisc  = Money(merchandizeTotal - adjustedMerchandizeTotal) + giftCerts
  //   shippingGross    = adjustedShippingTotalPrice  (no separate shipping tax)
  //
  // products: [{ bp: basePrice, qty, id? }]
  // expectedSalesTax: null (Gross Tax, absent) | number (Net Tax, present)
  // expectedOrderDiscount: null (absent) | negative number (present)
  // expectedUnitPrices: per-product unit_price (= basePrice, no division)
  const scenarios = [
    // ── Gross Tax ─────────────────────────────────────────────────────────────
    {
      name: "#1  Gross Tax | sem desconto | sem frete",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      shipping: 0, total: 100,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: null, expectedUnitPrices: [100]
    },
    {
      name: "#2  Gross Tax | desconto de item (basePrice $100, adjustedMerchandize $80)",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 80,
      shipping: 0, total: 80,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: -20, expectedUnitPrices: [100]
    },
    {
      name: "#3  Gross Tax | cupom de pedido $10",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 90,
      shipping: 0, total: 90,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: -10, expectedUnitPrices: [100]
    },
    {
      name: "#4  Gross Tax | desconto de item + cupom de pedido",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 60,
      shipping: 0, total: 60,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: -40, expectedUnitPrices: [100]
    },
    {
      name: "#5  Gross Tax | sem desconto | frete $10",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      shipping: 10, total: 110,
      expectedShippingCost: 10, expectedSalesTax: null, expectedOrderDiscount: null, expectedUnitPrices: [100]
    },
    {
      name: "#6  Gross Tax | cupom $10 + frete $10",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 90,
      shipping: 10, total: 100,
      expectedShippingCost: 10, expectedSalesTax: null, expectedOrderDiscount: -10, expectedUnitPrices: [100]
    },
    {
      name: "#7  Gross Tax | gift certificate $20",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      giftCerts: [20], shipping: 0, total: 80,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: -20, expectedUnitPrices: [100]
    },
    {
      name: "#7b Gross Tax | múltiplos gift certificates ($20 + $15)",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      giftCerts: [20, 15], shipping: 0, total: 65,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: -35, expectedUnitPrices: [100]
    },
    {
      name: "#8  Gross Tax | múltiplos produtos (A:$30×2, B:$40×1) + cupom $10",
      isGrossTax: true,
      products: [{ bp: 30, qty: 2, id: "A" }, { bp: 40, qty: 1, id: "B" }],
      merchandizeTotal: 100, adjustedMerchandizeTotal: 90,
      shipping: 0, total: 90,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: -10, expectedUnitPrices: [30, 40]
    },
    {
      name: "#9  Gross Tax | múltiplas unidades (3 × $30) | sem desconto",
      isGrossTax: true,
      products: [{ bp: 30, qty: 3 }], merchandizeTotal: 90, adjustedMerchandizeTotal: 90,
      shipping: 0, total: 90,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: null, expectedUnitPrices: [30]
    },
    {
      // Gross Tax: basePrice já inclui o imposto — totalTax é parcela embutida, não adicional.
      // salesTax NÃO deve ser adicionado mesmo com totalTax > 0.
      name: "#9b Gross Tax | imposto presente — salesTax NÃO deve ser adicionado",
      isGrossTax: true,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      totalTax: 18, shipping: 0, total: 100,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: null, expectedUnitPrices: [100]
    },
    // ── Net Tax ───────────────────────────────────────────────────────────────
    // In Net Tax mode: salesTax item is added with order.totalTax.value (includes shipping tax).
    // shippingGross = adjustedShippingTotalPrice (net, without tax) — shipping tax is in totalTax.
    {
      name: "#10 Net Tax  | sem desconto | sem frete",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      totalTax: 18, shipping: 0, total: 118,
      expectedShippingCost: 0, expectedSalesTax: 18, expectedOrderDiscount: null, expectedUnitPrices: [100]
    },
    {
      name: "#11 Net Tax  | desconto de item",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 80,
      totalTax: 14.40, shipping: 0, total: 94.40,
      expectedShippingCost: 0, expectedSalesTax: 14.40, expectedOrderDiscount: -20, expectedUnitPrices: [100]
    },
    {
      name: "#12 Net Tax  | cupom de pedido $30",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 70,
      totalTax: 12.60, shipping: 0, total: 82.60,
      expectedShippingCost: 0, expectedSalesTax: 12.60, expectedOrderDiscount: -30, expectedUnitPrices: [100]
    },
    {
      name: "#13 Net Tax  | desconto de item + cupom de pedido",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 60,
      totalTax: 10.80, shipping: 0, total: 70.80,
      expectedShippingCost: 0, expectedSalesTax: 10.80, expectedOrderDiscount: -40, expectedUnitPrices: [100]
    },
    {
      name: "#14 Net Tax  | sem desconto | frete líquido $15 + imposto frete $2.70",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      totalTax: 20.70, shipping: 15, total: 135.70,
      expectedShippingCost: 15, expectedSalesTax: 20.70, expectedOrderDiscount: null, expectedUnitPrices: [100]
    },
    {
      name: "#15 Net Tax  | cupom $30 + frete líquido $15 + imposto frete $2.70",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 70,
      totalTax: 15.30, shipping: 15, total: 100.30,
      expectedShippingCost: 15, expectedSalesTax: 15.30, expectedOrderDiscount: -30, expectedUnitPrices: [100]
    },
    {
      name: "#16 Net Tax  | gift certificate $20",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      giftCerts: [20], totalTax: 18, shipping: 0, total: 98,
      expectedShippingCost: 0, expectedSalesTax: 18, expectedOrderDiscount: -20, expectedUnitPrices: [100]
    },
    {
      name: "#17 Net Tax  | dízima-resistant (basePrice $3.33 × 3) | sem desconto",
      isGrossTax: false,
      products: [{ bp: 3.33, qty: 3 }], merchandizeTotal: 9.99, adjustedMerchandizeTotal: 9.99,
      totalTax: 1.80, shipping: 0, total: 11.79,
      expectedShippingCost: 0, expectedSalesTax: 1.80, expectedOrderDiscount: null, expectedUnitPrices: [3.33]
    },
    {
      // totalTax = null: order.totalTax é null → guard (order.totalTax &&) falha → salesTax NÃO adicionado
      name: "#17b Net Tax | totalTax null — salesTax NÃO deve ser adicionado",
      isGrossTax: false,
      products: [{ bp: 100, qty: 1 }], merchandizeTotal: 100, adjustedMerchandizeTotal: 100,
      totalTax: null, shipping: 0, total: 100,
      expectedShippingCost: 0, expectedSalesTax: null, expectedOrderDiscount: null, expectedUnitPrices: [100]
    }
  ];

  scenarios.forEach(({
    name, isGrossTax = true, products, merchandizeTotal, adjustedMerchandizeTotal,
    totalTax = 0, giftCerts = [], shipping, total,
    expectedShippingCost, expectedSalesTax, expectedOrderDiscount, expectedUnitPrices
  }) => {
    it(name, () => {
      const lineItems = products.map(({ bp, qty, id }) => buildProduct(bp, qty, id || "P001"));
      const order = buildOrder(lineItems, { shipping, merchandizeTotal, adjustedMerchandizeTotal, totalTax, giftCerts });
      const payload = proxyquire(scriptPath, buildPO(total, { isGrossTax })).createPreferencePayload(order);

      // 1. shipments.cost = adjustedShippingTotalPrice (no shipping tax added)
      assert.strictEqual(payload.shipments.cost, expectedShippingCost,
        `shipments.cost: expected ${expectedShippingCost}`);

      // 2. salesTax: present with correct value for Net Tax, absent for Gross Tax
      const salesTaxItem = payload.items.find((i) => i.id === "salesTax");
      if (expectedSalesTax !== null) {
        assert(salesTaxItem, "salesTax item should be present for Net Tax");
        assert.strictEqual(salesTaxItem.unit_price, expectedSalesTax,
          `salesTax.unit_price: expected ${expectedSalesTax}`);
        assert.strictEqual(salesTaxItem.quantity, 1, "salesTax.quantity must be 1");
      } else {
        assert(!salesTaxItem, "salesTax must not be present for Gross Tax");
      }

      // 3. unit_price per product = basePrice.value (no division)
      const productItems = payload.items.filter((i) => i.id !== "orderDiscount" && i.id !== "salesTax");
      expectedUnitPrices.forEach((expectedPrice, idx) => {
        assert.strictEqual(productItems[idx].unit_price, expectedPrice,
          `unit_price[${idx}]: expected ${expectedPrice}`);
      });

      // 4. orderDiscount: presence, value and structure
      const discountItem = payload.items.find((i) => i.id === "orderDiscount");
      if (expectedOrderDiscount !== null) {
        assert(discountItem, "orderDiscount item should be present");
        assert.strictEqual(discountItem.unit_price, expectedOrderDiscount,
          `orderDiscount.unit_price: expected ${expectedOrderDiscount}`);
        assert.strictEqual(discountItem.quantity, 1, "orderDiscount.quantity must be 1");
        assert.strictEqual(discountItem.title, "Order Discount", "orderDiscount.title");
      } else {
        assert(!discountItem, "orderDiscount item must NOT be present");
      }

      // 5. items array length
      const expectedItemCount = products.length
        + (expectedSalesTax !== null ? 1 : 0)
        + (expectedOrderDiscount !== null ? 1 : 0);
      assert.strictEqual(payload.items.length, expectedItemCount,
        `items.length: expected ${expectedItemCount}, got ${payload.items.length}`);

      // 6. Invariant: Σitems + shipping == transaction_amount (defense in depth)
      const itemsSum = payload.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
      assert.strictEqual(
        parseFloat((itemsSum + payload.shipments.cost).toFixed(2)),
        total,
        `invariant: items(${itemsSum}) + shipping(${payload.shipments.cost}) should equal ${total}`
      );
    });
  });

  it("should skip gift certificates with null paymentTransaction", () => {
    const lineItems = [buildProduct(100, 1)];
    const order = {
      ...buildOrder(lineItems, { merchandizeTotal: 100, adjustedMerchandizeTotal: 100 }),
      getGiftCertificatePaymentInstruments: () => ({
        toArray: () => [
          { paymentTransaction: null },
          { paymentTransaction: { amount: createMoney(20) } }
        ]
      })
    };
    const payload = proxyquire(scriptPath, buildPO(80)).createPreferencePayload(order);

    const discountItem = payload.items.find((i) => i.id === "orderDiscount");
    assert(discountItem, "orderDiscount deve estar presente para o GC válido");
    assert.strictEqual(discountItem.unit_price, -20, "somente o GC válido deve ser contabilizado");
    assert.strictEqual(
      parseFloat((payload.items.reduce((s, i) => s + i.unit_price * i.quantity, 0) + payload.shipments.cost).toFixed(2)),
      80,
      "invariante: GC nulo ignorado, GC válido deduzido"
    );
  });
});
