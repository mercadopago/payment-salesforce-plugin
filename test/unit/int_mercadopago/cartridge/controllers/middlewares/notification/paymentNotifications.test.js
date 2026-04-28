const sinon = require("sinon");
const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru();
const importsUtil = require("../../../../mocks/util/importsUtil");

const filePath =
  "*/../../cartridges/int_mercadopago/cartridge/controllers/middlewares/notification/paymentNotifications.js";

describe("Controller PaymentNotification test", function () {
  this.timeout(10000); // Aumenta o timeout para 10 segundos

  let paymentNotifications;
  let orderMock;
  let paymentInfoMock;
  let ResourceMock;
  let TransactionMock;
  let LoggerMock;
  let COHelpersMock;

  beforeEach(() => {
    orderMock = {
      addNote: sinon.stub(),
      custom: {
        paymentStatus: "approved [ mocked message ]",
        paymentReport: "accredited [ mocked message ]"
      }
    };

    paymentInfoMock = {
      status: "approved",
      payments_details: [
        {
          status_detail: "accredited"
        }
      ]
    };

    ResourceMock = {
      msg: sinon.stub().returns("mocked message"),
      msgf: sinon.stub().returns("mocked formatted message")
    };

    TransactionMock = {
      wrap: sinon.stub().callsFake((fn) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            fn();
            resolve();
          }, 100);
        });
      })
    };

    LoggerMock = {
      getLogger: sinon.stub().returns({
        error: sinon.stub(),
        info: sinon.stub()
      })
    };

    COHelpersMock = {
      placeOrder: sinon.stub().returns({
        error: false
      }),
      sendConfirmationEmail: sinon.stub()
    };

    paymentNotifications = proxyquire(filePath, {
      "*/cartridge/scripts/util/MercadopagoHelpers":
        importsUtil.MercadopagoHelpers,
      "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
      "*/cartridge/scripts/checkout/checkoutHelpers": COHelpersMock,
      "dw/system/Transaction": TransactionMock,
      "dw/web/Resource": ResourceMock,
      "dw/system/Logger": LoggerMock,
      "dw/order/Order": importsUtil.Order,
      "dw/order/OrderMgr": {
        getOrder: sinon.stub().returns(orderMock)
      }
    });
  });

  it("should update payment info successfully", () => {
    paymentNotifications.updatePaymentInfo(orderMock, paymentInfoMock);

    assert.strictEqual(
      orderMock.custom.paymentStatus,
      "approved [ mocked message ]"
    );
    assert.strictEqual(
      orderMock.custom.paymentReport,
      "accredited [ mocked message ]"
    );
  });

  it("should throw an error if paymentInfo is invalid", () => {
    assert.throws(() => {
      paymentNotifications.updatePaymentInfo(orderMock, null);
    }, /Invalid paymentInfo or payments_details/);
  });
});

