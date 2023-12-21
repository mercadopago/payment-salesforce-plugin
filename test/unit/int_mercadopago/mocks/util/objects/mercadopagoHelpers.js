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
  }
};
