const guestUser = {
  email: process.env.GUEST_EMAIL,
  firstName: "John",
  lastName: "Doe",
  phone: "9234567890",
  address: {
    country: "US",
    state: "AE",
    street: "Rua Tabapuã",
    city: "San Francisco",
    zipcode: "12345"
  }
};

const cleanUser = {
  ...guestUser,
  email: process.env.CLEAN_USER_EMAIL,
  pass: process.env.CLEAN_USER_PASS,
};


export { guestUser, cleanUser };