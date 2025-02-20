const assert = require("assert");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const importsUtil = require("../../../mocks/util/importsUtil");

const scriptPath = "*/../../cartridges/int_mercadopago/cartridge/scripts/util/MercadopagoUtil.js";

const proxyquireObject = {
  "dw/web/Resource": importsUtil.Resource,
  "dw/system/Site": importsUtil.Site
};

describe("Scripts utilities MercadopagoUtil test function validateCnpj", () => {
  const MercadopagoUtil = proxyquire(scriptPath, proxyquireObject);

  it("should return that the cnpj is valid", () => {
    const cnpjNumber = "65269223000102";

    const result = MercadopagoUtil.validateCnpj(cnpjNumber);

    assert.equal(result, true);
  });

  it("should return false because cnpj can't be empty", () => {
    const cnpjNumber = "";

    const result = MercadopagoUtil.validateCnpj(cnpjNumber);

    assert.equal(result, false);
  });

  it("should return false because cnpj can't be the same numbers", () => {
    const cnpjNumber = "11111111111111";

    const result = MercadopagoUtil.validateCnpj(cnpjNumber);

    assert.equal(result, false);
  });

  it("should return false because it's wrong cnpj", () => {
    const cnpjNumber = "12345678912345";

    const result = MercadopagoUtil.validateCnpj(cnpjNumber);

    assert.equal(result, false);
  });

  it("should return false because cnpj cannot be more than 14 digits", () => {
    const cnpjNumber = "123456789123456";

    const result = MercadopagoUtil.validateCnpj(cnpjNumber);

    assert.equal(result, false);
  });

  it("should return false because cnpj cannot be less than 14 digits", () => {
    const cnpjNumber = "1234567891234";

    const result = MercadopagoUtil.validateCnpj(cnpjNumber);

    assert.equal(result, false);
  });
});

describe("Scripts utilities MercadopagoUtil test function validateCpf", () => {
  const MercadopagoUtil = proxyquire(scriptPath, proxyquireObject);

  it("should return that the cpf is valid", () => {
    const cpfNumber = "12345678909";

    const result = MercadopagoUtil.validateCpf(cpfNumber);

    assert.equal(result, true);
  });

  it("should return false because cpf can't be empty", () => {
    const cpfNumber = "";

    const result = MercadopagoUtil.validateCpf(cpfNumber);

    assert.equal(result, false);
  });

  it("should return false because cpf can't be the same numbers", () => {
    const cpfNumber = "11111111111";

    const result = MercadopagoUtil.validateCpf(cpfNumber);

    assert.equal(result, false);
  });

  it("should return false because it's wrong cpf", () => {
    const cpfNumber = "12345678912";

    const result = MercadopagoUtil.validateCpf(cpfNumber);

    assert.equal(result, false);
  });

  it("should return false because cpf cannot be more than 11 digits", () => {
    const cpfNumber = "123456789099";

    const result = MercadopagoUtil.validateCpf(cpfNumber);

    assert.equal(result, false);
  });

  it("should return false because cpf cannot be less than 11 digits", () => {
    const cpfNumber = "1234567890";

    const result = MercadopagoUtil.validateCpf(cpfNumber);

    assert.equal(result, false);
  });
});

describe("Scripts utilities MercadopagoUtil test function sortMethodsOff", () => {
  const MercadopagoUtil = proxyquire(scriptPath, proxyquireObject);

  it("should return the sorted array if all options have sort attribute", () => {
    const methodsOff = importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_WITH_SORT;

    const result = MercadopagoUtil.sortMethodsOff(methodsOff);

    assert.deepEqual(result, importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_WITH_SORT_SORTED);
  });

  it("should return the sorted array with options without sort attribute at the end", () => {
    const methodsOff = importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_SOME_WITHOUT_SORT;

    const result = MercadopagoUtil.sortMethodsOff(methodsOff);

    assert.deepEqual(
      result,
      importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_SOME_WITHOUT_SORT_SORTED
    );
  });

  it("should return the sorted array with options with sort attribute null at the end", () => {
    const methodsOff = importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_WITH_NULL_SORT;

    const result = MercadopagoUtil.sortMethodsOff(methodsOff);

    assert.deepEqual(result, importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_WITH_NULL_SORT_SORTED);
  });

  it("should return the array with same order if no option has sort attribute", () => {
    const methodsOff = importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_ALL_WITHOUT_SORT;

    const result = MercadopagoUtil.sortMethodsOff(methodsOff);

    assert.deepEqual(result, importsUtil.MercadopagoHelpers.PAYMENT_OPTIONS_ALL_WITHOUT_SORT);
  });

  it("should return message expiration to methods off payments", () => {
    const fullDate = "Sat May 18 2024 13:18:29 GMT-0000 (GMT)";
    const date = new Date(fullDate);

    const result = MercadopagoUtil.GetFormatedDateToExpirationField(date);

    assert.notEqual(result, null);
  });
});

describe("Scripts utilities MercadopagoUtil test function extractInstallments", () => {
  const MercadopagoUtil = proxyquire(scriptPath, proxyquireObject);

  it("should extract installments from response object", () => {
    const response = importsUtil.MercadopagoHelpers.INSTALLMENTS_RESPONSE;
    const expected = importsUtil.MercadopagoUtil.INSTALLMENTS;

    const result = MercadopagoUtil.extractInstallments(response);

    assert.deepEqual(result, expected);
  });

  it("should return empty array if object is empty", () => {
    const response = [];
    const expected = [];

    const result = MercadopagoUtil.extractInstallments(response);

    assert.deepEqual(result, expected);
  });
});