describe("savePaymentInformation regression tests", function () {
  this.timeout(10000);

  let TransactionMock;
  let ResourceMock;
  let LoggerMock;
  let OrderMock;
  let COHelpersMock;

  beforeEach(() => {
    TransactionMock = {
      wrap: sinon.stub().callsFake((fn) => fn())
    };

    ResourceMock = {
      msg: sinon.stub().returns("mocked message"),
      msgf: sinon.stub().returns("mocked formatted message")
    };

    LoggerMock = {
      getLogger: sinon.stub().returns({
        error: sinon.stub(),
        info: sinon.stub()
      })
    };

    OrderMock = {
      ORDER_STATUS_CREATED: 0,
      ORDER_STATUS_NEW: 3,
      ORDER_STATUS_OPEN: 4,
      PAYMENT_STATUS_PAID: 1,
      PAYMENT_STATUS_NOTPAID: 0
    };

    COHelpersMock = {
      placeOrder: sinon.stub().returns({ error: false }),
      sendConfirmationEmail: sinon.stub()
    };
  });

  function createPaymentNotificationsModule(parseOrderStatusFn) {
    const MercadopagoUtilMock = {
      ...importsUtil.MercadopagoUtil,
      parseOrderStatus: parseOrderStatusFn
    };

    return proxyquire(filePath, {
      "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
      "*/cartridge/scripts/util/MercadopagoUtil": MercadopagoUtilMock,
      "*/cartridge/scripts/checkout/checkoutHelpers": COHelpersMock,
      "dw/system/Transaction": TransactionMock,
      "dw/web/Resource": ResourceMock,
      "dw/system/Logger": LoggerMock,
      "dw/order/Order": OrderMock,
      "dw/order/OrderMgr": {
        getOrder: sinon.stub(),
        failOrder: sinon.stub(),
        cancelOrder: sinon.stub()
      }
    });
  }

  it("should authorize order when status is approved and no previous payment status", () => {
    const pn = createPaymentNotificationsModule(() => "authorized");

    const orderMock = {
      addNote: sinon.stub(),
      custom: { paymentStatus: null, paymentReport: null },
      setPaymentStatus: sinon.stub(),
      status: { value: 0 },
      getPaymentInstruments: () => [
        { getPaymentTransaction: () => ({ getAmount: () => 100 }) }
      ]
    };

    const paymentInfo = {
      status: "approved",
      transaction_amount: 100,
      payments_details: [{ status_detail: "accredited" }]
    };

    pn.savePaymentInformation(orderMock, paymentInfo, "en_US");

    assert.ok(
      orderMock.setPaymentStatus.calledWith(1),
      "Payment status should be set to PAID"
    );
  });

  it("should decline order when status is rejected", () => {
    const pn = createPaymentNotificationsModule(() => "declined");

    const orderMock = {
      addNote: sinon.stub(),
      custom: { paymentStatus: null, paymentReport: null },
      setPaymentStatus: sinon.stub(),
      status: { value: 0 }
    };

    const paymentInfo = {
      status: "rejected",
      payments_details: [{ status_detail: "cc_rejected_other_reason" }]
    };

    pn.savePaymentInformation(orderMock, paymentInfo, "en_US");

    assert.ok(
      orderMock.setPaymentStatus.calledWith(0),
      "Payment status should be set to NOTPAID"
    );
  });

  it("should refund order when status is refunded and previous status was approved", () => {
    const parseStub = sinon.stub();
    parseStub.onFirstCall().returns("refunded");
    parseStub.onSecondCall().returns("refunded");

    const pn = createPaymentNotificationsModule(parseStub);

    const orderMock = {
      addNote: sinon.stub(),
      custom: {
        paymentStatus: "approved [ mocked message ]",
        paymentReport: "accredited [ mocked message ]"
      },
      setPaymentStatus: sinon.stub(),
      status: { value: 0 }
    };

    const paymentInfo = {
      status: "refunded",
      payments_details: [{ status_detail: "refunded" }]
    };

    pn.savePaymentInformation(orderMock, paymentInfo, "en_US");

    assert.ok(
      orderMock.setPaymentStatus.calledWith(0),
      "Payment status should be set to NOTPAID for refund"
    );
  });

  it("should not update when authorized order receives approved again (idempotency)", () => {
    const pn = createPaymentNotificationsModule(() => "authorized");

    const orderMock = {
      addNote: sinon.stub(),
      custom: {
        paymentStatus: "authorized [ mocked message ]",
        paymentReport: "accredited [ mocked message ]"
      },
      setPaymentStatus: sinon.stub(),
      status: { value: 3 }
    };

    const paymentInfo = {
      status: "approved",
      payments_details: [{ status_detail: "accredited" }]
    };

    pn.savePaymentInformation(orderMock, paymentInfo, "en_US");

    assert.ok(
      !orderMock.setPaymentStatus.called,
      "setPaymentStatus should not be called for duplicate authorized status"
    );
  });

  it("should allow transition from pending to declined", () => {
    const pn = createPaymentNotificationsModule(() => "declined");

    const orderMock = {
      addNote: sinon.stub(),
      custom: {
        paymentStatus: "pending [ mocked message ]",
        paymentReport: "pending [ mocked message ]"
      },
      setPaymentStatus: sinon.stub(),
      status: { value: 0 }
    };

    const paymentInfo = {
      status: "rejected",
      payments_details: [{ status_detail: "cc_rejected_other_reason" }]
    };

    pn.savePaymentInformation(orderMock, paymentInfo, "en_US");

    assert.ok(
      orderMock.setPaymentStatus.calledWith(0),
      "Should transition from pending to declined"
    );
  });
});

