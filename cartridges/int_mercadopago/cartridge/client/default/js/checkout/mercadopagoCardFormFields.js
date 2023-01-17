const fields = [
  {
    mpName: "cardholderName",
    mpFieldErrorCode: ["221", "316"],
    fieldId: "cardOwner",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.cardholder"]
  },
  {
    mpName: "cardholderEmail",
    mpFieldErrorCode: ["email", "145", "150", "151"],
    fieldId: "email",
    fieldPlaceHolder: "E-mail"
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
    mpName: "securityCode",
    mpFieldErrorCode: ["224", "E203"],
    fieldId: "securityCode",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.securitycode"]
  },
  {
    mpName: "installments",
    mpFieldErrorCode: ["installments"],
    fieldId: "installments",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.installments"]
  },
  {
    mpName: "identificationType",
    mpFieldErrorCode: ["212", "322"],
    fieldId: "docType",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.doctype"]
  },
  {
    mpName: "identificationNumber",
    mpFieldErrorCode: ["214", "324"],
    fieldId: "docNumber",
    fieldPlaceHolder: $(".mp-text-messages").data("mpTextMessages")["field.docnumber"]
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
