module.exports = {
  getOrder: (orderNumber, orderToken) => ({
    orderNo: orderNumber,
    currentOrderNo: orderNumber,
    orderToken: orderToken,
    custom: {
      paymentStatus: "",
      paymentReport: ""
    },
    setPaymentStatus: (value) => ({
      status: value
    }),
    addNote: (value) => ({
      notes: value
    })
  })
};
