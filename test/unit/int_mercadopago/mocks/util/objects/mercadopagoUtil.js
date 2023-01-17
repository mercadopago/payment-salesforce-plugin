module.exports = {
  validateDocument: (value) => (value === "12345678909" ? value : false),
  PAYMENT_METHOD: {
    credit_card: "CREDIT_CARD",
    pix: "PIX"
  },
  getTotalAmount: () => 149.99,
  parseOrderStatus: () => "pending"
};
