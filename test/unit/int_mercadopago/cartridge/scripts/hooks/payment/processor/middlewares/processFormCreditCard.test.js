const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../../../../mocks/util/importsUtil");
const paymentDataUtil = require("../../../../../../mocks/util/paymentDataUtil");

const hookPath =
  "*/../../cartridges/int_mercadopago/cartridge/scripts/hooks/payment/processor/middlewares/processFormCreditCard.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "*/cartridge/scripts/util/MercadopagoUtil": importsUtil.MercadopagoUtil,
  "*/cartridge/scripts/util/array": importsUtil.array,
  "*/cartridge/scripts/checkout/checkoutHelpers": importsUtil.checkoutHelpers
};

const PAYMENT_METHOD = "CREDIT_CARD";

describe("Hook MERCADOPAGO_PAYMENTS middleware processFormCreditCard test", () => {
  const processFormCreditCard = proxyquire(hookPath, proxyquireObject);

  it("should return an object without error", () => {
    const creditCardFields = paymentDataUtil.getFormCreditCard();
    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      creditCardFields: creditCardFields
    };
    const req = {
      form: {
        storedPaymentUUID: false,
        securityCode: "securityCode"
      },
      currentCustomer: {
        raw: {
          authenticated: true,
          registered: true
        }
      },
      wallet: {}
    };
    const viewFormData = {};
    const result = processFormCreditCard(req, paymentForm, viewFormData);

    assert.equal(result.error, false);
    assert.equal(result.viewData.paymentMethod.value, PAYMENT_METHOD);
    assert.equal(
      result.viewData.paymentInformation.cardType.value,
      creditCardFields.cardType.value
    );
    assert.equal(
      result.viewData.paymentInformation.cardType.htmlName,
      creditCardFields.cardType.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.cardNumber.value,
      creditCardFields.cardNumber.value
    );
    assert.equal(
      result.viewData.paymentInformation.cardNumber.htmlName,
      creditCardFields.cardNumber.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.securityCode.value,
      creditCardFields.securityCode.value
    );
    assert.equal(
      result.viewData.paymentInformation.securityCode.htmlName,
      creditCardFields.securityCode.htmlName
    );
    assert.equal(result.viewData.paymentInformation.expirationMonth.value, 7);
    assert.equal(
      result.viewData.paymentInformation.expirationMonth.htmlName,
      creditCardFields.expirationMonth.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.expirationYear.value,
      creditCardFields.expirationYear.value
    );
    assert.equal(
      result.viewData.paymentInformation.expirationYear.htmlName,
      creditCardFields.expirationYear.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.token.value,
      creditCardFields.cardToken.value
    );
    assert.equal(
      result.viewData.paymentInformation.token.htmlName,
      creditCardFields.cardToken.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.docType.value,
      creditCardFields.docType.value
    );
    assert.equal(
      result.viewData.paymentInformation.docType.htmlName,
      creditCardFields.docType.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      creditCardFields.docNumber.value
    );
    assert.equal(
      result.viewData.paymentInformation.docNumber.htmlName,
      creditCardFields.docNumber.htmlName
    );
    assert.equal(
      result.viewData.paymentInformation.email.value,
      creditCardFields.email.value
    );
    assert.equal(
      result.viewData.paymentInformation.saveCard.value,
      creditCardFields.saveCard.checked
    );
    assert.equal(
      result.viewData.paymentInformation.paymentMethod.value,
      PAYMENT_METHOD
    );
  });

  it("should return an object without error for new card ignoring invalid saved card installments", () => {
    const creditCardFields = paymentDataUtil.getFormCreditCard();
    const savedCreditCardFields = paymentDataUtil.getFormSavedCreditCard();
    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      creditCardFields: creditCardFields,
      savedCreditCardFields: savedCreditCardFields
    };
    const req = {
      form: {
        storedPaymentUUID: false,
        securityCode: "securityCode"
      },
      currentCustomer: {
        raw: {
          authenticated: true,
          registered: true
        }
      },
      wallet: {}
    };
    const viewFormData = {};
    const result = processFormCreditCard(req, paymentForm, viewFormData);

    assert.equal(result.error, false);
  });

  it("should return an object with field errors", () => {
    const creditCardFields = paymentDataUtil.getFormCreditCard();
    creditCardFields.docNumber.value = "123";

    const paymentForm = {
      paymentMethod: {
        value: PAYMENT_METHOD,
        htmlName: ""
      },
      creditCardFields: creditCardFields
    };
    const req = {
      form: {
        storedPaymentUUID: true,
        securityCode: ""
      },
      currentCustomer: {
        raw: {
          authenticated: false,
          registered: false
        }
      },
      wallet: {}
    };
    const viewFormData = {};

    const result = processFormCreditCard(req, paymentForm, viewFormData);

    assert.equal(result.error, true);
    assert.equal(Object.keys(result.fieldErrors).length, 1);
    assert.equal(
      Object.keys(result.fieldErrors)[0],
      creditCardFields.docNumber.htmlName
    );
    assert.equal(
      result.fieldErrors.dwfrm_billing_creditCardFields_docNumber,
      "error.324-mercadopago"
    );
  });
});

