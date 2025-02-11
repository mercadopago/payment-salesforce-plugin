const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../mocks/util/importsUtil");

const filePath = "*/../../cartridges/int_mercadopago/cartridge/controllers/middlewares/paymentInstruments/deletePayment.js";

const proxyquireObject = {
  "*/cartridge/scripts/util/MercadopagoHelpers": importsUtil.MercadopagoHelpers,
  "dw/system/Logger": importsUtil.Logger
};

describe("Controller MercadoPago middleware paymentInstrument test", () => {
  importsUtil.MercadopagoHelpers.customerCard = {
    delete: sinon.stub()
  };
  const deletePayment = proxyquire(filePath, proxyquireObject);

  it("Should return error when no cards found", () => {
    const req = {
      querystring: { UUID: "132" },
      currentCustomer: {
        wallet: {
          paymentInstruments: []
        }
      }
    };
    const res = {
      getViewData: () => { },
      setViewData: () => { }
    };

    const next = () => { };

    const result = deletePayment(req, res, next);

    assert.strictEqual(result, undefined);
    assert(importsUtil.MercadopagoHelpers.customerCard.delete.notCalled);
  });

  it("Should delete card successfully", () => {
    importsUtil.MercadopagoHelpers.customerCard = {
      delete: sinon.stub()
    };

    const req = {
      querystring: { UUID: "132" },
      currentCustomer: {
        wallet: {
          paymentInstruments: [
            {
              UUID: "132",
              raw: {
                creditCardToken: "132",
                custom: {
                  customerIdMercadoPago: "321"
                }
              }
            }
          ]
        }
      }
    };
    const res = {
      getViewData: () => { },
      setViewData: () => { }
    };

    const next = () => { };

    const result = deletePayment(req, res, next);

    assert.strictEqual(result, undefined);
    assert(importsUtil.MercadopagoHelpers.customerCard.delete.calledOnce);
  });

  it("Should return error when deleting card fails", () => {
    importsUtil.MercadopagoHelpers.customerCard.delete = () => { throw new Error("Delete failed"); };

    const req = {
      querystring: { UUID: "132" },
      currentCustomer: {
        wallet: {
          paymentInstruments: [
            {
              UUID: "132",
              raw: {
                creditCardToken: "132",
                custom: {
                  customerIdMercadoPago: "321"
                }
              }
            }
          ]
        }
      }
    };
    const res = {
      getViewData: () => { },
      setViewData: () => { }
    };

    const next = () => ({ error: "Delete failed" });

    deletePayment(req, res, next);

    assert.strictEqual(next().error, "Delete failed");
  });
});
