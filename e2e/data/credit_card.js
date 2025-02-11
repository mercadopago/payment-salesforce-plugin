const amexApro = {
  name: "APRO",
  number: process.env.CC_AMEX,
  month: "11",
  year: "2025",
  code: "1234",
  document: process.env.CPF,
  cardType: 'amex',
  cardName: 'American Express'
};

const masterApro = {
  ...amexApro,
  number: process.env.CC_MASTER,
  code: "123",
  cardType: 'master',
  cardName: 'Mastercard',
  document: process.env.DOC_OUTRO,
};

const masterAproBr = {
  ...masterApro,
  document: process.env.CPF,
};

const masterAproDocOther = {
  ...amexApro,
  number: process.env.CC_MASTER,
  code: "123",
  cardType: 'master',
  cardName: 'Mastercard'
};

export { amexApro, masterApro, masterAproBr };
