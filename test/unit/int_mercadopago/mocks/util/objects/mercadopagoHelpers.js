module.exports = {
  createPaymentPayload: () => ({}),
  payments: {
    create: () => ({
      id: "1234567890",
      status: "pending",
      status_detail: "pending",
      point_of_interaction: {
        transaction_data: {
          qr_code: "qr_code",
          qr_code_base64: "qr_code_base64"
        }
      }
    })
  },
  createPreferencePayload: () => ({}),
  preference: {
    create: () => ({
      id: "1234567890",
      status: "pending",
      status_detail: "pending",
      point_of_interaction: {
      }
    }),
    createRedirectingToCredits: () => ({
      id: "1234567890",
      status: "pending",
      status_detail: "pending",
      point_of_interaction: {
      }
    })
  },
  PAYMENT_METHODS_WITH_OFF: [
    {
      id: "debmaster",
      name: "Mastercard Débito",
      payment_type_id: "debit_card",
      status: "active"
    },
    {
      id: "clabe",
      name: "STP",
      payment_type_id: "bank_transfer",
      status: "active"
    },
    {
      id: "master",
      name: "Mastercard",
      payment_type_id: "credit_card",
      status: "active"
    },
    {
      id: "paycash",
      name: "PayCash",
      payment_type_id: "ticket",
      payment_places: [
        {
          name: "7  Eleven",
          payment_option_id: "7eleven",
          status: "active"
        }
      ],
      status: "active"
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active"
    },
    {
      id: "consumer_credits",
      name: "Mercado Crédito",
      payment_type_id: "digital_currency"
    }
  ],
  PAYMENT_METHODS_WITH_OFF_INACTIVE: [
    {
      id: "clabe",
      name: "STP",
      payment_type_id: "bank_transfer",
      status: "deactive"
    },
    {
      id: "master",
      name: "Mastercard",
      payment_type_id: "credit_card",
      status: "temporally_deactive"
    }
  ],
  PAYMENT_METHODS_WITH_OFF_UNSORTED: [
    {
      id: "clabe",
      name: "STP",
      payment_type_id: "bank_transfer",
      status: "active"
    },
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active"
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active"
    }
  ],
  PAYMENT_METHODS_WITHOUT_OFF: [
    {
      id: "debmaster",
      name: "Mastercard Débito",
      payment_type_id: "debit_card",
      status: "active"
    },
    {
      id: "master",
      name: "Mastercard",
      payment_type_id: "credit_card",
      status: "active"
    },
    {
      id: "consumer_credits",
      name: "Mercado Crédito",
      payment_type_id: "digital_currency"
    }
  ],
  PAYMENT_METHODS_WITH_PIX: [
    {
      id: "pix",
      name: "PIX",
      payment_type_id: "bank_transfer",
      status: "active"
    },
    {
      id: "master",
      name: "Mastercard",
      payment_type_id: "credit_card",
      status: "active"
    },
    {
      id: "pec",
      name: "Pagamento na lotérica sem boleto",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "bolbradeesco",
      name: "Boleto",
      payment_type_id: "ticket",
      status: "active"
    }
  ],
  PAYMENT_METHODS_WITHOUT_PIX: [
    {
      id: "pec",
      name: "Pagamento na lotérica sem boleto",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "bolbradeesco",
      name: "Boleto",
      payment_type_id: "ticket",
      status: "active"
    }
  ],
  PAYMENT_METHODS_NO_PLACES: [
    {
      id: "rapipago",
      name: "Rapipago",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "pagofacil",
      name: "Pago Fácil",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "diners",
      name: "Diners",
      payment_type_id: "credit_card",
      status: "active"
    }
  ],
  PAYMENT_METHODS_NO_PLACES_UNSORTED: [
    {
      id: "rapipago",
      name: "Rapipago",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "pagofacil",
      name: "Pago Fácil",
      payment_type_id: "ticket",
      status: "active"
    }
  ],
  PAYMENT_OPTIONS_WITH_SORT: [
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active",
      sort: 2
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active",
      sort: 14
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active",
      sort: 1
    },
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active",
      sort: 4
    }
  ],
  PAYMENT_OPTIONS_WITH_SORT_SORTED: [
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active",
      sort: 1
    },
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active",
      sort: 2
    },
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active",
      sort: 4
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active",
      sort: 14
    }
  ],
  PAYMENT_OPTIONS_WITH_NULL_SORT: [
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active",
      sort: 4
    },
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active",
      sort: null
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active",
      sort: 14
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active",
      sort: 1
    }
  ],
  PAYMENT_OPTIONS_WITH_NULL_SORT_SORTED: [
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active",
      sort: 1
    },
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active",
      sort: 4
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active",
      sort: 14
    },
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active",
      sort: null
    }
  ],
  PAYMENT_OPTIONS_SOME_WITHOUT_SORT: [
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active",
      sort: 4
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active",
      sort: null
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active",
      sort: 14
    }
  ],
  PAYMENT_OPTIONS_SOME_WITHOUT_SORT_SORTED: [
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active",
      sort: 4
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active",
      sort: 14
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active",
      sort: null
    }
  ],
  PAYMENT_OPTIONS_ALL_WITHOUT_SORT: [
    {
      name: "7  Eleven",
      payment_option_id: "7eleven",
      status: "active"
    },
    {
      name: "Sorjana",
      payment_option_id: "sorjana",
      status: "active"
    },
    {
      id: "oxxo",
      name: "OXXO",
      payment_type_id: "ticket",
      status: "active"
    },
    {
      id: "bancomer",
      name: "BBVA Bancomer",
      payment_type_id: "atm",
      status: "active"
    }
  ],
  ENABLED_METHODS_OFF: ["ticket", "atm", "bank_transfer"]
};
