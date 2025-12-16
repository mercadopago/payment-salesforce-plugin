module.exports = {
  getOrder: (orderNumber, orderToken) => ({
    orderNo: orderNumber,
    currentOrderNo: orderNumber,
    orderToken: orderToken,
    custom: {
      paymentStatus: "",
      paymentReport: ""
    },
    customer: {
      authenticated: false,
      registered: false
    },
    paymentInstrument: {
      custom: {
        saveCardToWallet: false
      }
    },
    setPaymentStatus: (value) => ({
      status: value
    }),
    addNote: (value) => ({
      notes: value
    })
  })
};
