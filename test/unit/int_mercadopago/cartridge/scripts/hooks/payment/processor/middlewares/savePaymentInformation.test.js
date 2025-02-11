const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();

describe("savePaymentInformation", () => {
  let savePaymentInformation;
  let CustomerMgrMock;
  let COHelpersMock;
  let MercadopagoUtilMock;

  beforeEach(() => {
    CustomerMgrMock = {
      getCustomerByCustomerNumber: sinon.stub()
    };

    COHelpersMock = {
      savePaymentInstrumentToWallet: sinon.stub()
    };

    MercadopagoUtilMock = {
      PAYMENT_METHOD: {
        credit_card: "CREDIT_CARD"
      }
    };

    savePaymentInformation = proxyquire("*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/savePaymentInformation", {
      "dw/customer/CustomerMgr": CustomerMgrMock,
      "*/cartridge/scripts/checkout/checkoutHelpers": COHelpersMock,
      "*/cartridge/scripts/util/MercadopagoUtil": MercadopagoUtilMock
    });
  });

  it("should save payment information when conditions are met", () => {
    const order = {
      customer: {
        authenticated: true,
        registered: true,
        profile: {
          customerNo: "12345",
          wallet: {
            paymentInstruments: {
              add: sinon.stub()
            }
          }
        }
      },
      paymentInstrument: {
        custom: {
          saveCardToWallet: true
        },
        paymentMethod: "CREDIT_CARD",
        creditCardNumber: "4111111111111111",
        creditCardType: "Visa",
        creditCardExpirationMonth: "12",
        creditCardExpirationYear: "2030",
        creditCardToken: "token123"
      },
      billingAddress: {}
    };

    const customer = {};
    const saveCardResult = {
      creditCardHolder: "John Doe",
      maskedCreditCardNumber: "411111******1111",
      creditCardType: "Visa",
      creditCardExpirationMonth: "12",
      creditCardExpirationYear: "2030",
      UUID: "uuid123",
      creditCardNumber: "4111111111111111",
      creditCardToken: "token123",
      custom: {
        customerIdMercadoPago: "customerId123",
        cardBin: "411111"
      }
    };

    CustomerMgrMock.getCustomerByCustomerNumber.returns(customer);
    COHelpersMock.savePaymentInstrumentToWallet.returns(saveCardResult);

    const result = savePaymentInformation(order);

    assert.strictEqual(result, null);
    assert(CustomerMgrMock.getCustomerByCustomerNumber.calledOnceWith("12345"));
    assert(COHelpersMock.savePaymentInstrumentToWallet.calledOnce);
    assert(order.customer.profile.wallet.paymentInstruments.add.calledOnceWith({
      creditCardHolder: "John Doe",
      maskedCreditCardNumber: "411111******1111",
      creditCardType: "Visa",
      creditCardExpirationMonth: "12",
      creditCardExpirationYear: "2030",
      UUID: "uuid123",
      creditCardNumber: "4111111111111111",
      creditCardToken: "token123",
      custom: {
        customerIdMercadoPago: "customerId123",
        cardBin: "411111"
      },
      raw: saveCardResult
    }));
  });

  it("should return null when conditions are not met", () => {
    const order = {
      customer: {
        authenticated: false,
        registered: true,
        profile: {
          customerNo: "12345",
          wallet: {
            paymentInstruments: {
              add: sinon.stub()
            }
          }
        }
      },
      paymentInstrument: {
        custom: {
          saveCardToWallet: true
        },
        paymentMethod: "CREDIT_CARD",
        creditCardNumber: "4111111111111111",
        creditCardType: "Visa",
        creditCardExpirationMonth: "12",
        creditCardExpirationYear: "2030",
        creditCardToken: "token123"
      },
      billingAddress: {}
    };

    const result = savePaymentInformation(order);

    assert.strictEqual(result, null);
    assert(CustomerMgrMock.getCustomerByCustomerNumber.notCalled);
    assert(COHelpersMock.savePaymentInstrumentToWallet.notCalled);
    assert(order.customer.profile.wallet.paymentInstruments.add.notCalled);
  });

  it("should return error message when an exception occurs", () => {
    const order = {
      customer: {
        authenticated: true,
        registered: true,
        profile: {
          customerNo: "12345",
          wallet: {
            paymentInstruments: {
              add: sinon.stub()
            }
          }
        }
      },
      paymentInstrument: {
        custom: {
          saveCardToWallet: true
        },
        paymentMethod: "CREDIT_CARD",
        creditCardNumber: "4111111111111111",
        creditCardType: "Visa",
        creditCardExpirationMonth: "12",
        creditCardExpirationYear: "2030",
        creditCardToken: "token123"
      },
      billingAddress: {}
    };

    CustomerMgrMock.getCustomerByCustomerNumber.throws(new Error("Test error"));

    const result = savePaymentInformation(order);

    assert.strictEqual(result, "Test error");
    assert(CustomerMgrMock.getCustomerByCustomerNumber.calledOnceWith("12345"));
    assert(COHelpersMock.savePaymentInstrumentToWallet.notCalled);
    assert(order.customer.profile.wallet.paymentInstruments.add.notCalled);
  });

  it("should not save payment information when flag saveCardToWallet is false", () => {
    const order = {
      customer: {
        authenticated: true,
        registered: true,
        profile: {
          customerNo: "12345",
          wallet: {
            paymentInstruments: {
              add: sinon.stub()
            }
          }
        }
      },
      paymentInstrument: {
        custom: {
          saveCardToWallet: false
        },
        paymentMethod: "CREDIT_CARD",
        creditCardNumber: "4111111111111111",
        creditCardType: "Visa",
        creditCardExpirationMonth: "12",
        creditCardExpirationYear: "2030",
        creditCardToken: "token123"
      },
      billingAddress: {}
    };

    const customer = {};
    const saveCardResult = {
      creditCardHolder: "John Doe",
      maskedCreditCardNumber: "411111******1111",
      creditCardType: "Visa",
      creditCardExpirationMonth: "12",
      creditCardExpirationYear: "2030",
      UUID: "uuid123",
      creditCardNumber: "4111111111111111",
      creditCardToken: "token123",
      custom: {
        customerIdMercadoPago: "customerId123",
        cardBin: "411111"
      }
    };

    CustomerMgrMock.getCustomerByCustomerNumber.returns(customer);
    COHelpersMock.savePaymentInstrumentToWallet.returns(saveCardResult);

    const result = savePaymentInformation(order);

    assert.strictEqual(result, null);
    assert(CustomerMgrMock.getCustomerByCustomerNumber.notCalled);
    assert(COHelpersMock.savePaymentInstrumentToWallet.notCalled);
    assert(order.customer.profile.wallet.paymentInstruments.add.notCalled);
  });
});