describe("Hook MERCADOPAGO_PAYMENTS middleware processFormCreditCard alphanumeric CNPJ test", () => {
  // Use the real MercadopagoUtil to exercise validation + normalization end-to-end
  const realMercadopagoUtil = proxyquire(
    "*/../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoUtil.js",
    {
      "dw/web/Resource": importsUtil.Resource,
      "dw/system/Site": importsUtil.Site
    }
  );
  const processFormCreditCard = proxyquire(hookPath, {
    "dw/web/Resource": importsUtil.Resource,
    "*/cartridge/scripts/util/MercadopagoUtil": realMercadopagoUtil,
    "*/cartridge/scripts/util/array": importsUtil.array,
    "*/cartridge/scripts/checkout/checkoutHelpers": importsUtil.checkoutHelpers
  });

  const req = {
    form: { storedPaymentUUID: false, securityCode: "securityCode" },
    currentCustomer: { raw: { authenticated: true, registered: true } },
    wallet: {}
  };

  it("should validate and normalize an alphanumeric CNPJ in the credit card flow (raw, no mask)", () => {
    const creditCardFields = paymentDataUtil.getFormCreditCard();
    creditCardFields.docType.value = "CNPJ";
    creditCardFields.docType.htmlValue = "CNPJ";
    creditCardFields.docNumber.value = "12.ABC.345/01DE-35";

    const paymentForm = {
      paymentMethod: { value: PAYMENT_METHOD, htmlName: "" },
      creditCardFields: creditCardFields
    };
    const result = processFormCreditCard(req, paymentForm, {});

    assert.equal(result.error, false);
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      "12ABC34501DE35"
    );
  });

  it("should reject an alphanumeric CNPJ with wrong check digits in the credit card flow", () => {
    const creditCardFields = paymentDataUtil.getFormCreditCard();
    creditCardFields.docType.value = "CNPJ";
    creditCardFields.docType.htmlValue = "CNPJ";
    creditCardFields.docNumber.value = "12.ABC.345/01DE-99";

    // storedPaymentUUID: true bypasses the mocked validateCreditCard call (which would
    // return "" and clear fieldErrors). This keeps fieldErrors as a plain object so the
    // docNumber validation error persists. If processFormCreditCard ever stops skipping
    // card validation for stored UUIDs, this test will need a different approach.
    const reqStored = {
      form: { storedPaymentUUID: true, securityCode: "securityCode" },
      currentCustomer: { raw: { authenticated: true, registered: true } },
      wallet: {}
    };
    const paymentForm = {
      paymentMethod: { value: PAYMENT_METHOD, htmlName: "" },
      creditCardFields: creditCardFields
    };
    const result = processFormCreditCard(reqStored, paymentForm, {});

    assert.equal(result.error, true);
    assert.equal(Object.keys(result.fieldErrors).length, 1);
    assert.equal(
      Object.keys(result.fieldErrors)[0],
      creditCardFields.docNumber.htmlName
    );
  });

  it("should normalize a masked CPF to raw digits in the credit card flow", () => {
    const creditCardFields = paymentDataUtil.getFormCreditCard();
    creditCardFields.docType.value = "CPF";
    creditCardFields.docType.htmlValue = "CPF";
    creditCardFields.docNumber.value = "123.456.789-09";

    const paymentForm = {
      paymentMethod: { value: PAYMENT_METHOD, htmlName: "" },
      creditCardFields: creditCardFields
    };
    const result = processFormCreditCard(req, paymentForm, {});

    assert.equal(result.error, false);
    assert.equal(
      result.viewData.paymentInformation.docNumber.value,
      "12345678909"
    );
  });
});
