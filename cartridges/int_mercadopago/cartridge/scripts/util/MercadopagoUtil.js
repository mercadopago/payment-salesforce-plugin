const Resource = require("dw/web/Resource");

function MercadopagoUtil() {}

MercadopagoUtil.prototype.PAYMENT_METHOD = {
  credit_card: "CREDIT_CARD",
  pix: "PIX",
  checkout_pro: "CHECKOUT_PRO"
};

MercadopagoUtil.prototype.DOCUMENT_TYPE = {
  cpf: "CPF",
  cnpj: "CNPJ"
};

/**
 * Return specific menssage for same error
 * @returns {Object} custom message
 */
MercadopagoUtil.prototype.getErrorMessages = () => ({
  106: Resource.msg("error.106", "mercadopago", null),
  109: Resource.msg("error.109", "mercadopago", null),
  126: Resource.msg("error.126", "mercadopago", null),
  129: Resource.msg("error.129", "mercadopago", null),
  145: Resource.msg("error.145", "mercadopago", null),
  150: Resource.msg("error.150", "mercadopago", null),
  151: Resource.msg("error.151", "mercadopago", null),
  160: Resource.msg("error.160", "mercadopago", null),
  204: Resource.msg("error.204", "mercadopago", null),
  205: Resource.msg("error.205", "mercadopago", null),
  208: Resource.msg("error.208", "mercadopago", null),
  209: Resource.msg("error.209", "mercadopago", null),
  212: Resource.msg("error.212", "mercadopago", null),
  214: Resource.msg("error.214", "mercadopago", null),
  220: Resource.msg("error.220", "mercadopago", null),
  221: Resource.msg("error.221", "mercadopago", null),
  224: Resource.msg("error.224", "mercadopago", null),
  E203: Resource.msg("error.E203", "mercadopago", null),
  E301: Resource.msg("error.E301", "mercadopago", null),
  E302: Resource.msg("error.E302", "mercadopago", null),
  301: Resource.msg("error.301", "mercadopago", null),
  316: Resource.msg("error.316", "mercadopago", null),
  322: Resource.msg("error.322", "mercadopago", null),
  323: Resource.msg("error.323", "mercadopago", null),
  324: Resource.msg("error.324", "mercadopago", null),
  325: Resource.msg("error.325", "mercadopago", null),
  326: Resource.msg("error.326", "mercadopago", null),
  E205: Resource.msg("error.E205", "mercadopago", null),
  801: Resource.msg("error.801", "mercadopago", null),
  default: Resource.msg("error.default", "mercadopago", null),
  email: Resource.msg("error.email", "mercadopago", null),
  installments: Resource.msg("error.installments", "mercadopago", null),
  issuer: Resource.msg("error.issuer", "mercadopago", null)
});

/**
 * Return field names for Mercado Pago
 * @returns {Object} custom message
 */
MercadopagoUtil.prototype.getTextMessages = () => ({
  "field.doctype": Resource.msg("mercadopago.field.doctype", "mercadopago", null),
  "field.docnumber": Resource.msg("mercadopago.field.docnumber", "mercadopago", null),
  "field.card.number": Resource.msg("mercadopago.field.card.number", "mercadopago", null),
  "field.cardholder": Resource.msg("mercadopago.field.cardholder", "mercadopago", null),
  "field.securitycode": Resource.msg("mercadopago.field.securitycode", "mercadopago", null),
  "field.month": Resource.msg("mercadopago.field.month", "mercadopago", null),
  "field.year": Resource.msg("mercadopago.field.year", "mercadopago", null),
  "field.installments": Resource.msg("mercadopago.field.installments", "mercadopago", null),
  "field.issuer": Resource.msg("mercadopago.field.issuer", "mercadopago", null)
});

/**
 * Convert a Mercadopago order status into Salesforce order status
 * @param {String} status - mercadopago stauts order
 * @returns {String} salesforce order status
 */
MercadopagoUtil.prototype.parseOrderStatus = (status) => {
  const pendingStatuses = {
    pending: "pending",
    in_process: "pending",
    in_mediation: "pending"
  };
  const approvedStatuses = {
    approved: "authorized",
    authorized: "authorized"
  };
  const rejectedStatuses = {
    rejected: "declined",
    cancelled: "declined"
  };
  const refundedStatuses = {
    refunded: "refunded",
    charged_back: "refunded"
  };

  if (pendingStatuses[status]) {
    return pendingStatuses[status];
  }
  if (approvedStatuses[status]) {
    return approvedStatuses[status];
  }
  if (rejectedStatuses[status]) {
    return rejectedStatuses[status];
  }
  if (refundedStatuses[status]) {
    return refundedStatuses[status];
  }
  return "";
};

/**
 * Calculates the total amout of order
 */
