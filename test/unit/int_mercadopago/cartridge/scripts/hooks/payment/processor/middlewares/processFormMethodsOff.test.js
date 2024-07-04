const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/processFormMethodsOff.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/formErrors": importsUtil.FormErrors
};

const PAYMENT_METHOD = "METHODS_OFF";

describe("Hook MERCADOPAGO_PAYMENTS middleware processFormMethodsOff test", () => {
  const processFormMethodsOff = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const methodsOffFields = paymentDataUtil.getFormMethodsOff();
    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      methodsOffFields: methodsOffFields
    };
    const req = {};
    const viewFormData = {};
    const result = processFormMethodsOff(req, paymentForm, viewFormData);

    assert.equal(result.error, false);
    assert.equal(result.viewData.paymentMethod.value, PAYMENT_METHOD);

    assert.equal(
      result.viewData.paymentInformation.docType.value,
      methodsOffFields.docTypeMethodsOff.selectedOption
    );
    assert.equal(
      result.viewData.paymentInformation.docType.htmlName,
      methodsOffFields.docTypeMethodsOff.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      methodsOffFields.docNumberMethodsOff.value
    );
    assert.equal(
      result.viewData.paymentInformation.docNumber.htmlName,
      methodsOffFields.docNumberMethodsOff.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.paymentMethod.value,
      PAYMENT_METHOD
    );
  });
});
