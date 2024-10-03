const fields = [
  {
    mpName: "savedSecurityCode",
    mpFieldErrorCode: ["224", "E203"],
    fieldId: "savedSecurityCode",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.securitycode"]
  },
  {
    mpName: "savedInstallments",
    mpFieldErrorCode: ["installments"],
    fieldId: "savedInstallments",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.installments"],
    itensText: $(".mp-text-messages").data("mpTextMessages")["field.installments.itensText"]
  },
  {
    mpName: "expirationMonth",
    mpFieldErrorCode: ["208", "325", "301"],
    fieldId: "expirationMonth",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.month"]
  },
  {
    mpName: "expirationYear",
    mpFieldErrorCode: ["209", "326", "301", "E205"],
    fieldId: "expirationYear",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.year"]
  },
  {
    mpName: "cardNumber",
    mpFieldErrorCode: [
      "205",
      "E301",
      "106",
      "109",
      "126",
      "129",
      "160",
      "204",
      "801"
    ],
    fieldId: "cardNumber",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.card.number"]
  },
  {
    mpName: "cardholderName",
    mpFieldErrorCode: ["221", "316"],
    fieldId: "cardOwner",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.cardholder"]
  },
  {
    mpName: "issuer",
    mpFieldErrorCode: ["issuer", "220"],
    fieldId: "issuer",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.issuer"]
  }
];

function getAllFields() {
  return fields;
}

function getFieldByMpName(mpName) {
  return fields.find((field) => field.mpName === mpName);
}

function getFieldByFieldCode(code) {
  return fields.filter((field) => field.mpFieldErrorCode.indexOf(code) !== -1);
}

module.exports = {
  getAllFields: getAllFields,
  getFieldByMpName: getFieldByMpName,
  getFieldByFieldCode: getFieldByFieldCode
};