MercadopagoUtil.prototype.getTotalAmount = (lineItemCtnr) => {
  let totalAmount = lineItemCtnr.getTotalGrossPrice();

  lineItemCtnr
    .getGiftCertificatePaymentInstruments()
    .toArray()
    .forEach((item) => {
      if (item.paymentTransaction && item.paymentTransaction.amount) {
        totalAmount = totalAmount.subtract(item.paymentTransaction.amount);
      }
    });

  return totalAmount;
};

MercadopagoUtil.prototype.validateDocument = (docNumber, docType) => {
  let valid = true;
  if (docNumber) {
    let newDocNumber = docNumber;
    if (docType === MercadopagoUtil.prototype.DOCUMENT_TYPE.cpf) {
      newDocNumber = MercadopagoUtil.prototype.formatCpf(docNumber);
      valid = MercadopagoUtil.prototype.validateCpf(newDocNumber);
    } else if (docType === MercadopagoUtil.prototype.DOCUMENT_TYPE.cnpj) {
      newDocNumber = MercadopagoUtil.prototype.formatCnpj(docNumber);
      valid = MercadopagoUtil.prototype.validateCnpj(newDocNumber);
    }

    if (valid) {
      return newDocNumber;
    }
  }
  return valid;
};

/**
 * Applies mask to some CPF
 * @param {String} value - cpf
 * @returns {String} cpf with mask
 */
MercadopagoUtil.prototype.formatCpf = (value) => {
  // Removes everything that is not digit
  let cpf = value.replace(/\D/g, "");

  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  return cpf;
};

/**
 * Applies mask to some CNPJ
 * @param {String} value - cnpj
 * @returns {String} cpnj with mask
 */
MercadopagoUtil.prototype.formatCnpj = (value) => {
  // Removes everything that is not digit
  let cnpj = value.replace(/\D/g, "");

  cnpj = cnpj.replace(/^(\d{2})(\d)/, "$1.$2");
  cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  cnpj = cnpj.replace(/\.(\d{3})(\d)/, ".$1/$2");
  cnpj = cnpj.replace(/(\d{4})(\d)/, "$1-$2");

  return cnpj;
};

function sameDigitsIsNotValid(value) {
  return value.split("").every((char) => char === value[0]);
}

function calculationCnpjNumbers(numbers, x) {
  const slice = numbers.slice(0, x);
  let factor = x - 7;
  let amount = 0;

  for (let i = x; i >= 1; i--) {
    const n = slice[x - i];
    amount += n * factor;
    factor -= 1;
    if (factor < 2) {
      factor = 9;
    }
  }

  const result = 11 - (amount % 11);

  return result > 9 ? 0 : result;
}

/**
 * Verifies if a string is a cnpj
 * @returns {Boolean} true if a valid cnpj
 */
MercadopagoUtil.prototype.validateCnpj = (cnpj) => {
  const strCNPJ = cnpj.replace(/[^\d]+/g, "");

  if (strCNPJ.length !== 14) {
    return false;
  }

  if (sameDigitsIsNotValid(strCNPJ)) {
    return false;
  }

  const lastTwoDigitsCheckers = strCNPJ.slice(12);

  const firstCheckDigit = calculationCnpjNumbers(strCNPJ, 12);
  if (Number(firstCheckDigit) !== Number(lastTwoDigitsCheckers[0])) {
    return false;
  }

  const secondCheckDigit = calculationCnpjNumbers(strCNPJ, 13);
  if (Number(secondCheckDigit) !== Number(lastTwoDigitsCheckers[1])) {
    return false;
  }

  return true;
};

function calculationCpfNumbers(strCPF, x) {
  let amount = 0;

  for (let i = 1; i <= x - 2; i++) {
    amount += Number(strCPF.substring(i - 1, i)) * (x - i);
  }

  let remaining = (amount * 10) % 11;

  if (remaining === 10 || remaining === 11) {
    remaining = 0;
  }

  return remaining;
}

/**
 * Verifies if a string is a cpf
 * @returns {Boolean} true if a valid cpf
 */
MercadopagoUtil.prototype.validateCpf = (cpf) => {
  const strCPF = cpf.replace(/[.-\s]/g, "");

  if (strCPF.length !== 11) {
    return false;
  }

  if (sameDigitsIsNotValid(strCPF)) {
    return false;
  }

  const lastTwoDigitsCheckers = strCPF.slice(9);

  const firstCheckDigit = calculationCpfNumbers(strCPF, 11);
  if (Number(firstCheckDigit) !== Number(lastTwoDigitsCheckers[0])) {
    return false;
  }

  const secondCheckDigit = calculationCpfNumbers(strCPF, 12);
  if (Number(secondCheckDigit) !== Number(lastTwoDigitsCheckers[1])) {
    return false;
  }

  return true;
};

module.exports = new MercadopagoUtil();
