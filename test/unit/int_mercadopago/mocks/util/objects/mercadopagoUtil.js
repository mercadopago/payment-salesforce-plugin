const mercadopagoHelpers = require("./mercadopagoHelpers");
const Resource = require("./resource");

module.exports = {
  validateDocument: (value) => (value === "12345678909" ? value : false),
  PAYMENT_METHOD: {
    credit_card: "CREDIT_CARD",
    pix: "PIX",
    methods_off: "METHODS_OFF"
  },
  getTotalAmount: () => 149.99,
  parseOrderStatus: () => "pending",
  sortMethodsOff2: (options) => (
    options[0].id === "pec"
      ? mercadopagoHelpers.PAYMENT_METHODS_WITHOUT_PIX
      : mercadopagoHelpers.PAYMENT_METHODS_WITH_OFF_UNSORTED
  ),
  sortMethodsOff: (options) => {
    switch (options[0].id) {
      case "pec":
        return mercadopagoHelpers.PAYMENT_METHODS_WITHOUT_PIX;
      case "clabe":
        return mercadopagoHelpers.PAYMENT_METHODS_WITH_OFF_UNSORTED;
      case "rapipago":
        return mercadopagoHelpers.PAYMENT_METHODS_NO_PLACES_UNSORTED;
      default:
        return null;
    }
  },
  validateAndReturnAttribute: (value) => (true),
  GetFormatedDateToExpirationField: (value) => Resource.msgf("methodsoff.invoice.msg", "mercadopago", null, "May", "12", "11 pm"),
  INSTALLMENTS: [
    {
      installments: 1,
      installment_rate: 0,
      labels: [],
      min_allowed_amount: 0,
      max_allowed_amount: 100000,
      recommended_message: "Sin interés",
      installment_amount: 100000,
      total_amount: 100000
    },
    {
      installments: 2,
      installment_rate: 0,
      labels: [],
      min_allowed_amount: 100001,
      max_allowed_amount: 200000,
      recommended_message: "Sin interés",
      installment_amount: 100000,
      total_amount: 200000
    }
  ],
  extractInstallments: () => ([
    {
      installments: 1,
      installment_rate: 0,
      labels: [],
      min_allowed_amount: 0,
      max_allowed_amount: 100000,
      recommended_message: "Sin interés",
      installment_amount: 100000,
      total_amount: 100000
    },
    {
      installments: 2,
      installment_rate: 0,
      labels: [],
      min_allowed_amount: 100001,
      max_allowed_amount: 200000,
      recommended_message: "Sin interés",
      installment_amount: 100000,
      total_amount: 200000
    }
  ])
};
