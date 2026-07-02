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

describe("Hook MERCADOPAGO_PAYMENTS middleware processFormMethodsOff alphanumeric CNPJ test", () => {
  // Use the real MercadopagoUtil to exercise validation + normalization end-to-end (ticket)
  const realMercadopagoUtil = proxyquire(
    "*/../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoUtil.js",
    {
      "dw/web/Resource": importsUtil.Resource,
      "dw/system/Site": importsUtil.Site
    }
  );
  const processFormMethodsOff = proxyquire(hookPath, {
    "dw/web/Resource": importsUtil.Resource,
    "*/cartridge/scripts/util/MercadopagoUtil": realMercadopagoUtil,
    "*/cartridge/scripts/formErrors": importsUtil.FormErrors
  });

  it("should validate and normalize an alphanumeric CNPJ in the ticket flow (raw, no mask)", () => {
    const methodsOffFields = paymentDataUtil.getFormMethodsOff();
    methodsOffFields.docTypeMethodsOff.value = "CNPJ";
    methodsOffFields.docTypeMethodsOff.selectedOption = "CNPJ";
    methodsOffFields.docTypeMethodsOff.htmlValue = "CNPJ";
    methodsOffFields.docNumberMethodsOff.value = "12.ABC.345/01DE-35";

    const paymentForm = {
      paymentMethod: { value: PAYMENT_METHOD, htmlName: "" },
      methodsOffFields: methodsOffFields
    };
    const result = processFormMethodsOff({}, paymentForm, {});

    assert.equal(result.error, false);
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      "12ABC34501DE35"
    );
  });

  it("should reject an alphanumeric CNPJ with wrong check digits in the ticket flow", () => {
    const methodsOffFields = paymentDataUtil.getFormMethodsOff();
    methodsOffFields.docTypeMethodsOff.value = "CNPJ";
    methodsOffFields.docTypeMethodsOff.selectedOption = "CNPJ";
    methodsOffFields.docTypeMethodsOff.htmlValue = "CNPJ";
    methodsOffFields.docNumberMethodsOff.value = "12.ABC.345/01DE-99";

    const paymentForm = {
      paymentMethod: { value: PAYMENT_METHOD, htmlName: "" },
      methodsOffFields: methodsOffFields
    };
    const result = processFormMethodsOff({}, paymentForm, {});

    assert.equal(result.error, true);
    assert.equal(
      Object.keys(result.fieldErrors)[0],
      methodsOffFields.docNumberMethodsOff.htmlName
    );
  });

  it("should normalize a masked CPF to raw digits in the ticket flow", () => {
    const methodsOffFields = paymentDataUtil.getFormMethodsOff();
    methodsOffFields.docNumberMethodsOff.value = "123.456.789-09";

    const paymentForm = {
      paymentMethod: { value: PAYMENT_METHOD, htmlName: "" },
      methodsOffFields: methodsOffFields
    };
    const result = processFormMethodsOff({}, paymentForm, {});

    assert.equal(result.error, false);
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      "12345678909"
    );
  });
});
