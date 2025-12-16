module.exports = {
  getTotalGrossPrice: () => ({
    available: true,
    currencyCode: "BRL",
    decimalValue: 149.99,
    value: 149.99,
    valueOrNull: 149.99
  }),
  getGiftCertificatePaymentInstruments: () => ({
    toArray: () => ({
      forEach: () => {}
    })
  }),
  getPaymentInstruments: () => ({
    empty: true,
    length: 0,
    toArray: () => []
  }),
  removePaymentInstrument: () => ({
    empty: true,
    length: 0
  }),
  createPaymentInstrument: () => ({
    setCreditCardExpirationMonth: () => {},
    setCreditCardExpirationYear: () => {},
    setCreditCardNumber: () => {},
    setCreditCardType: () => {},
    setCreditCardToken: () => {},
    custom: {
      customerDocType: "",
      customerDocNumber: "",
      mercadoPagoPaymentTypeId: "",
      paymentTypeId: "",
      cardTypeName: "",
      payerEmail: "",
      payerDocType: "",
      payerDocNumber: "",
      saveCardToWallet: false
    }
  })
};
