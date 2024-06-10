const amexApro = {
  name: "APRO",
  number: process.env.CC_AMEX,
  month: "11",
  year: "2025",
  code: "1234",
  document: process.env.CPF
};

const masterApro = {
  ...amexApro,
  number: process.env.CC_MASTER
};

export { amexApro, masterApro };
