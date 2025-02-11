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
        error: sinon.stub()
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
