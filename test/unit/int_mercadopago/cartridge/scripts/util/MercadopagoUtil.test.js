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

  // Data-driven matrix: numeric / alphanumeric (upper, lower, mixed) x with / without mask
  const validateCnpjCases = [
    // --- valid: numeric ---
    { input: "65269223000102", expected: true, desc: "numeric without mask" },
    { input: "11222333000181", expected: true, desc: "numeric without mask (reference)" },
    { input: "11.222.333/0001-81", expected: true, desc: "numeric with mask" },
    // --- valid: alphanumeric uppercase (SERPRO reference, DV 35) ---
    { input: "12ABC34501DE35", expected: true, desc: "alphanumeric uppercase without mask" },
    { input: "12.ABC.345/01DE-35", expected: true, desc: "alphanumeric uppercase with mask" },
    // --- valid: alphanumeric lowercase (normalized to uppercase) ---
    { input: "12abc34501de35", expected: true, desc: "alphanumeric lowercase without mask" },
    { input: "12.abc.345/01de-35", expected: true, desc: "alphanumeric lowercase with mask" },
    // --- valid: alphanumeric mixed case ---
    { input: "12aBc34501dE35", expected: true, desc: "alphanumeric mixed case without mask" },
    { input: "12.aBc.345/01dE-35", expected: true, desc: "alphanumeric mixed case with mask" },
    // --- invalid ---
    { input: "", expected: false, desc: "empty string" },
    { input: "11111111111111", expected: false, desc: "repeated digits" },
    { input: "AAAAAAAAAAAAAA", expected: false, desc: "repeated letters" },
    { input: "12345678912345", expected: false, desc: "numeric with wrong check digits" },
    { input: "12.ABC.345/01DE-99", expected: false, desc: "alphanumeric with wrong check digits" },
    { input: "123456789123456", expected: false, desc: "more than 14 characters" },
    { input: "1234567891234", expected: false, desc: "fewer than 14 characters" },
    { input: "12ABC3450001A1", expected: false, desc: "letter in a check-digit position" }
  ];

  validateCnpjCases.forEach((testCase) => {
    it(`should return ${testCase.expected} for ${testCase.desc} (${testCase.input || "<empty>"})`, () => {
      assert.equal(MercadopagoUtil.validateCnpj(testCase.input), testCase.expected);
    });
  });
});

describe("Scripts utilities MercadopagoUtil test function formatCnpj", () => {
  const MercadopagoUtil = proxyquire(scriptPath, proxyquireObject);

  const formatCnpjCases = [
    { input: "12ABC34501DE35", expected: "12.ABC.345/01DE-35", desc: "raw alphanumeric uppercase" },
    { input: "12abc34501de35", expected: "12.ABC.345/01DE-35", desc: "raw alphanumeric lowercase (uppercased)" },
    { input: "12aBc34501dE35", expected: "12.ABC.345/01DE-35", desc: "raw alphanumeric mixed case (uppercased)" },
    { input: "11222333000181", expected: "11.222.333/0001-81", desc: "raw numeric (no regression)" },
    { input: "12.ABC.345/01DE-35", expected: "12.ABC.345/01DE-35", desc: "already masked (idempotent)" }
  ];

  formatCnpjCases.forEach((testCase) => {
    it(`should mask ${testCase.desc} (${testCase.input})`, () => {
      assert.equal(MercadopagoUtil.formatCnpj(testCase.input), testCase.expected);
    });
  });
});

describe("Scripts utilities MercadopagoUtil test function validateDocument", () => {
  const MercadopagoUtil = proxyquire(scriptPath, proxyquireObject);

  // validateDocument returns the raw, unmasked, uppercase value sent to the API (or false)
  const validateDocumentCases = [
    { input: "12.ABC.345/01DE-35", type: "CNPJ", expected: "12ABC34501DE35", desc: "CNPJ alphanumeric masked -> raw uppercase" },
    { input: "12ABC34501DE35", type: "CNPJ", expected: "12ABC34501DE35", desc: "CNPJ alphanumeric raw -> raw" },
    { input: "12.abc.345/01de-35", type: "CNPJ", expected: "12ABC34501DE35", desc: "CNPJ alphanumeric lowercase -> raw uppercase" },
    { input: "11.222.333/0001-81", type: "CNPJ", expected: "11222333000181", desc: "CNPJ numeric masked -> raw" },
    { input: "123.456.789-09", type: "CPF", expected: "12345678909", desc: "CPF masked -> raw" },
    { input: "12.ABC.345/01DE-99", type: "CNPJ", expected: false, desc: "invalid CNPJ -> false" }
  ];

  validateDocumentCases.forEach((testCase) => {
    it(`should handle ${testCase.desc} (${testCase.input})`, () => {
      const result = MercadopagoUtil.validateDocument(testCase.input, testCase.type);
      assert.equal(result, testCase.expected);
    });
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