describe("paymentNotifications controller full flow test", function () {
  this.timeout(10000);

  it("should process a valid notification end-to-end: retrieve payment, find order, and respond with success", () => {
    const notificationBody = JSON.stringify({
      notification_id: "NOTIF-FULL-001"
    });

    global.request = {
      httpParameterMap: {
        requestBodyAsString: notificationBody
      }
    };

    const retrieveStub = sinon.stub().returns({
      status: "approved",
      payment_method_id: "visa",
      external_reference: "ORDER-001",
      transaction_amount: 100,
      payer: { email: "user@test.com" },
      additional_info: { ip: "1.2.3.4" },
      payments_details: [{ status_detail: "accredited" }]
    });

    const orderMock = {
      addNote: sinon.stub(),
      custom: { paymentStatus: null, paymentReport: null },
      setPaymentStatus: sinon.stub(),
      status: { value: 0 },
      getPaymentInstruments: () => [
        { getPaymentTransaction: () => ({ getAmount: () => 100 }) }
      ]
    };

    const OrderMgrMock = {
      getOrder: sinon.stub().returns(orderMock),
      failOrder: sinon.stub(),
      cancelOrder: sinon.stub()
    };

    const resMock = { json: sinon.stub() };
    const nextMock = sinon.stub();
    const reqMock = { locale: { id: "en_US" } };

    const pn = proxyquire(filePath, {
      "*/cartridge/scripts/util/MercadopagoHelpers": {
        payments: { retrieve: retrieveStub }
      },
      "*/cartridge/scripts/util/MercadopagoUtil": {
        ...importsUtil.MercadopagoUtil,
        parseOrderStatus: () => "authorized",
        PAYMENT_METHOD: importsUtil.MercadopagoUtil.PAYMENT_METHOD
      },
      "*/cartridge/scripts/checkout/checkoutHelpers": {
        placeOrder: sinon.stub().returns({ error: false }),
        sendConfirmationEmail: sinon.stub()
      },
      "dw/system/Transaction": { wrap: sinon.stub().callsFake((fn) => fn()) },
      "dw/web/Resource": {
        msg: sinon.stub().returns("mocked"),
        msgf: sinon.stub().returns("mocked")
      },
      "dw/system/Logger": {
        getLogger: sinon.stub().returns({
          error: sinon.stub(),
          info: sinon.stub()
        })
      },
      "dw/order/Order": {
        ORDER_STATUS_CREATED: 0,
        ORDER_STATUS_NEW: 3,
        ORDER_STATUS_OPEN: 4,
        PAYMENT_STATUS_PAID: 1,
        PAYMENT_STATUS_NOTPAID: 0
      },
      "dw/order/OrderMgr": OrderMgrMock
    });

    pn.paymentNotifications(reqMock, resMock, nextMock);

    assert.ok(retrieveStub.calledOnce, "retrieve should be called");
    assert.strictEqual(retrieveStub.getCall(0).args[0], "NOTIF-FULL-001");
    assert.ok(OrderMgrMock.getOrder.calledWith("ORDER-001"), "should look up order by external_reference");
    assert.ok(resMock.json.calledOnce, "should respond with json");
    assert.deepStrictEqual(resMock.json.getCall(0).args[0], { message: "Successful processed notification" });
    assert.ok(nextMock.calledOnce, "next should be called");

    delete global.request;
  });

  it("should return early when notificationId is not a string", () => {
    global.request = {
      httpParameterMap: {
        requestBodyAsString: JSON.stringify({ notification_id: 12345 })
      }
    };

    const retrieveStub = sinon.stub();
    const resMock = { json: sinon.stub() };
    const nextMock = sinon.stub();
    const reqMock = { locale: { id: "en_US" } };

    const pn = proxyquire(filePath, {
      "*/cartridge/scripts/util/MercadopagoHelpers": {
        payments: { retrieve: retrieveStub }
      },
      "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
      "*/cartridge/scripts/checkout/checkoutHelpers": {},
      "dw/system/Transaction": { wrap: sinon.stub().callsFake((fn) => fn()) },
      "dw/web/Resource": {
        msg: sinon.stub().returns(""),
        msgf: sinon.stub().returns("")
      },
      "dw/system/Logger": {
        getLogger: sinon.stub().returns({
          error: sinon.stub(),
          info: sinon.stub()
        })
      },
      "dw/order/Order": importsUtil.Order,
      "dw/order/OrderMgr": { getOrder: sinon.stub() }
    });

    pn.paymentNotifications(reqMock, resMock, nextMock);

    assert.ok(!retrieveStub.called, "retrieve should not be called for invalid notificationId");

    delete global.request;
  });
});
