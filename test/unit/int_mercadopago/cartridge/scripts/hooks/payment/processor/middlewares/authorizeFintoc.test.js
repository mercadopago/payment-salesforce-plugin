const sinon = require("sinon");
const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru();

describe("authorizeFintoc", () => {
  let authorizeFintoc;
  let Transaction;
  let OrderMgr;
  let MercadopagoHelpers;
  let Logger;
  let session;
  let order;
  let paymentInstrument;
  let paymentProcessor;
  let paymentResponse;

  beforeEach(() => {
    Transaction = {
      wrap: sinon.stub().callsFake((fn) => fn())
    };

    OrderMgr = {
      getOrder: sinon.stub()
    };

    MercadopagoHelpers = {
      createPaymentPayload: sinon.stub(),
      payments: {
        create: sinon.stub()
      }
    };

    Logger = {
      getLogger: sinon.stub().returns({
        info: sinon.stub(),
        error: sinon.stub()
      })
    };

    session = {
      privacy: {
        currentOrderToken: "testOrderToken",
        mercadopagoErrorMessage: JSON.stringify({ cause: [{ code: "123" }] })
      }
    };

    order = {
      custom: {},
      addNote: sinon.stub(),
      setPaymentStatus: sinon.stub()
    };

    paymentInstrument = {
      paymentTransaction: {}
    };

    paymentProcessor = {};

    paymentResponse = {
      status: "approved",
      status_detail: "accredited",
      id: "12345",
      payment_method: {
        data: {
          external_reference_id: "extRefId",
          external_resource_url: "extResUrl"
        }
      }
    };

    authorizeFintoc = proxyquire("./authorizeFintoc", {
      "dw/system/Transaction": Transaction,
      "dw/order/OrderMgr": OrderMgr,
      "dw/system/Logger": Logger,
      "*/cartridge/scripts/util/MercadopagoHelpers": MercadopagoHelpers,
      "dw/web/Resource": {
        msg: sinon.stub().returns("message")
      },
      "dw/order/Order": {
        PAYMENT_STATUS_PAID: "PAID",
        PAYMENT_STATUS_NOTPAID: "NOTPAID"
      },
      "*/cartridge/scripts/util/MercadopagoUtil": {
        parseOrderStatus: sinon.stub().returns("authorized")
      },
      "dw/system/Logger": Logger,
      session: session
    });
  });

  it("should authorize payment successfully", () => {
    OrderMgr.getOrder.returns(order);
    MercadopagoHelpers.createPaymentPayload.returns({});
    MercadopagoHelpers.payments.create.returns(paymentResponse);

    const result = authorizeFintoc("orderNumber", paymentInstrument, paymentProcessor);

    assert.strictEqual(result.error, false);
    assert(paymentInstrument.paymentTransaction.paymentProcessor, paymentProcessor);
    assert(order.setPaymentStatus.calledWith("PAID"));
  });

  it("should handle payment error", () => {
    OrderMgr.getOrder.returns(order);
    MercadopagoHelpers.createPaymentPayload.returns({});
    MercadopagoHelpers.payments.create.returns(null);

    const result = authorizeFintoc("orderNumber", paymentInstrument, paymentProcessor);

    assert.strictEqual(result.error, true);
  });

  it("should handle exception", () => {
    OrderMgr.getOrder.throws(new Error("Test Error"));

    const result = authorizeFintoc("orderNumber", paymentInstrument, paymentProcessor);

    assert.strictEqual(result.error, true);
  });
});
