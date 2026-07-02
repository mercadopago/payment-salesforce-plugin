const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/processFormPix.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/formErrors": importsUtil.FormErrors
};

const PAYMENT_METHOD = "PIX";

describe("Hook MERCADOPAGO_PAYMENTS middleware processFormPix test", () => {
  const processFormPix = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const pixFields = paymentDataUtil.getFormPix();
    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      pixFields: pixFields
    };
    const req = {};
    const viewFormData = {};
    const result = processFormPix(req, paymentForm, viewFormData);

    assert.equal(result.error, false);
    assert.equal(result.viewData.paymentMethod.value, PAYMENT_METHOD);
    assert.equal(
      result.viewData.paymentInformation.email.value,
      pixFields.email.value
    );
    assert.equal(
      result.viewData.paymentInformation.email.htmlName,
      pixFields.email.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.firstName.value,
      pixFields.firstName.value
    );
    assert.equal(
      result.viewData.paymentInformation.firstName.htmlName,
      pixFields.firstName.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.lastName.value,
      pixFields.lastName.value
    );
    assert.equal(
      result.viewData.paymentInformation.lastName.htmlName,
      pixFields.lastName.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.docType.value,
      pixFields.docTypePix.value
    );
    assert.equal(
      result.viewData.paymentInformation.docType.htmlName,
      pixFields.docTypePix.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      pixFields.docNumberPix.value
    );
    assert.equal(
      result.viewData.paymentInformation.docNumber.htmlName,
      pixFields.docNumberPix.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.paymentMethod.value,
      PAYMENT_METHOD
    );
  });

  it("should return an object with field errors", () => {
    const pixFields = paymentDataUtil.getFormPix();
    pixFields.docNumberPix.value = "123";

    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      pixFields: pixFields
    };
    const req = {};
    const viewFormData = {};

    const result = processFormPix(req, paymentForm, viewFormData);

    assert.equal(result.error, true);
    assert.equal(Object.keys(result.fieldErrors).length, 1);
    assert.equal(
      Object.keys(result.fieldErrors)[0],
      pixFields.docNumberPix.htmlName
    );
    assert.equal(
      result.fieldErrors.dwfrm_billing_pixFields_docNumberPix,
      "error.324-mercadopago"
    );
  });
});

describe("Hook MERCADOPAGO_PAYMENTS middleware processFormPix alphanumeric CNPJ test", () => {
  // Use the real MercadopagoUtil to exercise validation + normalization end-to-end in the pix flow
  const realMercadopagoUtil = proxyquire(
    "*/../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoUtil.js",
    {
      "dw/web/Resource": importsUtil.Resource,
      "dw/system/Site": importsUtil.Site
    }
  );
  const processFormPix = proxyquire(hookPath, {
    "dw/web/Resource": importsUtil.Resource,
    "*/cartridge/scripts/util/MercadopagoUtil": realMercadopagoUtil,
    "*/cartridge/scripts/formErrors": importsUtil.FormErrors
  });

  it("should validate and normalize an alphanumeric CNPJ in the pix flow (raw, no mask)", () => {
    const pixFields = paymentDataUtil.getFormPix();
    pixFields.docTypePix.value = "CNPJ";
    pixFields.docTypePix.htmlValue = "CNPJ";
    pixFields.docNumberPix.value = "12.ABC.345/01DE-35";

    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      pixFields: pixFields
    };
    const result = processFormPix({}, paymentForm, {});

    assert.equal(result.error, false);
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      "12ABC34501DE35"
    );
  });

  it("should reject an alphanumeric CNPJ with wrong check digits in the pix flow", () => {
    const pixFields = paymentDataUtil.getFormPix();
    pixFields.docTypePix.value = "CNPJ";
    pixFields.docTypePix.htmlValue = "CNPJ";
    pixFields.docNumberPix.value = "12.ABC.345/01DE-99";

    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      pixFields: pixFields
    };
    const result = processFormPix({}, paymentForm, {});

    assert.equal(result.error, true);
    assert.equal(
      Object.keys(result.fieldErrors)[0],
      pixFields.docNumberPix.htmlName
    );
  });

  it("should normalize a masked CPF to raw digits in the pix flow", () => {
    const pixFields = paymentDataUtil.getFormPix();
    pixFields.docTypePix.value = "CPF";
    pixFields.docTypePix.htmlValue = "CPF";
    pixFields.docNumberPix.value = "123.456.789-09";

    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      pixFields: pixFields
    };
    const result = processFormPix({}, paymentForm, {});

    assert.equal(result.error, false);
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      "12345678909"
    );
  });
});
